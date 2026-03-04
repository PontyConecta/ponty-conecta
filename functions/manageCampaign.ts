import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Respond ───

const FN = 'manageCampaign';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

const ALLOWED_CREATE_FIELDS = [
  'title', 'description', 'requirements', 'platforms', 'content_type',
  'niche_required', 'location', 'deadline', 'application_deadline',
  'remuneration_type', 'budget_min', 'budget_max', 'barter_description',
  'barter_value', 'slots_total', 'profile_size_min', 'proof_requirements',
  'target_audience', 'content_guidelines', 'dos', 'donts',
  'hashtags', 'mentions', 'cover_image_url',
];

const VALID_STATUS_TRANSITIONS = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'applications_closed', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  applications_closed: ['active', 'completed', 'cancelled'],
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { action, campaign_id, data } = await req.json();

    if (!action) return err('Missing action', 'MISSING_FIELDS');

    // ── 3. OWNERSHIP — find user's brand ──
    const brands = await base44.entities.Brand.filter({ user_id: user.id });
    if (brands.length === 0) {
      return err('Brand profile not found', 'NOT_FOUND', 404);
    }
    const brand = brands[0];

    // ── ACTION: CREATE ──
    if (action === 'create') {
      if (!data) return err('Missing data', 'MISSING_FIELDS');

      // ── 4. SANITIZE ──
      const sanitized = { brand_id: brand.id, status: 'draft' };
      for (const key of ALLOWED_CREATE_FIELDS) {
        if (data[key] !== undefined) {
          sanitized[key] = data[key];
        }
      }

      // ── 5. EXECUTE ──
      const campaign = await base44.entities.Campaign.create(sanitized);
      console.log(`[${FN}] Created campaign ${campaign.id} for brand ${brand.id}`);
      return Response.json({ success: true, campaign });
    }

    // ── ACTION: UPDATE ──
    if (action === 'update') {
      if (!campaign_id) return err('Missing campaign_id', 'MISSING_FIELDS');
      if (!data) return err('Missing data', 'MISSING_FIELDS');

      const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
      if (campaigns.length === 0) return err('Campaign not found', 'NOT_FOUND', 404);
      if (campaigns[0].brand_id !== brand.id) return err('Forbidden', 'FORBIDDEN', 403);

      // ── 4. SANITIZE ──
      const sanitized = {};
      for (const key of ALLOWED_CREATE_FIELDS) {
        if (data[key] !== undefined) {
          sanitized[key] = data[key];
        }
      }

      // ── 5. EXECUTE ──
      await base44.entities.Campaign.update(campaign_id, sanitized);
      console.log(`[${FN}] Updated campaign ${campaign_id}`);
      return Response.json({ success: true });
    }

    // ── ACTION: UPDATE STATUS ──
    if (action === 'update_status') {
      if (!campaign_id || !data?.status) {
        return err('Missing campaign_id or status', 'MISSING_FIELDS');
      }

      const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
      if (campaigns.length === 0) return err('Campaign not found', 'NOT_FOUND', 404);
      if (campaigns[0].brand_id !== brand.id) return err('Forbidden', 'FORBIDDEN', 403);

      // ── 4. VALIDATE TRANSITION ──
      const currentStatus = campaigns[0].status;
      const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(data.status)) {
        return err(`Cannot transition from ${currentStatus} to ${data.status}`, 'INVALID_TRANSITION');
      }

      // ── 5. EXECUTE ──
      await base44.entities.Campaign.update(campaign_id, { status: data.status });
      console.log(`[${FN}] Status ${currentStatus} → ${data.status} for campaign ${campaign_id}`);
      return Response.json({ success: true });
    }

    return err('Invalid action', 'INVALID_ACTION');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});