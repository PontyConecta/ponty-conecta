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
    const { creatorId, range } = body;

    if (!creatorId) {
      return Response.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // Ownership check: creator must belong to user, unless admin
    if (user.role !== 'admin') {
      const creators = await base44.entities.Creator.filter({ id: creatorId, user_id: user.id });
      if (creators.length === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build date filter based on range
    const baseAppFilter = { creator_id: creatorId };
    const baseDelFilter = { creator_id: creatorId };

    if (range && range !== 'all') {
      const days = range === '30d' ? 30 : 90;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString();
      baseAppFilter.created_date = { $gte: sinceStr };
      baseDelFilter.created_date = { $gte: sinceStr };
    }

    // Fetch all applications and deliveries in parallel (with internal pagination)
    const [allApps, allDels] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Application, baseAppFilter),
      fetchAll(base44.asServiceRole.entities.Delivery, baseDelFilter),
    ]);

    // Aggregate counts
    const appCounts = countByField(allApps, 'status');
    const delCounts = countByField(allDels, 'status');

    // On-time rate from deliveries that have on_time field
    const finishedDels = allDels.filter(d => d.status === 'approved' || d.status === 'closed');
    const onTimeDels = finishedDels.filter(d => d.on_time === true);
    const onTimeRate = finishedDels.length > 0
      ? Math.round((onTimeDels.length / finishedDels.length) * 100)
      : 100;

    // Monthly series
    const appsByMonth = groupByMonth(allApps, 'created_date');
    const deliveriesByMonth = groupByMonth(allDels, 'created_date');

    return Response.json({
      appCounts,
      delCounts,
      totalApps: allApps.length,
      totalDeliveries: allDels.length,
      onTimeRate,
      appsByMonth,
      deliveriesByMonth,
    });
  } catch (error) {
    console.error('creatorDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});