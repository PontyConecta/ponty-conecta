import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Audit → Respond ───

const FN = 'updateProfile';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// ─── SECURITY: Whitelist approach ───

const ALLOWED_BRAND_FIELDS = [
  'company_name', 'industry', 'company_size', 'marketing_budget',
  'description', 'logo_url', 'cover_image_url',
  'contact_email', 'contact_phone',
  'online_presences', 'website', 'social_instagram', 'social_linkedin',
  'state', 'city',
  'target_audience', 'content_guidelines',
];

const ALLOWED_CREATOR_FIELDS = [
  'display_name', 'bio', 'avatar_url', 'cover_image_url',
  'niche', 'platforms', 'profile_size', 'content_types',
  'state', 'city', 'location',
  'portfolio_url', 'portfolio_images',
  'rate_cash_min', 'rate_cash_max', 'accepts_barter',
  'contact_email', 'contact_whatsapp',
];

const PROTECTED_FIELDS = [
  'is_verified', 'subscription_status', 'plan_level', 'stripe_customer_id',
  'total_campaigns', 'active_campaigns', 'completed_campaigns', 'on_time_rate',
  'featured', 'user_id', 'account_state', 'onboarding_step', 'trial_end_date',
];

const SENSITIVE_FIELDS = [
  'contact_email', 'contact_phone', 'contact_whatsapp',
  'rate_cash_min', 'rate_cash_max',
  'online_presences', 'website', 'social_instagram', 'social_linkedin',
  'platforms',
];

// ─── Type-specific sanitizers ───

function sanitizeString(val) {
  if (typeof val !== 'string') return null;
  return val.trim();
}

function sanitizeNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function sanitizeBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

function sanitizeArray(val, maxItems = 50) {
  if (!Array.isArray(val)) return null;
  return val.filter(item => item !== null && item !== undefined && item !== '').slice(0, maxItems);
}

function sanitizeUrl(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed === '') return '';
  if (/^https?:\/\/.+/i.test(trimmed)) return trimmed;
  return null;
}

function sanitizeOnlinePresences(val) {
  if (!Array.isArray(val)) return null;
  return val
    .filter(p => p && typeof p === 'object' && typeof p.type === 'string' && typeof p.value === 'string')
    .map(p => ({ type: p.type.trim(), value: p.value.trim() }))
    .filter(p => p.type && p.value)
    .slice(0, 20);
}

function sanitizePlatforms(val) {
  if (!Array.isArray(val)) return null;
  return val
    .filter(p => p && typeof p === 'object' && typeof p.name === 'string')
    .map(p => ({
      name: String(p.name || '').trim(),
      handle: String(p.handle || '').trim(),
      followers: Number.isFinite(Number(p.followers)) ? Number(p.followers) : 0,
      url: typeof p.url === 'string' ? p.url.trim() : undefined,
    }))
    .filter(p => p.name && p.handle)
    .slice(0, 20);
}

function sanitizePortfolioImages(val) {
  if (!Array.isArray(val)) return null;
  return val
    .filter(url => typeof url === 'string' && url.trim().length > 0)
    .slice(0, 30);
}

const FIELD_SANITIZERS = {
  company_name: sanitizeString, industry: sanitizeString,
  company_size: sanitizeString, marketing_budget: sanitizeString,
  description: sanitizeString, target_audience: sanitizeString,
  content_guidelines: sanitizeString, display_name: sanitizeString,
  bio: sanitizeString, state: sanitizeString, city: sanitizeString,
  location: sanitizeString, profile_size: sanitizeString,
  contact_email: sanitizeString, contact_phone: sanitizeString,
  contact_whatsapp: sanitizeString, social_instagram: sanitizeString,
  social_linkedin: sanitizeString,
  logo_url: sanitizeUrl, cover_image_url: sanitizeUrl,
  avatar_url: sanitizeUrl, portfolio_url: sanitizeUrl, website: sanitizeUrl,
  rate_cash_min: sanitizeNumber, rate_cash_max: sanitizeNumber,
  accepts_barter: sanitizeBoolean,
  niche: (val) => sanitizeArray(val, 10),
  content_types: (val) => sanitizeArray(val, 15),
  online_presences: sanitizeOnlinePresences,
  platforms: sanitizePlatforms,
  portfolio_images: sanitizePortfolioImages,
};

