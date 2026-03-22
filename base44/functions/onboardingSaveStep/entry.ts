import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Respond ───

const FN = 'onboardingSaveStep';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// ── Valid UFs ──
const VALID_UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]);

// ── UF name → abbreviation map (for legacy/migration tolerance) ──
const STATE_NAME_TO_UF = {
  'acre':'AC','alagoas':'AL','amapá':'AP','amapa':'AP','amazonas':'AM',
  'bahia':'BA','ceará':'CE','ceara':'CE','distrito federal':'DF',
  'espírito santo':'ES','espirito santo':'ES','goiás':'GO','goias':'GO',
  'maranhão':'MA','maranhao':'MA','mato grosso':'MT','mato grosso do sul':'MS',
  'minas gerais':'MG','pará':'PA','para':'PA','paraíba':'PB','paraiba':'PB',
  'paraná':'PR','parana':'PR','pernambuco':'PE','piauí':'PI','piaui':'PI',
  'rio de janeiro':'RJ','rio grande do norte':'RN','rio grande do sul':'RS',
  'rondônia':'RO','rondonia':'RO','roraima':'RR','santa catarina':'SC',
  'são paulo':'SP','sao paulo':'SP','sergipe':'SE','tocantins':'TO'
};

function normalizeState(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try direct UF match (case insensitive)
  const upper = trimmed.toUpperCase();
  if (VALID_UFS.has(upper)) return upper;

  // Try full name match
  const lower = trimmed.toLowerCase();
  if (STATE_NAME_TO_UF[lower]) return STATE_NAME_TO_UF[lower];

  return null; // truly invalid
}

function sanitizeString(val, maxLen = 500) {
  if (val == null) return '';
  return String(val).trim().slice(0, maxLen);
}

function sanitizeUrl(val) {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim().slice(0, 2048);
  if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('blob:')) {
    return '';
  }
  return trimmed;
}

function sanitizeArray(val, maxItems = 20) {
  if (!Array.isArray(val)) return [];
  return val.slice(0, maxItems).map(item => {
    if (typeof item === 'string') return item.trim().slice(0, 200);
    if (typeof item === 'object' && item !== null) return item;
    return null;
  }).filter(Boolean);
}

// Whitelists per step
const BRAND_STEP_FIELDS = {
  1: ['company_name', 'logo_url', 'state', 'city'],
  2: ['industry', 'company_size', 'marketing_budget', 'description', 'target_audience'],
  3: ['online_presences', 'social_instagram', 'social_linkedin', 'website'],
  4: ['contact_email', 'contact_phone'],
};

const CREATOR_STEP_FIELDS = {
  1: ['display_name', 'bio', 'avatar_url', 'state', 'city'],
  2: ['niche', 'content_types', 'profile_size'],
  3: ['platforms', 'profile_size', 'portfolio_url'],
  4: ['contact_email', 'contact_whatsapp', 'rate_cash_min', 'rate_cash_max', 'accepts_barter'],
};

// Sanitizer map per field
const FIELD_SANITIZERS = {
  // strings
  company_name: (v) => sanitizeString(v, 200),
  display_name: (v) => sanitizeString(v, 200),
  bio: (v) => sanitizeString(v, 2000),
  description: (v) => sanitizeString(v, 2000),
  target_audience: (v) => sanitizeString(v, 500),
  industry: (v) => sanitizeString(v, 100),
  company_size: (v) => sanitizeString(v, 50),
  marketing_budget: (v) => sanitizeString(v, 50),
  city: (v) => sanitizeString(v, 200),
  contact_email: (v) => sanitizeString(v, 320),
  contact_phone: (v) => sanitizeString(v, 30),
  contact_whatsapp: (v) => sanitizeString(v, 30),
  profile_size: (v) => sanitizeString(v, 20),
  social_instagram: (v) => sanitizeString(v, 200),
  social_linkedin: (v) => sanitizeString(v, 500),
  website: (v) => sanitizeUrl(v),
  // urls
  logo_url: (v) => sanitizeUrl(v),
  avatar_url: (v) => sanitizeUrl(v),
  portfolio_url: (v) => sanitizeUrl(v),
  // arrays
  niche: (v) => sanitizeArray(v, 5),
  content_types: (v) => sanitizeArray(v, 20),
  platforms: (v) => sanitizeArray(v, 15),
  online_presences: (v) => sanitizeArray(v, 15),
  // booleans
  accepts_barter: (v) => v === true || v === 'true',
  // numbers
  rate_cash_min: (v) => { const n = parseFloat(v); return isNaN(n) ? null : Math.max(0, n); },
  rate_cash_max: (v) => { const n = parseFloat(v); return isNaN(n) ? null : Math.max(0, n); },
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
    const fieldErrors = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        const sanitizer = FIELD_SANITIZERS[key];
        sanitized[key] = sanitizer ? sanitizer(data[key]) : data[key];
      }
    }

    // ── State normalization (Step 1 — REQUIRED for both profiles) ──
    if (step === 1) {
      const rawState = data.state;
      if (!rawState || (typeof rawState === 'string' && !rawState.trim())) {
        fieldErrors.state = 'Selecione um estado';
      } else {
        const normalized = normalizeState(rawState);
        if (!normalized) {
          fieldErrors.state = 'Selecione um estado válido';
        } else {
          sanitized.state = normalized;
        }
      }
    }

    // ── Derive location from city + state ──
    if (step === 1) {
      const city = sanitized.city || '';
      const state = sanitized.state || '';
      sanitized.location = city && state ? `${city}, ${state}` : city || state || '';
    }

    // ── Return field errors if any ──
    if (Object.keys(fieldErrors).length > 0) {
      return Response.json({
        error: 'Campos com erro. Verifique e tente novamente.',
        code: 'VALIDATION_ERROR',
        field_errors: fieldErrors,
      }, { status: 400 });
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
    console.log(`[${FN}] Saved step ${step} for ${profile_type} user ${user.id} | state=${sanitized.state || 'empty'}`);
    return Response.json({ success: true, profile });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});