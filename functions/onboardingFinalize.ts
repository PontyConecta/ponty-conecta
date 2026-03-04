import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Execute → Respond ───

const FN = 'onboardingFinalize';

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

    // ── 3. OWNERSHIP ──
    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });

    if (profiles.length === 0) {
      return err('Profile not found', 'NOT_FOUND', 404);
    }

    const profile = profiles[0];
    if (profile.user_id !== user.id) {
      return err('Forbidden', 'FORBIDDEN', 403);
    }

    // Already ready — idempotent
    if (profile.account_state === 'ready') {
      return Response.json({ success: true, profile });
    }

    // ── 4. EXECUTE ──
    await base44.entities[entityName].update(profile.id, {
      account_state: 'ready',
      onboarding_step: 5,
    });

    // Fire-and-forget: create onboarding missions
    try {
      await base44.functions.invoke('createOnboardingMissions', {
        profile_type,
        profile_id: profile.id,
      });
    } catch (e) {
      console.warn(`[${FN}] Mission creation failed (non-critical):`, e.message);
    }

    // ── 5. RESPOND ──
    console.log(`[${FN}] Finalized ${profile_type} for user ${user.id}`);
    return Response.json({
      success: true,
      profile: { ...profile, account_state: 'ready', onboarding_step: 5 },
    });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});