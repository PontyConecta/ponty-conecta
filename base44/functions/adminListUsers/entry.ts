import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #1: Paginated fetching — max 500 per request

const MAX_LIMIT = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(body.limit || 200, 1), MAX_LIMIT);
    const offset = Math.max(body.offset || 0, 0);

    const [users, brands, creators] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', limit, offset),
      base44.asServiceRole.entities.Brand.list('-created_date', limit, offset),
      base44.asServiceRole.entities.Creator.list('-created_date', limit, offset)
    ]);

    console.log(`[adminListUsers] Loaded ${users.length} users, ${brands.length} brands, ${creators.length} creators (limit=${limit}, offset=${offset})`);

    return Response.json({
      users,
      brands,
      creators,
      has_more: users.length === limit || brands.length === limit || creators.length === limit,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin list users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});