import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── SECURITY: Whitelist approach ───
// Only fields explicitly listed here can be updated by the user.
// Everything else is silently dropped.

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

// Fields that should NEVER be updatable by a regular user (defense-in-depth)
const PROTECTED_FIELDS = [
  'is_verified', 'subscription_status', 'plan_level', 'stripe_customer_id',
  'total_campaigns', 'active_campaigns', 'completed_campaigns', 'on_time_rate',
  'featured', 'user_id', 'account_state', 'onboarding_step', 'trial_end_date',
];

// Fields considered "sensitive" for audit logging (log keys only, never values)
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
  if (trimmed === '') return '';  // allow clearing the field
  if (/^https?:\/\/.+/i.test(trimmed)) return trimmed;
  return null; // invalid URL dropped
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

// ─── Field-level sanitization map ───

const FIELD_SANITIZERS = {
  // Strings
  company_name: sanitizeString,
  industry: sanitizeString,
  company_size: sanitizeString,
  marketing_budget: sanitizeString,
  description: sanitizeString,
  target_audience: sanitizeString,
  content_guidelines: sanitizeString,
  display_name: sanitizeString,
  bio: sanitizeString,
  state: sanitizeString,
  city: sanitizeString,
  location: sanitizeString,
  profile_size: sanitizeString,
  contact_email: sanitizeString,
  contact_phone: sanitizeString,
  contact_whatsapp: sanitizeString,
  social_instagram: sanitizeString,
  social_linkedin: sanitizeString,

  // URLs
  logo_url: sanitizeUrl,
  cover_image_url: sanitizeUrl,
  avatar_url: sanitizeUrl,
  portfolio_url: sanitizeUrl,
  website: sanitizeUrl,

  // Numbers
  rate_cash_min: sanitizeNumber,
  rate_cash_max: sanitizeNumber,

  // Booleans
  accepts_barter: sanitizeBoolean,

  // Arrays of strings
  niche: (val) => sanitizeArray(val, 10),
  content_types: (val) => sanitizeArray(val, 15),

  // Complex arrays
  online_presences: sanitizeOnlinePresences,
  platforms: sanitizePlatforms,
  portfolio_images: sanitizePortfolioImages,
};

// ─── Handler ───

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile_type, updates } = await req.json();

  if (!profile_type || !['brand', 'creator'].includes(profile_type)) {
    return Response.json({ error: 'Invalid profile_type' }, { status: 400 });
  }

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return Response.json({ error: 'Invalid updates' }, { status: 400 });
  }

  // Find the user's profile (ownership check)
  const EntityType = profile_type === 'brand' ? 'Brand' : 'Creator';
  const profiles = await base44.entities[EntityType].filter({ user_id: user.id });

  if (profiles.length === 0) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  const profile = profiles[0];

  // Determine allowed fields for this profile type
  const allowedFields = profile_type === 'brand' ? ALLOWED_BRAND_FIELDS : ALLOWED_CREATOR_FIELDS;

  // Sanitize: only whitelisted, non-protected fields pass through
  const sanitizedUpdates = {};
  const droppedFields = [];

  for (const [key, value] of Object.entries(updates)) {
    // Skip protected fields
    if (PROTECTED_FIELDS.includes(key)) {
      droppedFields.push(key);
      continue;
    }

    // Skip non-whitelisted fields
    if (!allowedFields.includes(key)) {
      droppedFields.push(key);
      continue;
    }

    // Skip null/undefined values (user didn't intend to update this field)
    if (value === null || value === undefined) {
      continue;
    }

    // Apply field-specific sanitizer
    const sanitizer = FIELD_SANITIZERS[key];
    if (sanitizer) {
      const sanitized = sanitizer(value);
      if (sanitized !== null) {
        sanitizedUpdates[key] = sanitized;
      } else if (sanitized === null && typeof value === 'string' && value.trim() === '') {
        // sanitizer returned null for empty string — allow clearing for string/url fields
        sanitizedUpdates[key] = '';
      }
      // null from non-string input means invalid value — skip silently
    } else {
      // No sanitizer defined but field is whitelisted — store as-is (string fallback)
      if (typeof value === 'string') {
        sanitizedUpdates[key] = value.trim();
      }
    }
  }

  if (droppedFields.length > 0) {
    console.log(`[updateProfile] Dropped fields for ${profile_type} user ${user.id}: ${droppedFields.join(', ')}`);
  }

  // Validate required fields
  if (profile_type === 'brand' && sanitizedUpdates.company_name !== undefined) {
    if (!sanitizedUpdates.company_name || sanitizedUpdates.company_name.length === 0) {
      return Response.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }
  }

  if (profile_type === 'creator' && sanitizedUpdates.display_name !== undefined) {
    if (!sanitizedUpdates.display_name || sanitizedUpdates.display_name.length === 0) {
      return Response.json({ error: 'Nome artístico é obrigatório' }, { status: 400 });
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Update profile
  const updatedProfile = await base44.entities[EntityType].update(profile.id, sanitizedUpdates);

  // Audit log for sensitive field changes
  const changedKeys = Object.keys(sanitizedUpdates);
  const sensitiveChanged = changedKeys.filter(k => SENSITIVE_FIELDS.includes(k));

  if (sensitiveChanged.length > 0) {
    try {
      await base44.entities.AuditLog.create({
        admin_id: user.id,
        admin_email: user.email,
        action: 'profile_update',
        target_user_id: user.id,
        details: JSON.stringify({ profile_type, keys: sensitiveChanged }),
        timestamp: new Date().toISOString()
      });
    } catch (auditErr) {
      // Non-critical — log but don't fail the request
      console.error('[updateProfile] Audit log failed:', auditErr.message);
    }
  }

  return Response.json({
    success: true,
    profile: updatedProfile
  });
});