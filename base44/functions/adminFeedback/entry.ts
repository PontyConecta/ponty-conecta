import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #4: Paginated queries — max 500, no unbounded .filter({})

const MAX_PAGE = 500;

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
      const limit = Math.min(filters?.limit || 50, MAX_PAGE);
      const offset = Math.max(filters?.offset || 0, 0);

      // Build server-side filter for status if provided
      const dbFilter = {};
      if (filters?.status_admin && filters.status_admin !== 'all') {
        dbFilter.status_admin = filters.status_admin;
      }
      if (filters?.type && filters.type !== 'all') {
        dbFilter.type = filters.type;
      }

      const allFeedbacks = await base44.asServiceRole.entities.Feedback.filter(dbFilter, '-created_date', MAX_PAGE);
      let filtered = [...allFeedbacks];

      // Client-side filters for search and dates (not supported in DB query)
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

      const total = filtered.length;
      const page = filtered.slice(offset, offset + limit);

      // Enrich with user info — only for the page, not all users
      const userIds = [...new Set(page.map(f => f.user_id))];
      const userResults = await Promise.all(
        userIds.map(id => base44.asServiceRole.entities.User.filter({ id }))
      );
      const userMap = {};
      userResults.flat().forEach(u => { userMap[u.id] = { full_name: u.full_name, email: u.email }; });

      const enriched = page.map(f => ({
        ...f,
        user_name: userMap[f.user_id]?.full_name || 'Desconhecido',
        user_email: userMap[f.user_id]?.email || '',
      }));

      return Response.json({
        feedbacks: enriched,
        total,
        has_more: allFeedbacks.length === MAX_PAGE,
      });
    }

    // ── READ single feedback ──
    if (mode === 'read') {
      if (!feedback_id) return Response.json({ error: 'feedback_id required' }, { status: 400 });
      const fbArr = await base44.asServiceRole.entities.Feedback.filter({ id: feedback_id });
      if (fbArr.length === 0) return Response.json({ error: 'Feedback not found' }, { status: 404 });
      const fb = fbArr[0];

      // Get user info by ID
      const userArr = await base44.asServiceRole.entities.User.filter({ id: fb.user_id });
      const u = userArr[0];

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