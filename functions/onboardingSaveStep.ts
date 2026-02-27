import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Respond ───

const FN = 'onboardingSaveStep';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// Whitelists per step
const BRAND_STEP_FIELDS = {
  1: ['company_name', 'logo_url', 'state', 'city'],
  2: ['industry', 'company_size', 'marketing_budget', 'description', 'target_audience'],
  3: ['online_presences', 'social_instagram', 'social_linkedin', 'website'],
  4: ['contact_email', 'contact_phone'],
};

const CREATOR_STEP_FIELDS = {
  1: ['display_name', 'bio', 'avatar_url', 'state', 'city', 'location'],
  2: ['niche', 'content_types', 'profile_size'],
  3: ['platforms', 'profile_size', 'portfolio_url'],
  4: ['contact_email', 'contact_whatsapp', 'rate_cash_min', 'rate_cash_max', 'accepts_barter'],
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { profile_type, step, data } = await req.json();

    if (!profile_type || !step || !data) {
      return err('Missing required fields: profile_type, step, data', 'MISSING_FIELDS');
    }
    if (!['brand', 'creator'].includes(profile_type)) {
      return err('Invalid profile_type', 'INVALID_INPUT');
    }
    if (step < 1 || step > 4) {
      return err('Invalid step (must be 1-4)', 'INVALID_STEP');
    }

    // ── 3. SANITIZE ──
    const stepFields = profile_type === 'brand' ? BRAND_STEP_FIELDS : CREATOR_STEP_FIELDS;
    const allowedFields = stepFields[step] || [];

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
          return err('rate_cash_min não pode ser maior que rate_cash_max', 'INVALID_RATE_RANGE');
        }
      }
    }

    // Advance onboarding step
    sanitized.onboarding_step = step + 1;

    // ── 4. OWNERSHIP ──
    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });

    let profile;
    if (profiles.length > 0) {
      if (profiles[0].user_id !== user.id) {
        return err('Forbidden', 'FORBIDDEN', 403);
      }

      // ── 5. EXECUTE (update) ──
      await base44.entities[entityName].update(profiles[0].id, sanitized);
      profile = { ...profiles[0], ...sanitized };
    } else {
      if (step !== 1) {
        return err('Profile must be created on step 1', 'INVALID_STEP');
      }

      // ── 5. EXECUTE (create) ──
      profile = await base44.entities[entityName].create({
        user_id: user.id,
        account_state: 'incomplete',
        ...sanitized,
      });
    }

    // ── 6. RESPOND ──
    console.log(`[${FN}] Saved step ${step} for ${profile_type} user ${user.id}`);
    return Response.json({ success: true, profile });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});