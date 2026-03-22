import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, trialDays } = await req.json();

    if (!userId || !trialDays || trialDays < 1 || trialDays > 365) {
      return Response.json({ error: 'userId and trialDays (1-365) are required' }, { status: 400 });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Find brand or creator profile for this user
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
      base44.asServiceRole.entities.Creator.filter({ user_id: userId })
    ]);

    const profile = brands[0] || creators[0];
    const profileType = brands[0] ? 'brand' : creators[0] ? 'creator' : null;

    if (!profile || !profileType) {
      return Response.json({ error: 'User profile not found' }, { status: 404 });
    }

    const entityName = profileType === 'brand' ? 'Brand' : 'Creator';

    // Update profile with trial status
    await base44.asServiceRole.entities[entityName].update(profile.id, {
      subscription_status: 'trial',
      plan_level: 'trial',
      trial_end_date: trialEndDate.toISOString()
    });

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: user.id,
      admin_email: user.email,
      action: 'subscription_override',
      target_user_id: userId,
      details: `Concedido período de teste grátis de ${trialDays} dias (expira em ${trialEndDate.toLocaleDateString('pt-BR')})`,
      note: `Trial: ${trialDays} dias para ${profileType}`,
      timestamp: new Date().toISOString()
    });

    console.log(`Trial granted: userId=${userId}, type=${profileType}, days=${trialDays}, ends=${trialEndDate.toISOString()}`);

    return Response.json({ 
      success: true, 
      profileType,
      trialEndDate: trialEndDate.toISOString()
    });
  } catch (error) {
    console.error('Error granting trial:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});