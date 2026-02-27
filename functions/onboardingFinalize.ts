import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile_type } = await req.json();

    if (!['brand', 'creator'].includes(profile_type)) {
      return Response.json({ error: 'Invalid profile_type' }, { status: 400 });
    }

    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });

    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // Verify ownership
    if (profile.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Already ready? Skip
    if (profile.account_state === 'ready') {
      return Response.json({ success: true, profile });
    }

    // Finalize
    await base44.entities[entityName].update(profile.id, {
      account_state: 'ready',
      onboarding_step: 5,
    });

    // Create onboarding missions in background (fire and forget via service role)
    try {
      await base44.functions.invoke('createOnboardingMissions', {
        profile_type,
        profile_id: profile.id,
      });
    } catch (e) {
      console.warn('[onboardingFinalize] Mission creation failed (non-critical):', e.message);
    }

    return Response.json({
      success: true,
      profile: { ...profile, account_state: 'ready', onboarding_step: 5 },
    });
  } catch (error) {
    console.error('[onboardingFinalize] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});