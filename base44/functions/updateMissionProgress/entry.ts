// Mission progress tracker - auto-updates missions on entity events
// FIX #1: Idempotency via event_id dedup using entity_id+eventType+status as dedup key
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { event, data, old_data } = body;

  // Validate event source — only allow known entity types
  const ALLOWED_ENTITIES = ['Campaign', 'Application', 'Delivery'];
  if (!event?.entity_name || !ALLOWED_ENTITIES.includes(event.entity_name)) {
    return Response.json({ error: 'Invalid event source' }, { status: 403 });
  }

  if (!event || !data) {
    return Response.json({ error: 'Missing event or data' }, { status: 400 });
  }

  const { type: eventType, entity_name, entity_id } = event;

  // ── IDEMPOTENCY: Build a dedup key from entity_id + eventType + relevant status ──
  const dedupKey = `mission_${entity_name}_${entity_id}_${eventType}_${data.status || 'none'}`;

  console.log(`[MissionProgress] Event: ${eventType} on ${entity_name} (${entity_id}), dedupKey: ${dedupKey}`);

  // Check if we already processed this exact event
  const existing = await base44.asServiceRole.entities.AuditLog.filter({ note: dedupKey });
  if (existing.length > 0) {
    console.log(`[MissionProgress] Already processed: ${dedupKey}. Skipping.`);
    return Response.json({ success: true, skipped: true, reason: 'already_processed' });
  }

  const updates = [];

  // === CAMPAIGN CREATED (brand mission: create_campaign) ===
  if (entity_name === 'Campaign' && eventType === 'create') {
    const brandId = data.brand_id;
    if (brandId) {
      const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
      if (brands.length > 0) {
        updates.push({ user_id: brands[0].user_id, profile_type: 'brand', target_action: 'create_campaign' });
      }
    }
  }

  // === APPLICATION CREATED (creator mission: apply_campaign) ===
  if (entity_name === 'Application' && eventType === 'create') {
    const creatorId = data.creator_id;
    if (creatorId) {
      const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
      if (creators.length > 0) {
        updates.push({ user_id: creators[0].user_id, profile_type: 'creator', target_action: 'apply_campaign' });
      }
    }
  }

  // === APPLICATION ACCEPTED ===
  if (entity_name === 'Application' && eventType === 'update') {
    const wasNotAccepted = !old_data || old_data.status !== 'accepted';
    const isNowAccepted = data.status === 'accepted';

    if (wasNotAccepted && isNowAccepted) {
      // Brand mission: accept_application
      const brandId = data.brand_id;
      if (brandId) {
        const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
        if (brands.length > 0) {
          updates.push({ user_id: brands[0].user_id, profile_type: 'brand', target_action: 'accept_application' });
        }
      }
      // Creator mission: get_accepted
      const creatorId = data.creator_id;
      if (creatorId) {
        const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
        if (creators.length > 0) {
          updates.push({ user_id: creators[0].user_id, profile_type: 'creator', target_action: 'get_accepted' });
        }
      }
    }
  }

  // === DELIVERY SUBMITTED / APPROVED ===
  if (entity_name === 'Delivery' && eventType === 'update') {
    const wasNotSubmitted = !old_data || old_data.status !== 'submitted';
    const isNowSubmitted = data.status === 'submitted';

    if (wasNotSubmitted && isNowSubmitted) {
      const creatorId = data.creator_id;
      if (creatorId) {
        const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
        if (creators.length > 0) {
          updates.push({ user_id: creators[0].user_id, profile_type: 'creator', target_action: 'submit_delivery' });
        }
      }
    }

    const wasNotApproved = !old_data || old_data.status !== 'approved';
    const isNowApproved = data.status === 'approved';

    if (wasNotApproved && isNowApproved) {
      const brandId = data.brand_id;
      if (brandId) {
        const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
        if (brands.length > 0) {
          updates.push({ user_id: brands[0].user_id, profile_type: 'brand', target_action: 'approve_delivery' });
        }
      }
    }
  }

  if (updates.length === 0) {
    return Response.json({ success: true, updates: [] });
  }

  // ── Record dedup marker BEFORE processing (prevents double-fire) ──
  await base44.asServiceRole.entities.AuditLog.create({
    admin_id: 'system',
    admin_email: 'system@ponty.app',
    action: 'feedback_beta_changed', // reuse existing enum value for system events
    target_entity_id: entity_id,
    details: `MissionProgress dedup marker`,
    note: dedupKey,
    timestamp: new Date().toISOString(),
  });

  // Now process all mission updates
  const results = [];
  for (const update of updates) {
    const missions = await base44.asServiceRole.entities.Mission.filter({
      user_id: update.user_id,
      profile_type: update.profile_type,
      target_action: update.target_action,
      status: 'active'
    });

    for (const mission of missions) {
      const newProgress = (mission.current_progress || 0) + 1;
      const isComplete = newProgress >= (mission.target_value || 1);

      const updateData = { current_progress: newProgress };
      if (isComplete) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      await base44.asServiceRole.entities.Mission.update(mission.id, updateData);
      console.log(`[MissionProgress] Updated mission "${mission.title}" for user ${update.user_id}: progress ${newProgress}/${mission.target_value} ${isComplete ? '(COMPLETED!)' : ''}`);
      results.push({ mission_id: mission.id, title: mission.title, newProgress, isComplete });
    }
  }

  return Response.json({ success: true, updates: results });
});