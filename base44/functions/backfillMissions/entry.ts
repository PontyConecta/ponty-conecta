// Backfill mission progress based on existing data
// FIX #3: Idempotent — sets absolute progress, never increments. Paginated.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BATCH_SIZE = 100;

async function fetchPaginated(entityApi, filter, sort) {
  const all = [];
  let page = 0;
  while (true) {
    const batch = await entityApi.filter(filter, sort || '-created_date', BATCH_SIZE, page * BATCH_SIZE);
    all.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    page++;
    if (page > 100) break; // safety: 10k max
  }
  return all;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const batchLimit = Math.min(body.limit || 50, 100); // process max 100 at a time
  const offset = body.offset || 0;

  const results = [];

  // Get active missions in batches (paginated by caller)
  const allMissions = await base44.asServiceRole.entities.Mission.filter(
    { status: 'active' }, '-created_date', batchLimit, offset
  );
  console.log(`[Backfill] Processing ${allMissions.length} active missions (offset=${offset}, limit=${batchLimit})`);

  for (const mission of allMissions) {
    const { user_id, profile_type, target_action } = mission;
    let actualProgress = 0;

    if (profile_type === 'brand') {
      const brands = await base44.asServiceRole.entities.Brand.filter({ user_id });
      if (brands.length === 0) continue;
      const brandId = brands[0].id;

      if (target_action === 'create_campaign') {
        const campaigns = await fetchPaginated(base44.asServiceRole.entities.Campaign, { brand_id: brandId });
        actualProgress = campaigns.length;
      } else if (target_action === 'accept_application') {
        const apps = await fetchPaginated(base44.asServiceRole.entities.Application, { brand_id: brandId, status: 'accepted' });
        actualProgress = apps.length;
      } else if (target_action === 'approve_delivery') {
        const deliveries = await fetchPaginated(base44.asServiceRole.entities.Delivery, { brand_id: brandId, status: 'approved' });
        actualProgress = deliveries.length;
      }
    } else if (profile_type === 'creator') {
      const creators = await base44.asServiceRole.entities.Creator.filter({ user_id });
      if (creators.length === 0) continue;
      const creatorId = creators[0].id;

      if (target_action === 'apply_campaign') {
        const apps = await fetchPaginated(base44.asServiceRole.entities.Application, { creator_id: creatorId });
        actualProgress = apps.length;
      } else if (target_action === 'get_accepted') {
        const apps = await fetchPaginated(base44.asServiceRole.entities.Application, { creator_id: creatorId, status: 'accepted' });
        actualProgress = apps.length;
      } else if (target_action === 'submit_delivery') {
        const deliveries = await fetchPaginated(base44.asServiceRole.entities.Delivery, { creator_id: creatorId });
        const submitted = deliveries.filter(d => ['submitted', 'approved', 'closed'].includes(d.status));
        actualProgress = submitted.length;
      }
    }

    // Idempotent: set absolute progress, only update if different
    if (actualProgress !== (mission.current_progress || 0)) {
      const isComplete = actualProgress >= (mission.target_value || 1);
      const updateData = { current_progress: actualProgress };
      if (isComplete && mission.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
      await base44.asServiceRole.entities.Mission.update(mission.id, updateData);
      console.log(`[Backfill] Updated "${mission.title}" for user ${user_id}: ${mission.current_progress || 0} -> ${actualProgress} ${isComplete ? '(COMPLETED!)' : ''}`);
      results.push({ mission_id: mission.id, title: mission.title, user_id, old: mission.current_progress || 0, new: actualProgress, completed: isComplete });
    }
  }

  console.log(`[Backfill] Done. Updated ${results.length} missions.`);
  return Response.json({ 
    success: true, 
    updated: results.length, 
    processed: allMissions.length,
    has_more: allMissions.length === batchLimit,
    next_offset: offset + allMissions.length,
    details: results 
  });
});