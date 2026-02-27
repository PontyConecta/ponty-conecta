import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Sanitize → Execute → Respond ───

const FN = 'selectProfile';

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
    const { profile_type } = await req.json();

    if (!['brand', 'creator'].includes(profile_type)) {
      return err('Invalid profile_type', 'INVALID_INPUT');
    }

    // ── 3. OWNERSHIP / DUPLICATE CHECK ──
    const [existingBrands, existingCreators] = await Promise.all([
      base44.entities.Brand.filter({ user_id: user.id }),
      base44.entities.Creator.filter({ user_id: user.id }),
    ]);

    if (existingBrands.length > 0 || existingCreators.length > 0) {
      const existing = existingBrands[0] || existingCreators[0];
      const type = existingBrands.length > 0 ? 'brand' : 'creator';
      return Response.json({
        success: true,
        already_exists: true,
        profile_type: type,
        account_state: existing.account_state,
      });
    }

    // ── 4. EXECUTE ──
    let profile;
    if (profile_type === 'brand') {
      profile = await base44.entities.Brand.create({
        user_id: user.id,
        account_state: 'incomplete',
        onboarding_step: 1,
      });
    } else {
      profile = await base44.entities.Creator.create({
        user_id: user.id,
        display_name: user.full_name || '',
        account_state: 'incomplete',
        onboarding_step: 1,
      });
    }

    // ── 5. RESPOND ──
    console.log(`[${FN}] Created ${profile_type} profile for user ${user.id}`);
    return Response.json({ success: true, profile, profile_type });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});