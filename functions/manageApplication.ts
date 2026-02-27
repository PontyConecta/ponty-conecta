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
      if (application.status !== 'pending') {
        return err('Only pending applications can be withdrawn', 'INVALID_TRANSITION');
      }

      // ── 5. EXECUTE ──
      await base44.entities.Application.update(application_id, { status: 'withdrawn' });
      console.log(`[${FN}] Application ${application_id} withdrawn by creator ${creators[0].id}`);
      return Response.json({ success: true });
    }

    // ── ACTION: REJECT (brand only) ──
    if (action === 'reject') {
      // ── 3. OWNERSHIP ──
      const brands = await base44.entities.Brand.filter({ user_id: user.id });
      if (brands.length === 0 || brands[0].id !== application.brand_id) {
        return err('Forbidden', 'FORBIDDEN', 403);
      }

      // ── 4. VALIDATE TRANSITION ──
      if (application.status !== 'pending') {
        return err('Only pending applications can be rejected', 'INVALID_TRANSITION');
      }

      // ── 5. EXECUTE ──
      await base44.entities.Application.update(application_id, {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: (typeof data?.rejection_reason === 'string' ? data.rejection_reason.trim() : '') || '',
      });
      console.log(`[${FN}] Application ${application_id} rejected by brand ${brands[0].id}`);
      return Response.json({ success: true });
    }

    return err('Invalid action. Use withdraw or reject.', 'INVALID_ACTION');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});