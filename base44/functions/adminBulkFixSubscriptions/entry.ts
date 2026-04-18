import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const brands = await base44.asServiceRole.entities.Brand.filter({});

    const toFix = brands.filter(
      (b) => b.subscription_status !== 'premium' && b.subscription_status !== 'legacy'
    );

    const results = [];

    for (const brand of toFix) {
      await base44.asServiceRole.entities.Brand.update(brand.id, {
        subscription_status: 'premium',
        plan_level: 'premium',
      });
      results.push({
        id: brand.id,
        company_name: brand.company_name || '(sem nome)',
        from: brand.subscription_status || 'starter',
        to: 'premium',
      });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'subscription_override',
      target_user_id: 'BULK',
      details: `Bulk fix: restored ${results.length} brands to premium.`,
      note: 'adminBulkFixSubscriptions — emergency restore after accidental downgrade',
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      fixed: results.length,
      skipped: brands.length - toFix.length,
      total: brands.length,
      details: results,
    });

  } catch (error) {
    console.error('adminBulkFixSubscriptions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});