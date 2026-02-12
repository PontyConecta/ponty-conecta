import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { user_id, new_role } = await req.json();

    if (!user_id || !new_role || !['brand', 'creator'].includes(new_role)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Find existing profile
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ user_id }),
      base44.asServiceRole.entities.Creator.filter({ user_id })
    ]);

    const existingBrand = brands[0];
    const existingCreator = creators[0];
    const currentRole = existingBrand ? 'brand' : existingCreator ? 'creator' : null;

    if (!currentRole) {
      return Response.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (currentRole === new_role) {
      return Response.json({ error: 'User already has this role' }, { status: 400 });
    }

    // Delete old profile
    if (currentRole === 'brand' && existingBrand) {
      await base44.asServiceRole.entities.Brand.delete(existingBrand.id);
    } else if (currentRole === 'creator' && existingCreator) {
      await base44.asServiceRole.entities.Creator.delete(existingCreator.id);
    }

    // Create new profile with incomplete state
    if (new_role === 'brand') {
      await base44.asServiceRole.entities.Brand.create({
        user_id,
        company_name: 'Nova Marca',
        account_state: 'incomplete',
        subscription_status: 'starter'
      });
    } else {
      await base44.asServiceRole.entities.Creator.create({
        user_id,
        display_name: 'Novo Criador',
        account_state: 'incomplete',
        subscription_status: 'starter'
      });
    }

    // Log action
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: user.id,
      admin_email: user.email,
      action: 'role_switch',
      target_user_id: user_id,
      details: `Changed role from ${currentRole} to ${new_role}`,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: `User role changed from ${currentRole} to ${new_role}`,
      new_role
    });

  } catch (error) {
    console.error('Role change error:', error);
    return Response.json({ 
      error: 'Failed to change user role', 
      details: error.message 
    }, { status: 500 });
  }
});