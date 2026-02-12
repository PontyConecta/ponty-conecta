import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Verify admin access
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userId, action, data } = await req.json();

    if (!userId || !action) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    let result = null;
    let auditAction = '';

    switch (action) {
      case 'activate':
        // Get user's profile type
        const [brands, creators] = await Promise.all([
          base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
          base44.asServiceRole.entities.Creator.filter({ user_id: userId })
        ]);

        if (brands.length > 0) {
          result = await base44.asServiceRole.entities.Brand.update(brands[0].id, {
            subscription_status: 'Premium'
          });
        } else if (creators.length > 0) {
          result = await base44.asServiceRole.entities.Creator.update(creators[0].id, {
            subscription_status: 'Premium'
          });
        }
        auditAction = 'user_activated';
        break;

      case 'deactivate':
        const [brandsDe, creatorsDe] = await Promise.all([
          base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
          base44.asServiceRole.entities.Creator.filter({ user_id: userId })
        ]);

        if (brandsDe.length > 0) {
          result = await base44.asServiceRole.entities.Brand.update(brandsDe[0].id, {
            subscription_status: 'Guest'
          });
        } else if (creatorsDe.length > 0) {
          result = await base44.asServiceRole.entities.Creator.update(creatorsDe[0].id, {
            subscription_status: 'Guest'
          });
        }
        auditAction = 'user_deactivated';
        break;

      case 'override_subscription':
        const [brandsSub, creatorsSub] = await Promise.all([
          base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
          base44.asServiceRole.entities.Creator.filter({ user_id: userId })
        ]);

        const newStatus = data?.subscription_status || 'Premium';

        if (brandsSub.length > 0) {
          result = await base44.asServiceRole.entities.Brand.update(brandsSub[0].id, {
            subscription_status: newStatus
          });
        } else if (creatorsSub.length > 0) {
          result = await base44.asServiceRole.entities.Creator.update(creatorsSub[0].id, {
            subscription_status: newStatus
          });
        }
        auditAction = 'subscription_override';
        break;

      case 'toggle_verified':
        const [brandsVer, creatorsVer] = await Promise.all([
          base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
          base44.asServiceRole.entities.Creator.filter({ user_id: userId })
        ]);

        if (brandsVer.length > 0) {
          result = await base44.asServiceRole.entities.Brand.update(brandsVer[0].id, {
            is_verified: !brandsVer[0].is_verified
          });
          auditAction = brandsVer[0].is_verified ? 'user_unverified' : 'user_verified';
        } else if (creatorsVer.length > 0) {
          result = await base44.asServiceRole.entities.Creator.update(creatorsVer[0].id, {
            is_verified: !creatorsVer[0].is_verified
          });
          auditAction = creatorsVer[0].is_verified ? 'user_unverified' : 'user_verified';
        }
        break;

      case 'flag_review':
        auditAction = 'user_flagged';
        break;

      case 'unflag_review':
        auditAction = 'user_unflagged';
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_user_id: userId,
      details: JSON.stringify({ action, data }),
      note: data?.auditNote || '',
      timestamp: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: `Action '${action}' completed successfully`,
      result
    });

  } catch (error) {
    console.error('User management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});