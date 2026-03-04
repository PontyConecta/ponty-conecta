import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id, message, proposed_rate } = await req.json();
    console.log(`[applyToCampaign] userId=${user.id} campaignId=${campaign_id}`);
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // 1. Find creator profile
    const creators = await base44.entities.Creator.filter({ user_id: user.id });
    if (creators.length === 0) {
      return Response.json({ error: 'Creator profile not found' }, { status: 404 });
    }
    const creator = creators[0];

    // 2. Check subscription
    const status = creator.subscription_status || 'starter';
    let isPremium = status === 'premium' || status === 'legacy';
    if (status === 'trial' && creator.trial_end_date) {
      isPremium = new Date(creator.trial_end_date) > new Date();
    }
    if (!isPremium) {
      return Response.json({ error: 'Subscription required to apply' }, { status: 403 });
    }

    // 3. Fetch campaign
    const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const campaign = campaigns[0];

    if (campaign.status !== 'active') {
      return Response.json({ error: `Campaign is not active (status: ${campaign.status})` }, { status: 400 });
    }

    // 4. Check if already applied
    const existingApps = await base44.entities.Application.filter({
      campaign_id: campaign_id,
      creator_id: creator.id
    });
    if (existingApps.length > 0) {
      return Response.json({ error: 'You have already applied to this campaign' }, { status: 400 });
    }

    // 5. Execute atomic operations with rollback
    const rollbackActions = [];

    try {
      // Step A: Create application
      console.log(`[applyToCampaign] Creating application for creator ${creator.id} on campaign ${campaign_id}`);
      const application = await base44.entities.Application.create({
        campaign_id: campaign_id,
        creator_id: creator.id,
        brand_id: campaign.brand_id,
        message: message || '',
        proposed_rate: proposed_rate ? parseFloat(proposed_rate) : null,
        status: 'pending'
      });
      rollbackActions.push(async () => {
        console.log(`[applyToCampaign] ROLLBACK: deleting application ${application.id}`);
        await base44.entities.Application.delete(application.id);
      });

      // Step B: Increment total_applications
      const currentTotal = campaign.total_applications || 0;
      console.log(`[applyToCampaign] Incrementing total_applications on campaign ${campaign_id}: ${currentTotal} -> ${currentTotal + 1}`);
      const updatedCampaign = await base44.entities.Campaign.update(campaign_id, {
        total_applications: currentTotal + 1
      });

      console.log(`[applyToCampaign] SUCCESS: application=${application.id}, campaign=${campaign_id}, total_applications=${currentTotal + 1}`);

      return Response.json({
        success: true,
        application: application,
        campaign: updatedCampaign
      });

    } catch (opError) {
      console.error(`[applyToCampaign] Operation failed, rolling back: ${opError.message}`);
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try {
          await rollbackActions[i]();
        } catch (rollbackError) {
          console.error(`[applyToCampaign] Rollback step ${i} failed: ${rollbackError.message}`);
        }
      }
      return Response.json({ error: 'Operation failed and was rolled back', details: opError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[applyToCampaign] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});