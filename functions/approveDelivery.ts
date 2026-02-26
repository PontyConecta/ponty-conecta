import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { delivery_id } = await req.json();
    if (!delivery_id) {
      return Response.json({ error: 'delivery_id is required' }, { status: 400 });
    }

    // 1. Find brand profile and verify ownership
    const brands = await base44.entities.Brand.filter({ user_id: user.id });
    if (brands.length === 0) {
      return Response.json({ error: 'Brand profile not found' }, { status: 404 });
    }
    const brand = brands[0];

    // 2. Fetch delivery
    const deliveries = await base44.entities.Delivery.filter({ id: delivery_id });
    if (deliveries.length === 0) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 });
    }
    const delivery = deliveries[0];

    // 3. Verify brand owns this delivery
    if (delivery.brand_id !== brand.id) {
      return Response.json({ error: 'You do not own this delivery' }, { status: 403 });
    }

    // 4. Validate current status
    if (delivery.status !== 'submitted') {
      return Response.json({ error: `Cannot approve delivery with status "${delivery.status}". Must be "submitted".` }, { status: 400 });
    }

    // 5. Fetch related entities
    const [applicationsResult, creatorsResult] = await Promise.all([
      base44.entities.Application.filter({ id: delivery.application_id }),
      base44.entities.Creator.filter({ id: delivery.creator_id })
    ]);

    const application = applicationsResult[0];
    const creator = creatorsResult[0];

    if (!application) {
      return Response.json({ error: 'Related application not found' }, { status: 404 });
    }

    // 6. Execute atomic operations with rollback
    const rollbackActions = [];
    const isOnTime = delivery.deadline ? new Date() <= new Date(delivery.deadline) : true;

    try {
      // Step A: Approve delivery
      console.log(`[approveDelivery] Approving delivery ${delivery_id}`);
      const updatedDelivery = await base44.entities.Delivery.update(delivery_id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        on_time: isOnTime
      });
      rollbackActions.push(async () => {
        console.log(`[approveDelivery] ROLLBACK: reverting delivery ${delivery_id} to submitted`);
        await base44.entities.Delivery.update(delivery_id, {
          status: 'submitted',
          approved_at: null,
          reviewed_at: null,
          on_time: null
        });
      });

      // Step B: Complete application
      console.log(`[approveDelivery] Completing application ${delivery.application_id}`);
      const updatedApplication = await base44.entities.Application.update(delivery.application_id, {
        status: 'completed'
      });
      rollbackActions.push(async () => {
        console.log(`[approveDelivery] ROLLBACK: reverting application ${delivery.application_id} to accepted`);
        await base44.entities.Application.update(delivery.application_id, {
          status: 'accepted'
        });
      });

      // Step C: Increment creator's completed_campaigns
      let updatedCreator = null;
      if (creator) {
        const newCount = (creator.completed_campaigns || 0) + 1;
        console.log(`[approveDelivery] Updating creator ${creator.id} completed_campaigns: ${creator.completed_campaigns || 0} -> ${newCount}`);
        updatedCreator = await base44.entities.Creator.update(creator.id, {
          completed_campaigns: newCount
        });
        rollbackActions.push(async () => {
          console.log(`[approveDelivery] ROLLBACK: reverting creator ${creator.id} completed_campaigns`);
          await base44.entities.Creator.update(creator.id, {
            completed_campaigns: creator.completed_campaigns || 0
          });
        });
      }

      console.log(`[approveDelivery] SUCCESS: delivery=${delivery_id}, application=${delivery.application_id}, on_time=${isOnTime}`);

      return Response.json({
        success: true,
        delivery: updatedDelivery,
        application: updatedApplication,
        creator: updatedCreator
      });

    } catch (opError) {
      console.error(`[approveDelivery] Operation failed, rolling back: ${opError.message}`);
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try {
          await rollbackActions[i]();
        } catch (rollbackError) {
          console.error(`[approveDelivery] Rollback step ${i} failed: ${rollbackError.message}`);
        }
      }
      return Response.json({ error: 'Operation failed and was rolled back', details: opError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[approveDelivery] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});