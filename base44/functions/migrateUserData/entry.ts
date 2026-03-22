import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const results = {
      brands_updated: 0,
      creators_updated: 0,
      errors: []
    };

    // Migrate Brand entities
    try {
      const brands = await base44.asServiceRole.entities.Brand.list();
      
      for (const brand of brands) {
        const updates = {};
        
        // Migrate subscription_status
        if (brand.subscription_status === 'active') {
          updates.subscription_status = 'premium';
        } else if (!brand.subscription_status || brand.subscription_status === 'none') {
          updates.subscription_status = 'starter';
        }
        
        // Set account_state based on profile completion
        if (!brand.account_state) {
          updates.account_state = brand.company_name && brand.industry ? 'ready' : 'incomplete';
        }
        
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Brand.update(brand.id, updates);
          results.brands_updated++;
        }
      }
    } catch (error) {
      results.errors.push(`Brand migration error: ${error.message}`);
    }

    // Migrate Creator entities
    try {
      const creators = await base44.asServiceRole.entities.Creator.list();
      
      for (const creator of creators) {
        const updates = {};
        
        // Migrate subscription_status
        if (creator.subscription_status === 'active') {
          updates.subscription_status = 'premium';
        } else if (!creator.subscription_status || creator.subscription_status === 'none') {
          updates.subscription_status = 'starter';
        }
        
        // Set account_state based on profile completion
        if (!creator.account_state) {
          updates.account_state = creator.display_name && creator.niche?.length > 0 ? 'ready' : 'incomplete';
        }
        
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Creator.update(creator.id, updates);
          results.creators_updated++;
        }
      }
    } catch (error) {
      results.errors.push(`Creator migration error: ${error.message}`);
    }

    return Response.json({
      success: true,
      message: 'Migration completed',
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
});