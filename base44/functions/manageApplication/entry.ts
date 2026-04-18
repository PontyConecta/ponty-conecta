import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Execute → Respond ───

const FN = 'manageApplication';

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
    const { action, application_id, data } = await req.json();

    if (!action || !application_id) {
      return err('Missing action or application_id', 'MISSING_FIELDS');
    }

    // Fetch application
    const applications = await base44.entities.Application.filter({ id: application_id });
    if (applications.length === 0) {
      return err('Application not found', 'NOT_FOUND', 404);
    }
    const application = applications[0];

    // ── ACTION: WITHDRAW (creator only) ──
    if (action === 'withdraw') {
      // ── 3. OWNERSHIP ──
      const creators = await base44.entities.Creator.filter({ user_id: user.id });
      if (creators.length === 0 || creators[0].id !== application.creator_id) {
        return err('Forbidden', 'FORBIDDEN', 403);
      }

      // ── 4. VALIDATE TRANSITION ──
      if (!['pending', 'accepted'].includes(application.status)) {
        return err('Só é possível cancelar candidaturas pendentes ou aceitas', 'INVALID_TRANSITION');
      }

      const wasAccepted = application.status === 'accepted';

      // ── 5. EXECUTE ──
      await base44.entities.Application.update(application_id, { status: 'withdrawn' });

      // If was accepted, decrement slots and close pending deliveries
      if (wasAccepted) {
        const campaigns = await base44.entities.Campaign.filter({ id: application.campaign_id });
        if (campaigns.length > 0) {
          const camp = campaigns[0];
          const newSlots = Math.max(0, (camp.slots_filled || 0) - 1);
          await base44.entities.Campaign.update(camp.id, { slots_filled: newSlots });
          // Reopen if was auto-closed due to full slots
          if (camp.status === 'applications_closed' && newSlots < (camp.slots_total || 1)) {
            await base44.entities.Campaign.update(camp.id, { status: 'active' });
          }
        }
        const deliveries = await base44.entities.Delivery.filter({ application_id: application.id });
        for (const del of deliveries) {
          if (del.status === 'pending' || del.status === 'submitted') {
            await base44.entities.Delivery.update(del.id, { status: 'closed' });
          }
        }
      }

      console.log(`[${FN}] Application ${application_id} withdrawn by creator ${creators[0].id} (was ${wasAccepted ? 'accepted' : 'pending'})`);
      return Response.json({ success: true });
    }

    // ── ACTION: REJECT (brand only) ──
    if (action === 'reject') {
      // ── 3. OWNERSHIP ──
      const brands = await base44.entities.Brand.filter({ user_id: user.id });
      if (brands.length === 0) {
        return err('Brand not found', 'NOT_FOUND', 404);
      }
      if (brands[0].id !== application.brand_id) {
        return err('Forbidden', 'FORBIDDEN', 403);
      }

      // ── 4. VALIDATE TRANSITION ──
      if (!['pending', 'accepted'].includes(application.status)) {
        return err('Only pending or accepted applications can be rejected', 'INVALID_TRANSITION');
      }

      const wasAccepted = application.status === 'accepted';

      // ── 5. EXECUTE ──
      await base44.entities.Application.update(application_id, {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: (typeof data?.rejection_reason === 'string' ? data.rejection_reason.trim() : '') || '',
      });

      // If was accepted, decrement slots_filled
      if (wasAccepted) {
        const campaigns = await base44.entities.Campaign.filter({ id: application.campaign_id });
        if (campaigns.length > 0) {
          await base44.entities.Campaign.update(campaigns[0].id, {
            slots_filled: Math.max(0, (campaigns[0].slots_filled || 0) - 1)
          });
        }
      }

      console.log(`[${FN}] Application ${application_id} rejected by brand ${brands[0].id}`);
      return Response.json({ success: true });
    }

    return err('Invalid action. Use withdraw or reject.', 'INVALID_ACTION');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});