// Backfill mission progress based on existing data
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const results = [];

  // Get all active missions
  const allMissions = await base44.asServiceRole.entities.Mission.filter({ status: 'active' });
  console.log(`[Backfill] Found ${allMissions.length} active missions to check`);

  for (const mission of allMissions) {
    const { user_id, profile_type, target_action } = mission;
    let actualProgress = 0;

    if (profile_type === 'brand') {
      // Find brand by user_id
      const brands = await base44.asServiceRole.entities.Brand.filter({ user_id });
      if (brands.length === 0) continue;
      const brandId = brands[0].id;

      if (target_action === 'create_campaign') {
        const campaigns = await base44.asServiceRole.entities.Campaign.filter({ brand_id: brandId });
        actualProgress = campaigns.length;
      } else if (target_action === 'accept_application') {
        const apps = await base44.asServiceRole.entities.Application.filter({ brand_id: brandId, status: 'accepted' });
        actualProgress = apps.length;
      } else if (target_action === 'approve_delivery') {
        const deliveries = await base44.asServiceRole.entities.Delivery.filter({ brand_id: brandId, status: 'approved' });
        actualProgress = deliveries.length;
      }
    } else if (profile_type === 'creator') {
      // Find creator by user_id
      const creators = await base44.asServiceRole.entities.Creator.filter({ user_id });
      if (creators.length === 0) continue;
      const creatorId = creators[0].id;

      if (target_action === 'apply_campaign') {
        const apps = await base44.asServiceRole.entities.Application.filter({ creator_id: creatorId });
        actualProgress = apps.length;
      } else if (target_action === 'get_accepted') {
        const apps = await base44.asServiceRole.entities.Application.filter({ creator_id: creatorId, status: 'accepted' });
        actualProgress = apps.length;
      } else if (target_action === 'submit_delivery') {
        const deliveries = await base44.asServiceRole.entities.Delivery.filter({ creator_id: creatorId });
        const submitted = deliveries.filter(d => ['submitted', 'approved', 'closed'].includes(d.status));
        actualProgress = submitted.length;
      }
    }

    // Only update if actual progress is greater than current
    if (actualProgress > (mission.current_progress || 0)) {
      const isComplete = actualProgress >= (mission.target_value || 1);
      const updateData = {
        current_progress: actualProgress,
      };
      if (isComplete) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }
      await base44.asServiceRole.entities.Mission.update(mission.id, updateData);
      console.log(`[Backfill] Updated "${mission.title}" for user ${user_id}: ${mission.current_progress || 0} -> ${actualProgress} ${isComplete ? '(COMPLETED!)' : ''}`);
      results.push({ mission_id: mission.id, title: mission.title, user_id, old: mission.current_progress || 0, new: actualProgress, completed: isComplete });
    }
  }

  console.log(`[Backfill] Done. Updated ${results.length} missions.`);
  return Response.json({ success: true, updated: results.length, details: results });
});