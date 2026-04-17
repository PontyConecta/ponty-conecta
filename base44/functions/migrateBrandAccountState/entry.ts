import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FN = 'migrateBrandAccountState';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allBrands = await base44.asServiceRole.entities.Brand.filter({});
    let updated = 0;

    for (const brand of allBrands) {
      if (brand.account_state === 'ready') continue;

      // Brand has a company_name → consider onboarding done
      if (brand.company_name) {
        await base44.asServiceRole.entities.Brand.update(brand.id, { account_state: 'ready' });
        updated++;
        console.log(`[${FN}] Set ready: brand ${brand.id} (${brand.company_name})`);
      }
    }

    console.log(`[${FN}] Migration complete. Updated ${updated} of ${allBrands.length} brands.`);
    return Response.json({ success: true, updated, total: allBrands.length });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});