import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Whitelists per step for Brand
const BRAND_STEP_FIELDS = {
  1: ['company_name', 'logo_url', 'state', 'city'],
  2: ['industry', 'company_size', 'marketing_budget', 'description', 'target_audience'],
  3: ['online_presences', 'social_instagram', 'social_linkedin', 'website'],
  4: ['contact_email', 'contact_phone'],
};

// Whitelists per step for Creator
const CREATOR_STEP_FIELDS = {
  1: ['display_name', 'bio', 'avatar_url', 'state', 'city', 'location'],
  2: ['niche', 'content_types', 'profile_size'],
  3: ['platforms', 'profile_size', 'portfolio_url'],
  4: ['contact_email', 'contact_whatsapp', 'rate_cash_min', 'rate_cash_max', 'accepts_barter'],
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile_type, step, data } = await req.json();

    if (!profile_type || !step || !data) {
      return Response.json({ error: 'Missing required fields: profile_type, step, data' }, { status: 400 });
    }

    if (!['brand', 'creator'].includes(profile_type)) {
      return Response.json({ error: 'Invalid profile_type' }, { status: 400 });
    }

    if (step < 1 || step > 4) {
      return Response.json({ error: 'Invalid step (must be 1-4)' }, { status: 400 });
    }

    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const stepFields = profile_type === 'brand' ? BRAND_STEP_FIELDS : CREATOR_STEP_FIELDS;
    const allowedFields = stepFields[step] || [];

    // Filter data to only allowed fields for this step
    const sanitized = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }

    // Rate validation for creator step 4
    if (profile_type === 'creator' && step === 4) {
      if (sanitized.rate_cash_min != null && sanitized.rate_cash_max != null) {
        const min = parseFloat(sanitized.rate_cash_min);
        const max = parseFloat(sanitized.rate_cash_max);
        if (!isNaN(min) && !isNaN(max) && min > max) {
          return Response.json({ error: 'rate_cash_min não pode ser maior que rate_cash_max' }, { status: 400 });
        }
      }
    }

    // Set onboarding_step to next step
    const nextStep = step + 1;
    sanitized.onboarding_step = nextStep;

    // Find existing profile
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });

    let profile;
    if (profiles.length > 0) {
      // Verify ownership
      if (profiles[0].user_id !== user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await base44.entities[entityName].update(profiles[0].id, sanitized);
      profile = { ...profiles[0], ...sanitized };
    } else {
      // Create new profile (only on step 1)
      if (step !== 1) {
        return Response.json({ error: 'Profile must be created on step 1' }, { status: 400 });
      }
      profile = await base44.entities[entityName].create({
        user_id: user.id,
        account_state: 'incomplete',
        ...sanitized,
      });
    }

    return Response.json({ success: true, profile });
  } catch (error) {
    console.error('[onboardingSaveStep] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});