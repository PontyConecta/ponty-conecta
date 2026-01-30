import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Verify admin access
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userId, newRole, auditNote } = await req.json();

    if (!userId || !newRole || !['brand', 'creator'].includes(newRole)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get current profiles
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
      base44.asServiceRole.entities.Creator.filter({ user_id: userId })
    ]);

    const currentBrand = brands[0];
    const currentCreator = creators[0];
    const oldRole = currentBrand ? 'brand' : 'creator';

    // If switching from brand to creator
    if (oldRole === 'brand' && newRole === 'creator') {
      // Delete brand profile and create creator profile
      if (currentBrand) {
        await base44.asServiceRole.entities.Brand.delete(currentBrand.id);
      }
      
      const user = await base44.asServiceRole.entities.User.filter({ id: userId });
      await base44.asServiceRole.entities.Creator.create({
        user_id: userId,
        display_name: user[0]?.full_name || 'Novo Criador',
        account_state: 'exploring',
        subscription_status: 'none',
        bio: 'Perfil migrado de Marca para Criador'
      });
    }

    // If switching from creator to brand
    if (oldRole === 'creator' && newRole === 'brand') {
      // Delete creator profile and create brand profile
      if (currentCreator) {
        await base44.asServiceRole.entities.Creator.delete(currentCreator.id);
      }
      
      const user = await base44.asServiceRole.entities.User.filter({ id: userId });
      await base44.asServiceRole.entities.Brand.create({
        user_id: userId,
        company_name: user[0]?.full_name || 'Nova Marca',
        account_state: 'exploring',
        subscription_status: 'none',
        description: 'Perfil migrado de Criador para Marca'
      });
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'role_switch',
      target_user_id: userId,
      details: `Switched from ${oldRole} to ${newRole}`,
      note: auditNote || 'Manual role correction',
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: `User role switched from ${oldRole} to ${newRole}`,
      oldRole,
      newRole
    });

  } catch (error) {
    console.error('Role switch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});