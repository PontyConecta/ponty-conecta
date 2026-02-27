import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { dispute_id, resolution, resolution_type } = await req.json();

    if (!dispute_id || !resolution || !resolution_type) {
      return Response.json({ error: 'Missing required fields: dispute_id, resolution, resolution_type' }, { status: 400 });
    }

    const validTypes = ['resolved_creator_favor', 'resolved_brand_favor'];
    if (!validTypes.includes(resolution_type)) {
      return Response.json({ error: 'Invalid resolution_type' }, { status: 400 });
    }

    // Fetch dispute
    const disputes = await base44.asServiceRole.entities.Dispute.filter({ id: dispute_id });
    if (disputes.length === 0) {
      return Response.json({ error: 'Dispute not found' }, { status: 404 });
    }
    const dispute = disputes[0];

    // Validate status transition
    if (dispute.status !== 'open' && dispute.status !== 'under_review') {
      return Response.json({ error: `Cannot resolve dispute with status "${dispute.status}"` }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Update dispute
    await base44.asServiceRole.entities.Dispute.update(dispute.id, {
      status: resolution_type,
      resolution: resolution,
      resolved_by: user.email,
      resolved_at: now,
    });

    // 2. Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: user.id,
      admin_email: user.email,
      action: 'dispute_resolved',
      target_entity_id: dispute.id,
      target_user_id: dispute.raised_by === 'brand' ? dispute.brand_id : dispute.creator_id,
      details: `Disputa resolvida: ${resolution_type === 'resolved_creator_favor' ? 'Favorável ao Criador' : 'Favorável à Marca'}.`,
      note: resolution,
      timestamp: now,
    });

    // 3. Update delivery based on resolution
    if (dispute.delivery_id) {
      const deliveries = await base44.asServiceRole.entities.Delivery.filter({ id: dispute.delivery_id });
      if (deliveries.length > 0) {
        const delivery = deliveries[0];
        const newDeliveryStatus = resolution_type === 'resolved_creator_favor' ? 'approved' : 'closed';
        await base44.asServiceRole.entities.Delivery.update(delivery.id, {
          status: newDeliveryStatus,
          approved_at: resolution_type === 'resolved_creator_favor' ? now : delivery.approved_at,
          payment_status: resolution_type === 'resolved_creator_favor' ? 'completed' : 'disputed',
        });

        // 4. If creator won, update application + creator stats
        if (resolution_type === 'resolved_creator_favor') {
          if (delivery.application_id) {
            await base44.asServiceRole.entities.Application.update(delivery.application_id, {
              status: 'completed',
            });
          }

          if (delivery.creator_id) {
            const creators = await base44.asServiceRole.entities.Creator.filter({ id: delivery.creator_id });
            if (creators.length > 0) {
              await base44.asServiceRole.entities.Creator.update(creators[0].id, {
                completed_campaigns: (creators[0].completed_campaigns || 0) + 1,
              });
            }
          }
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[resolveDispute] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});