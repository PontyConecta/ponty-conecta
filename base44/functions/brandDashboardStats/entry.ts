import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const PAGE_SIZE = 200;

async function fetchAll(entityApi, filter, sort) {
  const allItems = [];
  let page = 0;
  while (true) {
    const batch = await entityApi.filter(filter, sort || '-created_date', PAGE_SIZE, page * PAGE_SIZE);
    allItems.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page++;
    if (page > 50) break; // safety: max 10k records
  }
  return allItems;
}

function countByField(items, field) {
  const counts = {};
  for (const item of items) {
    const val = item[field] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

function groupByMonth(items, dateField) {
  const months = {};
  for (const item of items) {
    const d = item[dateField] || item.created_date;
    if (!d) continue;
    const date = new Date(d);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months[key] = (months[key] || 0) + 1;
  }
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brandId, range } = body;

    if (!brandId) {
      return Response.json({ error: 'brandId is required' }, { status: 400 });
    }

    // Ownership check: brand must belong to user, unless admin
    if (user.role !== 'admin') {
      const brands = await base44.entities.Brand.filter({ id: brandId, user_id: user.id });
      if (brands.length === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build date filter based on range
    const dateCond = {};
    if (range && range !== 'all') {
      const days = range === '30d' ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - days);
      dateCond.created_date = { $gte: since.toISOString() };
    }

    const campFilter = { brand_id: brandId, ...dateCond };
    const appFilter = { brand_id: brandId, ...dateCond };
    const delFilter = { brand_id: brandId, ...dateCond };

    // Fetch all in parallel with internal pagination
    const [allCampaigns, allApps, allDels] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Campaign, campFilter),
      fetchAll(base44.asServiceRole.entities.Application, appFilter),
      fetchAll(base44.asServiceRole.entities.Delivery, delFilter),
    ]);

    // Aggregate
    const campaignCounts = countByField(allCampaigns, 'status');
    const appCounts = countByField(allApps, 'status');
    const delCounts = countByField(allDels, 'status');

    // Monthly series
    const campaignsByMonth = groupByMonth(allCampaigns, 'created_date');

    return Response.json({
      campaignCounts,
      appCounts,
      delCounts,
      totalCampaigns: allCampaigns.length,
      totalApps: allApps.length,
      totalDeliveries: allDels.length,
      campaignsByMonth,
    });
  } catch (error) {
    console.error('brandDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});