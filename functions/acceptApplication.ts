import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { application_id, agreed_rate } = await req.json();
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
    const rate = agreed_rate ? parseFloat(agreed_rate) : application.proposed_rate;

    try {
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

      // Step B: Increment slots_filled
      console.log(`[acceptApplication] Incrementing slots_filled on campaign ${campaign.id}: ${currentSlotsFilled} -> ${currentSlotsFilled + 1}`);
      const updatedCampaign = await base44.entities.Campaign.update(campaign.id, {
        slots_filled: currentSlotsFilled + 1
      });
      rollbackActions.push(async () => {
        console.log(`[acceptApplication] ROLLBACK: reverting slots_filled on campaign ${campaign.id}`);
        await base44.entities.Campaign.update(campaign.id, {
          slots_filled: currentSlotsFilled
        });
      });

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

      console.log(`[acceptApplication] SUCCESS: application=${application_id}, delivery=${delivery.id}, slots=${currentSlotsFilled + 1}/${slotsTotal}`);

      return Response.json({
        success: true,
        application: updatedApplication,
        campaign: updatedCampaign,
        delivery: delivery,
        slotsFilled: currentSlotsFilled + 1,
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