// ─── Handler ───

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { profile_type, updates } = await req.json();

    if (!profile_type || !['brand', 'creator'].includes(profile_type)) {
      return err('Invalid profile_type', 'INVALID_INPUT');
    }
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return err('Invalid updates', 'INVALID_INPUT');
    }

    // ── 3. OWNERSHIP ──
    const EntityType = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[EntityType].filter({ user_id: user.id });
    if (profiles.length === 0) return err('Profile not found', 'NOT_FOUND', 404);
    const profile = profiles[0];

    // ── 4. SANITIZE ──
    const allowedFields = profile_type === 'brand' ? ALLOWED_BRAND_FIELDS : ALLOWED_CREATOR_FIELDS;
    const sanitizedUpdates = {};
    const droppedProtected = [];

    for (const [key, value] of Object.entries(updates)) {
      if (PROTECTED_FIELDS.includes(key)) {
        droppedProtected.push(key);
        continue;
      }
      if (!allowedFields.includes(key)) continue;
      if (value === null || value === undefined) continue;

      const sanitizer = FIELD_SANITIZERS[key];
      if (sanitizer) {
        const sanitized = sanitizer(value);
        if (sanitized !== null) {
          sanitizedUpdates[key] = sanitized;
        } else if (typeof value === 'string' && value.trim() === '') {
          sanitizedUpdates[key] = '';
        }
      } else if (typeof value === 'string') {
        sanitizedUpdates[key] = value.trim();
      }
    }

    if (droppedProtected.length > 0) {
      console.warn(`[${FN}] BLOCKED protected fields for ${profile_type} user ${user.id}: ${droppedProtected.join(', ')}`);
    }

    // ── 5. VALIDATE BUSINESS RULES ──
    if (profile_type === 'brand' && sanitizedUpdates.company_name !== undefined) {
      if (!sanitizedUpdates.company_name) {
        return err('Nome da empresa é obrigatório', 'VALIDATION_ERROR');
      }
    }
    if (profile_type === 'creator' && sanitizedUpdates.display_name !== undefined) {
      if (!sanitizedUpdates.display_name) {
        return err('Nome artístico é obrigatório', 'VALIDATION_ERROR');
      }
    }
    if (
      typeof sanitizedUpdates.rate_cash_min === 'number' &&
      typeof sanitizedUpdates.rate_cash_max === 'number' &&
      sanitizedUpdates.rate_cash_min > sanitizedUpdates.rate_cash_max
    ) {
      return err('rate_cash_min não pode ser maior que rate_cash_max', 'VALIDATION_ERROR');
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return err('No valid fields to update', 'NO_CHANGES');
    }

    // ── 6. EXECUTE ──
    const updatedProfile = await base44.entities[EntityType].update(profile.id, sanitizedUpdates);

    // ── 7. AUDIT (sensitive fields — keys only, never values) ──
    const sensitiveChanged = Object.keys(sanitizedUpdates).filter(k => SENSITIVE_FIELDS.includes(k));
    if (sensitiveChanged.length > 0) {
      try {
        await base44.entities.AuditLog.create({
          admin_id: user.id,
          admin_email: user.email,
          action: 'profile_update',
          target_user_id: user.id,
          details: JSON.stringify({
            actor: 'user',
            actor_user_id: user.id,
            actor_email: user.email,
            profile_type,
            keys_changed: sensitiveChanged,
          }),
          timestamp: new Date().toISOString(),
        });
      } catch (auditErr) {
        console.error(`[${FN}] Audit log failed (non-critical):`, auditErr.message);
      }
    }

    // ── 8. RESPOND ──
    return Response.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});