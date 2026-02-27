import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, application_id, data } = await req.json();

    if (!action || !application_id) {
      return Response.json({ error: 'Missing action or application_id' }, { status: 400 });
    }

    // Fetch application
    const applications = await base44.entities.Application.filter({ id: application_id });
    if (applications.length === 0) {
      return Response.json({ error: 'Application not found' }, { status: 404 });
    }
    const application = applications[0];

    if (action === 'withdraw') {
      // Only the creator who owns the application can withdraw
      const creators = await base44.entities.Creator.filter({ user_id: user.id });
      if (creators.length === 0 || creators[0].id !== application.creator_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (application.status !== 'pending') {
        return Response.json({ error: 'Only pending applications can be withdrawn' }, { status: 400 });
      }

      await base44.entities.Application.update(application_id, { status: 'withdrawn' });
      return Response.json({ success: true });
    }

    if (action === 'reject') {
      // Only the brand owner can reject
      const brands = await base44.entities.Brand.filter({ user_id: user.id });
      if (brands.length === 0 || brands[0].id !== application.brand_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (application.status !== 'pending') {
        return Response.json({ error: 'Only pending applications can be rejected' }, { status: 400 });
      }

      await base44.entities.Application.update(application_id, {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: data?.rejection_reason || '',
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action. Use withdraw or reject.' }, { status: 400 });
  } catch (error) {
    console.error('[manageApplication] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});