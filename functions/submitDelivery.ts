import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Respond ───

const FN = 'submitDelivery';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { delivery_id, proof_urls, content_urls, proof_notes } = await req.json();

    if (!delivery_id) return err('Missing delivery_id', 'MISSING_FIELDS');
    if (!proof_urls || !Array.isArray(proof_urls) || proof_urls.length === 0) {
      return err('Pelo menos uma prova é obrigatória', 'MISSING_PROOF');
    }

    // Fetch delivery
    const deliveries = await base44.entities.Delivery.filter({ id: delivery_id });
    if (deliveries.length === 0) {
      return err('Delivery not found', 'NOT_FOUND', 404);
    }
    const delivery = deliveries[0];

    // ── 3. OWNERSHIP ──
    const creators = await base44.entities.Creator.filter({ user_id: user.id });
    if (creators.length === 0 || creators[0].id !== delivery.creator_id) {
      return err('Forbidden', 'FORBIDDEN', 403);
    }

    // ── 4. VALIDATE TRANSITION ──
    if (delivery.status !== 'pending') {
      return err('Only pending deliveries can be submitted', 'INVALID_TRANSITION');
    }

    // ── 5. SANITIZE & EXECUTE ──
    const updateData = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      proof_urls: proof_urls.filter(u => typeof u === 'string' && u.trim()),
      content_urls: (Array.isArray(content_urls) ? content_urls : []).filter(u => typeof u === 'string' && u.trim()),
      proof_notes: typeof proof_notes === 'string' ? proof_notes.trim() : '',
      on_time: delivery.deadline ? new Date() <= new Date(delivery.deadline) : true,
    };

    await base44.entities.Delivery.update(delivery_id, updateData);

    // ── 6. RESPOND ──
    console.log(`[${FN}] Delivery ${delivery_id} submitted by creator ${creators[0].id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});