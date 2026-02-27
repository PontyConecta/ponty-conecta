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

    // Check if user already has a profile (prevent duplicates)
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

    // Create new profile
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

    return Response.json({ success: true, profile, profile_type });
  } catch (error) {
    console.error('[selectProfile] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});