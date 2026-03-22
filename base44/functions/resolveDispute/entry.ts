import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // ── 4. EXECUTE ──
    // 4a. Update dispute
    await base44.asServiceRole.entities.Dispute.update(dispute.id, {
      status: resolution_type,
      resolution: cleanResolution,
      resolved_by: user.email,
      resolved_at: now,
    });

    // 4b. Update delivery based on resolution
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

        // 4c. If creator won → complete application + bump stats
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

    // ── 6. RESPOND ──
    console.log(`[${FN}] Dispute ${dispute_id} resolved as ${resolution_type} by admin ${user.email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});