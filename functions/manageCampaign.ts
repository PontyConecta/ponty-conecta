import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALLOWED_CREATE_FIELDS = [
  'brand_id', 'title', 'description', 'requirements', 'platforms', 'content_type',
  'niche_required', 'location', 'deadline', 'application_deadline',
  'remuneration_type', 'budget_min', 'budget_max', 'barter_description',
  'barter_value', 'slots_total', 'profile_size_min', 'proof_requirements',
  'target_audience', 'content_guidelines', 'dos', 'donts',
  'hashtags', 'mentions', 'cover_image_url', 'status',
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
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, campaign_id, data } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    // Find user's brand profile
    const brands = await base44.entities.Brand.filter({ user_id: user.id });
    if (brands.length === 0) {
      return Response.json({ error: 'Brand profile not found' }, { status: 404 });
    }
    const brand = brands[0];

    if (action === 'create') {
      // Sanitize fields
      const sanitized = { brand_id: brand.id, status: 'draft' };
      for (const key of ALLOWED_CREATE_FIELDS) {
        if (data[key] !== undefined && key !== 'brand_id') {
          sanitized[key] = data[key];
        }
      }
      // Force brand_id to current user's brand
      sanitized.brand_id = brand.id;
      // Force status to draft on create
      if (data.status && data.status !== 'draft') {
        sanitized.status = 'draft';
      }

      const campaign = await base44.entities.Campaign.create(sanitized);
      return Response.json({ success: true, campaign });
    }

    if (action === 'update') {
      if (!campaign_id) {
        return Response.json({ error: 'Missing campaign_id' }, { status: 400 });
      }

      // Verify ownership
      const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
      if (campaigns.length === 0) {
        return Response.json({ error: 'Campaign not found' }, { status: 404 });
      }
      if (campaigns[0].brand_id !== brand.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Sanitize
      const sanitized = {};
      for (const key of ALLOWED_CREATE_FIELDS) {
        if (data[key] !== undefined && key !== 'brand_id') {
          sanitized[key] = data[key];
        }
      }
      // Keep original brand_id
      delete sanitized.brand_id;

      await base44.entities.Campaign.update(campaign_id, sanitized);
      return Response.json({ success: true });
    }

    if (action === 'update_status') {
      if (!campaign_id || !data?.status) {
        return Response.json({ error: 'Missing campaign_id or status' }, { status: 400 });
      }

      const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
      if (campaigns.length === 0) {
        return Response.json({ error: 'Campaign not found' }, { status: 404 });
      }
      if (campaigns[0].brand_id !== brand.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const currentStatus = campaigns[0].status;
      const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(data.status)) {
        return Response.json({ error: `Cannot transition from ${currentStatus} to ${data.status}` }, { status: 400 });
      }

      await base44.entities.Campaign.update(campaign_id, { status: data.status });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[manageCampaign] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});