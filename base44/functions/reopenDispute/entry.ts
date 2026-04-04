import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FN = 'reopenDispute';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // 1. AUTH — admin only
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);
    if (user.role !== 'admin') return err('Forbidden: Admin access required', 'FORBIDDEN', 403);

    // 2. INPUT
    const { dispute_id, reason } = await req.json();
    if (!dispute_id) return err('dispute_id é obrigatório', 'MISSING_FIELDS');
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return err('reason é obrigatório', 'MISSING_FIELDS');
    }

    // 3. FETCH DISPUTE
    const disputes = await base44.asServiceRole.entities.Dispute.filter({ id: dispute_id });
    if (disputes.length === 0) return err('Disputa não encontrada', 'NOT_FOUND', 404);
    const dispute = disputes[0];

    // 4. VALIDATE TRANSITION
    const REOPENABLE = ['resolved_brand_favor', 'resolved_creator_favor'];
    if (!REOPENABLE.includes(dispute.status)) {
      return err(`Não é possível reabrir disputa com status "${dispute.status}"`, 'INVALID_TRANSITION');
    }

    // 5. UPDATE DISPUTE
    await base44.asServiceRole.entities.Dispute.update(dispute_id, {
      status: 'under_review',
      resolution: null,
      resolved_by: null,
      resolved_at: null,
    });

    // 6. AUDIT LOG
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        admin_id: user.id,
        admin_email: user.email,
        action: 'dispute_resolved',
        target_entity_id: dispute_id,
        details: `Disputa reaberta pelo admin. Status anterior: ${dispute.status}`,
        note: reason.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn(`[${FN}] AuditLog failed (non-critical):`, auditErr.message);
    }

    console.log(`[${FN}] Dispute ${dispute_id} reopened by admin ${user.id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});