import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { mode, feedback_id, data, filters } = await req.json();

    // ── LIST feedbacks ──
    if (mode === 'list') {
      const allFeedbacks = await base44.asServiceRole.entities.Feedback.filter({});
      let filtered = [...allFeedbacks];

      if (filters?.status_admin && filters.status_admin !== 'all') {
        filtered = filtered.filter(f => f.status_admin === filters.status_admin);
      }
      if (filters?.type && filters.type !== 'all') {
        filtered = filtered.filter(f => f.type === filters.type);
      }
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(f =>
          (f.title || '').toLowerCase().includes(s) ||
          (f.message || '').toLowerCase().includes(s) ||
          (f.user_id || '').toLowerCase().includes(s)
        );
      }
      if (filters?.date_from) {
        filtered = filtered.filter(f => f.created_date >= filters.date_from);
      }
      if (filters?.date_to) {
        filtered = filtered.filter(f => f.created_date <= filters.date_to);
      }

      // Sort newest first
      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Enrich with user info
      const userIds = [...new Set(filtered.map(f => f.user_id))];
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = { full_name: u.full_name, email: u.email }; });

      const enriched = filtered.map(f => ({
        ...f,
        user_name: userMap[f.user_id]?.full_name || 'Desconhecido',
        user_email: userMap[f.user_id]?.email || '',
      }));

      // Pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      const page = enriched.slice(offset, offset + limit);

      return Response.json({ feedbacks: page, total: enriched.length });
    }

    // ── READ single feedback ──
    if (mode === 'read') {
      if (!feedback_id) return Response.json({ error: 'feedback_id required' }, { status: 400 });
      const allFb = await base44.asServiceRole.entities.Feedback.filter({});
      const fb = allFb.find(f => String(f.id) === String(feedback_id));
      if (!fb) return Response.json({ error: 'Feedback not found' }, { status: 404 });

      // Get user info
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      const u = allUsers.find(x => String(x.id) === String(fb.user_id));

      return Response.json({
        ...fb,
        user_name: u?.full_name || 'Desconhecido',
        user_email: u?.email || '',
      });
    }

    // ── UPDATE STATUS ──
    if (mode === 'update_status') {
      if (!feedback_id) return Response.json({ error: 'feedback_id required' }, { status: 400 });

      const updateData = {};
      if (data?.status_admin) updateData.status_admin = data.status_admin;
      if (data?.admin_notes !== undefined) updateData.admin_notes = String(data.admin_notes).slice(0, 1000);

      await base44.asServiceRole.entities.Feedback.update(feedback_id, updateData);

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        admin_id: admin.id,
        admin_email: admin.email,
        action: 'feedback_status_update',
        target_entity_id: String(feedback_id),
        details: `Feedback status updated to: ${data?.status_admin || 'N/A'}`,
        note: data?.admin_notes || '',
        timestamp: new Date().toISOString(),
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('[adminFeedback] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});