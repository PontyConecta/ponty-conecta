import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Template: Auth → Validate → Ownership → Execute → Audit → Respond ───

const FN = 'resolveDispute';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

const VALID_RESOLUTION_TYPES = ['resolved_creator_favor', 'resolved_brand_favor'];
const RESOLVABLE_STATUSES = ['open', 'under_review'];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH (admin-only) ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);
    if (user.role !== 'admin') return err('Forbidden: Admin access required', 'FORBIDDEN', 403);

    // ── 2. VALIDATE INPUT ──
    const { dispute_id, resolution, resolution_type } = await req.json();

    if (!dispute_id || !resolution || !resolution_type) {
      return err('Missing required fields: dispute_id, resolution, resolution_type', 'MISSING_FIELDS');
    }
    if (typeof resolution !== 'string' || resolution.trim().length === 0) {
      return err('Resolution must be a non-empty string', 'INVALID_INPUT');
    }
    if (!VALID_RESOLUTION_TYPES.includes(resolution_type)) {
      return err('Invalid resolution_type', 'INVALID_INPUT');
    }

    // ── 3. FETCH & VALIDATE STATE ──
    const disputes = await base44.asServiceRole.entities.Dispute.filter({ id: dispute_id });
    if (disputes.length === 0) return err('Dispute not found', 'NOT_FOUND', 404);
    const dispute = disputes[0];

    if (!RESOLVABLE_STATUSES.includes(dispute.status)) {
      return err(`Cannot resolve dispute with status "${dispute.status}"`, 'INVALID_TRANSITION');
    }

    const now = new Date().toISOString();
    const cleanResolution = resolution.trim();

    // ── 4. EXECUTE (with rollback tracking) ──
    const rollbackActions = [];

    try {
      // 4a. Update dispute
      await base44.asServiceRole.entities.Dispute.update(dispute.id, {
        status: resolution_type,
        resolution: cleanResolution,
        resolved_by: user.email,
        resolved_at: now,
      });
      rollbackActions.push(async () => {
        await base44.asServiceRole.entities.Dispute.update(dispute.id, {
          status: dispute.status,
          resolution: dispute.resolution || null,
          resolved_by: dispute.resolved_by || null,
          resolved_at: dispute.resolved_at || null,
        });
      });

      // 4b. Update delivery based on resolution
      if (dispute.delivery_id) {
        const deliveries = await base44.asServiceRole.entities.Delivery.filter({ id: dispute.delivery_id });
        if (deliveries.length > 0) {
          const delivery = deliveries[0];
          const newDeliveryStatus = resolution_type === 'resolved_creator_favor' ? 'approved' : 'closed';

          const deliveryUpdate = {
            status: newDeliveryStatus,
            approved_at: resolution_type === 'resolved_creator_favor' ? now : delivery.approved_at,
            payment_status: resolution_type === 'resolved_creator_favor' ? 'completed' : 'disputed',
          };
          if (resolution_type === 'resolved_creator_favor') {
            deliveryUpdate.on_time = delivery.deadline
              ? new Date(delivery.submitted_at || delivery.updated_date) <= new Date(delivery.deadline)
              : true;
          }
          await base44.asServiceRole.entities.Delivery.update(delivery.id, deliveryUpdate);
          rollbackActions.push(async () => {
            await base44.asServiceRole.entities.Delivery.update(delivery.id, {
              status: delivery.status,
              approved_at: delivery.approved_at,
              payment_status: delivery.payment_status,
              on_time: delivery.on_time,
            });
          });

          // 4c. If creator won → complete application + recalculate on_time_rate
          if (resolution_type === 'resolved_creator_favor') {
            if (delivery.application_id) {
              const apps = await base44.asServiceRole.entities.Application.filter({ id: delivery.application_id });
              const oldAppStatus = apps[0]?.status;
              await base44.asServiceRole.entities.Application.update(delivery.application_id, {
                status: 'completed',
              });
              rollbackActions.push(async () => {
                if (oldAppStatus) {
                  await base44.asServiceRole.entities.Application.update(delivery.application_id, { status: oldAppStatus });
                }
              });
            }
            if (delivery.creator_id) {
              const creators = await base44.asServiceRole.entities.Creator.filter({ id: delivery.creator_id });
              if (creators.length > 0) {
                const creator = creators[0];
                const allApproved = await base44.asServiceRole.entities.Delivery.filter({ creator_id: creator.id, status: 'approved' });
                const onTimeDels = allApproved.filter(d => d.on_time === true);
                const newRate = allApproved.length > 0 ? Math.round((onTimeDels.length / allApproved.length) * 100) : 100;
                await base44.asServiceRole.entities.Creator.update(creator.id, {
                  on_time_rate: newRate,
                });
                rollbackActions.push(async () => {
                  await base44.asServiceRole.entities.Creator.update(creator.id, {
                    on_time_rate: creator.on_time_rate,
                  });
                });
              }
            }
          }
        }
      }
    } catch (opError) {
      console.error(`[${FN}] Operation failed, rolling back: ${opError.message}`);
      for (let i = rollbackActions.length - 1; i >= 0; i--) {
        try { await rollbackActions[i](); } catch (rbErr) {
          console.error(`[${FN}] Rollback step ${i} failed: ${rbErr.message}`);
        }
      }
      return err('Operation failed and was rolled back', 'INTERNAL_ERROR', 500);
    }

    // ── 5. AUDIT LOG (always) ──
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: user.id,
      admin_email: user.email,
      action: 'dispute_resolved',
      target_entity_id: dispute.id,
      target_user_id: dispute.raised_by === 'brand' ? dispute.brand_id : dispute.creator_id,
      details: `Disputa resolvida: ${resolution_type === 'resolved_creator_favor' ? 'Favorável ao Criador' : 'Favorável à Marca'}.`,
      note: cleanResolution,
      timestamp: now,
    });

    // FIX #12: Notify both brand and creator about dispute resolution
    try {
      const resLabel = resolution_type === 'resolved_creator_favor' ? 'a favor do criador' : 'a favor da marca';
      if (dispute.brand_id) {
        const brands = await base44.asServiceRole.entities.Brand.filter({ id: dispute.brand_id });
        if (brands[0]?.user_id) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_id: brands[0].user_id,
            notification_key: `dispute-resolved-brand-${dispute_id}`,
            type: 'campaign',
            title: 'Disputa resolvida',
            message: `A disputa foi resolvida ${resLabel}.`,
            related_entity_id: dispute_id,
          });
        }
      }
      if (dispute.creator_id) {
        const creators = await base44.asServiceRole.entities.Creator.filter({ id: dispute.creator_id });
        if (creators[0]?.user_id) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            user_id: creators[0].user_id,
            notification_key: `dispute-resolved-creator-${dispute_id}`,
            type: 'campaign',
            title: 'Disputa resolvida',
            message: `A disputa foi resolvida ${resLabel}.`,
            related_entity_id: dispute_id,
          });
        }
      }
    } catch (e) { console.warn('[resolveDispute] Notification failed (non-blocking):', e.message); }

    // ── 6. RESPOND ──
    console.log(`[${FN}] Dispute ${dispute_id} resolved as ${resolution_type} by admin ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});