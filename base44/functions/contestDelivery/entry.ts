import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { delivery_id, reason } = await req.json();
    console.log(`[contestDelivery] userId=${user.id} deliveryId=${delivery_id}`);
    if (!delivery_id || !reason) {
      return Response.json({ error: 'delivery_id and reason are required' }, { status: 400 });
    }

    const brands = await base44.entities.Brand.filter({ user_id: user.id });
    if (brands.length === 0) {
      return Response.json({ error: 'Brand profile not found' }, { status: 404 });
    }
    const brand = brands[0];

    const deliveries = await base44.entities.Delivery.filter({ id: delivery_id });
    if (deliveries.length === 0) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 });
    }
    const delivery = deliveries[0];

    if (delivery.brand_id !== brand.id) {
      return Response.json({ error: 'You do not own this delivery' }, { status: 403 });
    }

    if (delivery.status !== 'submitted') {
      return Response.json({ error: `Cannot contest delivery with status "${delivery.status}". Must be "submitted".` }, { status: 400 });
    }

    const rollbackActions = [];

    try {
      console.log(`[contestDelivery] Updating delivery ${delivery_id} to in_dispute`);
      const updatedDelivery = await base44.entities.Delivery.update(delivery_id, {
        status: 'in_dispute',
        contested_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        contest_reason: reason
      });
      rollbackActions.push(async () => {
        console.log(`[contestDelivery] ROLLBACK: reverting delivery ${delivery_id} to submitted`);
        await base44.entities.Delivery.update(delivery_id, {
          status: 'submitted',
          contested_at: null,
          reviewed_at: null,
          contest_reason: null
        });
      });

      console.log(`[contestDelivery] Creating dispute for delivery ${delivery_id}`);
      const dispute = await base44.entities.Dispute.create({
        delivery_id: delivery_id,
        campaign_id: delivery.campaign_id,
        brand_id: brand.id,
        creator_id: delivery.creator_id,
        raised_by: 'brand',
        reason: reason,
        status: 'open',
        brand_statement: reason
      });

      console.log(`[contestDelivery] SUCCESS: delivery=${delivery_id}, dispute=${dispute.id}`);

      return Response.json({
        success: true,
        delivery: updatedDelivery,
        dispute: dispute
      });

    } catch (opError) {
      console.error(`[contestDelivery] Operation failed, rolling back: ${opError.message}`);
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try {
          await rollbackActions[i]();
        } catch (rollbackError) {
          console.error(`[contestDelivery] Rollback step ${i} failed: ${rollbackError.message}`);
        }
      }
      return Response.json({ error: 'Operation failed and was rolled back', details: opError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('[contestDelivery] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});