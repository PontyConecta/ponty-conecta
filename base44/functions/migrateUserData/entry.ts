// FIX #3: Idempotent migration — skips already-migrated records, paginated.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BATCH_SIZE = 100;

async function fetchPaginated(entityApi) {
  const all = [];
  let page = 0;
  while (true) {
    const batch = await entityApi.list('-created_date', BATCH_SIZE, page * BATCH_SIZE);
    all.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    page++;
    if (page > 100) break;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const results = {
      brands_updated: 0,
      brands_skipped: 0,
      creators_updated: 0,
      creators_skipped: 0,
      errors: []
    };

    // Migrate Brand entities (paginated)
    try {
      const brands = await fetchPaginated(base44.asServiceRole.entities.Brand);
      
      for (const brand of brands) {
        const updates = {};
        
        // Migrate subscription_status (idempotent: only change if in legacy values)
        if (brand.subscription_status === 'active') {
          updates.subscription_status = 'premium';
        } else if (!brand.subscription_status || brand.subscription_status === 'none') {
          updates.subscription_status = 'free';
        }
        
        // Set account_state only if not already set (idempotent)
        if (!brand.account_state) {
          // Proper check: require company_name AND industry for 'ready'
          const isReady = !!(brand.company_name && brand.industry && brand.contact_email);
          updates.account_state = isReady ? 'ready' : 'incomplete';
        }
        
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Brand.update(brand.id, updates);
          results.brands_updated++;
        } else {
          results.brands_skipped++;
        }
      }
    } catch (error) {
      results.errors.push(`Brand migration error: ${error.message}`);
    }

    // Migrate Creator entities (paginated)
    try {
      const creators = await fetchPaginated(base44.asServiceRole.entities.Creator);
      
      for (const creator of creators) {
        const updates = {};
        
        // Migrate subscription_status (idempotent)
        if (creator.subscription_status === 'active') {
          updates.subscription_status = 'premium';
        } else if (!creator.subscription_status || creator.subscription_status === 'none') {
          updates.subscription_status = 'starter';
        }
        
        // Set account_state only if not already set (idempotent)
        if (!creator.account_state) {
          const isReady = !!(creator.display_name && creator.niche?.length > 0 && creator.platforms?.length > 0);
          updates.account_state = isReady ? 'ready' : 'incomplete';
        }
        
        if (Object.keys(updates).length > 0) {
          await base44.asServiceRole.entities.Creator.update(creator.id, updates);
          results.creators_updated++;
        } else {
          results.creators_skipped++;
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