import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { event, data, old_data } = body;

  if (!event || !data) {
    return Response.json({ error: 'Missing event or data' }, { status: 400 });
  }

  const { type: eventType, entity_name, entity_id } = event;

  console.log(`[MissionProgress] Event: ${eventType} on ${entity_name} (${entity_id})`);

  // Map entity events to mission target_actions
  // Brand missions: create_campaign, accept_application, approve_delivery
  // Creator missions: apply_campaign, get_accepted, submit_delivery

  const updates = [];

  // === CAMPAIGN CREATED (brand mission: create_campaign) ===
  if (entity_name === 'Campaign' && eventType === 'create') {
    const brandId = data.brand_id;
    if (brandId) {
      // Find the brand to get user_id
      const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
      if (brands.length > 0) {
        updates.push({
          user_id: brands[0].user_id,
          profile_type: 'brand',
          target_action: 'create_campaign'
        });
      }
    }
  }

  // === APPLICATION CREATED (creator mission: apply_campaign) ===
  if (entity_name === 'Application' && eventType === 'create') {
    const creatorId = data.creator_id;
    if (creatorId) {
      const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
      if (creators.length > 0) {
        updates.push({
          user_id: creators[0].user_id,
          profile_type: 'creator',
          target_action: 'apply_campaign'
        });
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
          updates.push({
            user_id: brands[0].user_id,
            profile_type: 'brand',
            target_action: 'accept_application'
          });
        }
      }

      // Creator mission: get_accepted
      const creatorId = data.creator_id;
      if (creatorId) {
        const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
        if (creators.length > 0) {
          updates.push({
            user_id: creators[0].user_id,
            profile_type: 'creator',
            target_action: 'get_accepted'
          });
        }
      }
    }
  }

  // === DELIVERY SUBMITTED (creator mission: submit_delivery) ===
  if (entity_name === 'Delivery' && eventType === 'create') {
    const creatorId = data.creator_id;
    if (creatorId) {
      const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
      if (creators.length > 0) {
        updates.push({
          user_id: creators[0].user_id,
          profile_type: 'creator',
          target_action: 'submit_delivery'
        });
      }
    }
  }

  // === DELIVERY SUBMITTED via update (status changed to submitted) ===
  if (entity_name === 'Delivery' && eventType === 'update') {
    const wasNotSubmitted = !old_data || old_data.status !== 'submitted';
    const isNowSubmitted = data.status === 'submitted';

    if (wasNotSubmitted && isNowSubmitted) {
      const creatorId = data.creator_id;
      if (creatorId) {
        const creators = await base44.asServiceRole.entities.Creator.filter({ id: creatorId });
        if (creators.length > 0) {
          updates.push({
            user_id: creators[0].user_id,
            profile_type: 'creator',
            target_action: 'submit_delivery'
          });
        }
      }
    }

    // Brand mission: approve_delivery
    const wasNotApproved = !old_data || old_data.status !== 'approved';
    const isNowApproved = data.status === 'approved';

    if (wasNotApproved && isNowApproved) {
      const brandId = data.brand_id;
      if (brandId) {
        const brands = await base44.asServiceRole.entities.Brand.filter({ id: brandId });
        if (brands.length > 0) {
          updates.push({
            user_id: brands[0].user_id,
            profile_type: 'brand',
            target_action: 'approve_delivery'
          });
        }
      }
    }
  }

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

      const updateData = {
        current_progress: newProgress,
      };

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