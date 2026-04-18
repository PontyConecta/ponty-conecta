import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, agreed_rate } = await req.json();
    console.log(`[acceptApplication] userId=${user.id} applicationId=${application_id}`);
    if (!application_id) {
      return Response.json({ error: 'application_id is required' }, { status: 400 });
    }

    // 1. Find brand profile and verify ownership
    const brands = await base44.entities.Brand.filter({ user_id: user.id });
    if (brands.length === 0) {
      return Response.json({ error: 'Brand profile not found' }, { status: 404 });
    }
    const brand = brands[0];

    // 2. Fetch application
    const applications = await base44.entities.Application.filter({ id: application_id });
    if (applications.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }
    const application = applications[0];

    // 3. Verify brand owns this application
    if (application.brand_id !== brand.id) {
      return Response.json({ error: 'You do not own this application' }, { status: 403 });
    }

    // 4. Validate current status allows transition to 'accepted'
    if (application.status !== 'pending') {
      return Response.json({ error: `Cannot accept application with status "${application.status}". Must be "pending".` }, { status: 400 });
    }

    // 5. Fetch campaign and validate slots
    const campaigns = await base44.entities.Campaign.filter({ id: application.campaign_id });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const campaign = campaigns[0];

    const currentSlotsFilled = campaign.slots_filled || 0;
    const slotsTotal = campaign.slots_total || 1;

    if (currentSlotsFilled >= slotsTotal) {
      return Response.json({ error: 'Campaign has no available slots' }, { status: 400 });
    }

    if (campaign.status !== 'active' && campaign.status !== 'applications_closed') {
      return Response.json({ error: `Campaign is not accepting applications (status: ${campaign.status})` }, { status: 400 });
    }

    // 6. Execute atomic operations with rollback tracking
    const rollbackActions = [];
    let rate = application.proposed_rate;
    if (agreed_rate !== undefined && agreed_rate !== null && agreed_rate !== '') {
      const parsed = parseFloat(agreed_rate);
      if (isNaN(parsed) || parsed < 0) {
        return Response.json({ error: 'Taxa inválida', code: 'INVALID_RATE' }, { status: 400 });
      }
      rate = parsed;
    }

    try {
      // Re-read campaign to minimize race window
      const freshCampaigns = await base44.entities.Campaign.filter({ id: application.campaign_id });
      const freshCampaign = freshCampaigns[0];
      const freshSlotsFilled = freshCampaign.slots_filled || 0;
      if (freshSlotsFilled >= slotsTotal) {
        return Response.json({ error: 'Campaign slots were just filled' }, { status: 409 });
      }

      // Step A: Update application
      console.log(`[acceptApplication] Updating application ${application_id} to accepted`);
      const updatedApplication = await base44.entities.Application.update(application_id, {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        agreed_rate: rate
      });
      rollbackActions.push(async () => {
        console.log(`[acceptApplication] ROLLBACK: reverting application ${application_id} to pending`);
        await base44.entities.Application.update(application_id, {
          status: 'pending',
          accepted_at: null,
          agreed_rate: null
        });
      });

      // Step B: Increment slots_filled + auto-close if full
      const newSlotsFilled = freshSlotsFilled + 1;
      const shouldAutoClose = newSlotsFilled >= slotsTotal && freshCampaign.status === 'active';
      console.log(`[acceptApplication] Incrementing slots_filled on campaign ${campaign.id}: ${freshSlotsFilled} -> ${newSlotsFilled}${shouldAutoClose ? ' (auto-closing)' : ''}`);
      const campaignUpdate = { slots_filled: newSlotsFilled };
      if (shouldAutoClose) campaignUpdate.status = 'applications_closed';
      const updatedCampaign = await base44.entities.Campaign.update(campaign.id, campaignUpdate);
      rollbackActions.push(async () => {
        console.log(`[acceptApplication] ROLLBACK: reverting slots_filled on campaign ${campaign.id}`);
        const rollbackData = { slots_filled: freshSlotsFilled };
        if (shouldAutoClose) rollbackData.status = 'active';
        await base44.entities.Campaign.update(campaign.id, rollbackData);
      });
      if (shouldAutoClose) {
        console.log(`[acceptApplication] Auto-closed applications: all ${slotsTotal} slots filled`);
      }

      // Step C: Create delivery
      console.log(`[acceptApplication] Creating delivery for application ${application_id}`);
      const delivery = await base44.entities.Delivery.create({
        application_id: application_id,
        campaign_id: campaign.id,
        creator_id: application.creator_id,
        brand_id: brand.id,
        status: 'pending',
        deadline: campaign.deadline
      });

      console.log(`[acceptApplication] SUCCESS: application=${application_id}, delivery=${delivery.id}, slots=${freshSlotsFilled + 1}/${slotsTotal}`);

      // FIX #12: Notify creator that their application was accepted
      try {
        await base44.functions.invoke('createNotification', {
          user_id: application.creator_id ? (await base44.entities.Creator.filter({ id: application.creator_id }))[0]?.user_id : null,
          notification_key: `app-accepted-${application_id}`,
          type: 'application_accepted',
          title: 'Candidatura aceita!',
          message: `Sua candidatura para "${campaign.title}" foi aceita. Agora envie sua entrega!`,
          action_url: `/MyDeliveries?deliveryId=${delivery.id}`,
          related_entity_id: application_id,
        });
      } catch (e) { console.warn('[acceptApplication] Notification failed (non-blocking):', e.message); }

      return Response.json({
        success: true,
        application: updatedApplication,
        campaign: updatedCampaign,
        delivery: delivery,
        slotsFilled: freshSlotsFilled + 1,
        slotsTotal: slotsTotal
      });

    } catch (opError) {
      // Rollback in reverse order
      console.error(`[acceptApplication] Operation failed, rolling back: ${opError.message}`);
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try {
          await rollbackActions[i]();
        } catch (rollbackError) {
          console.error(`[acceptApplication] Rollback step ${i} failed: ${rollbackError.message}`);
        }
      }
      return Response.json({ error: 'Operation failed and was rolled back', details: opError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[acceptApplication] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});