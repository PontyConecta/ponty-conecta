import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Fetch all data using service role to avoid permission issues  
    const [users, brands, creators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list()
    ]);

    console.log(`Loaded ${users.length} users, ${brands.length} brands, ${creators.length} creators`);

    return Response.json({ users, brands, creators });

  } catch (error) {
    console.error('Admin list users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});