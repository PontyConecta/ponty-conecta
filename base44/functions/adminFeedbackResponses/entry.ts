import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #4: Replace hardcoded 10000 with paginated MAX_PAGE of 500

const MAX_PAGE = 500;

async function fetchPaginated(entityApi, filter, sort, limit) {
  const cap = Math.min(limit || MAX_PAGE, MAX_PAGE);
  return entityApi.filter(filter, sort || '-created_date', cap);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { mode } = body;

    // ── LIST ──
    if (mode === 'list') {
      const { filters = {}, page = 1, pageSize = 50 } = body;
      const allResponses = await fetchPaginated(base44.asServiceRole.entities.FeedbackResponse, {}, '-created_date', MAX_PAGE);
      const dbTruncated = allResponses.length === MAX_PAGE;
      let filtered = [...allResponses];

      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(f => f.status === filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        filtered = filtered.filter(f => f.priority === filters.priority);
      }
      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(f => f.category === filters.category);
      }
      if (filters.experience_rating && filters.experience_rating !== 'all') {
        filtered = filtered.filter(f => f.experience_rating === filters.experience_rating);
      }
      if (filters.recommend_ponty && filters.recommend_ponty !== 'all') {
        filtered = filtered.filter(f => f.recommend_ponty === filters.recommend_ponty);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(f =>
          (f.improvement_one_thing || '').toLowerCase().includes(s) ||
          (f.confusion_text || '').toLowerCase().includes(s) ||
          (f.favorite_thing_text || '').toLowerCase().includes(s) ||
          (f.internal_notes || '').toLowerCase().includes(s)
        );
      }
      if (filters.date_from) {
        filtered = filtered.filter(f => f.created_date >= filters.date_from);
      }
      if (filters.date_to) {
        filtered = filtered.filter(f => f.created_date <= filters.date_to + 'T23:59:59');
      }

      filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Facets
      const facets = {
        status: {}, priority: {}, category: {}, experience_rating: {}, recommend_ponty: {}
      };
      filtered.forEach(f => {
        facets.status[f.status || 'new'] = (facets.status[f.status || 'new'] || 0) + 1;
        facets.priority[f.priority || 'med'] = (facets.priority[f.priority || 'med'] || 0) + 1;
        facets.category[f.category || 'other'] = (facets.category[f.category || 'other'] || 0) + 1;
        facets.experience_rating[f.experience_rating] = (facets.experience_rating[f.experience_rating] || 0) + 1;
        if (f.recommend_ponty) facets.recommend_ponty[f.recommend_ponty] = (facets.recommend_ponty[f.recommend_ponty] || 0) + 1;
      });

      // Enrich only the visible page with user info
      const offset = (page - 1) * pageSize;
      const pageRows = filtered.slice(offset, offset + pageSize);

      const userIds = [...new Set(pageRows.map(f => f.user_id))];
      const userResults = await Promise.all(
        userIds.map(id => base44.asServiceRole.entities.User.filter({ id }))
      );
      const userMap = {};
      userResults.flat().forEach(u => { userMap[String(u.id)] = { full_name: u.full_name, email: u.email }; });

      const rows = pageRows.map(f => ({
        ...f,
        user_name: userMap[String(f.user_id)]?.full_name || 'Desconhecido',
        user_email: userMap[String(f.user_id)]?.email || '',
      }));

      return Response.json({ rows, total: filtered.length, facets, has_more: dbTruncated });
    }

    // ── UPDATE ──
    if (mode === 'update') {
      const { feedback_id, data } = body;
      if (!feedback_id) return Response.json({ error: 'feedback_id required' }, { status: 400 });

      const updateFields = {};
      const allowed = ['status', 'priority', 'category', 'tags', 'assigned_to', 'internal_notes'];
      allowed.forEach(k => { if (data[k] !== undefined) updateFields[k] = data[k]; });

      await base44.asServiceRole.entities.FeedbackResponse.update(feedback_id, updateFields);

      await base44.asServiceRole.entities.AuditLog.create({
        admin_id: String(admin.id),
        admin_email: admin.email,
        action: 'feedback_status_update',
        target_entity_id: String(feedback_id),
        details: `Feedback updated: ${JSON.stringify(updateFields)}`,
        timestamp: new Date().toISOString(),
      });

      return Response.json({ success: true });
    }

    // ── EXPORT ──
    if (mode === 'export') {
      const { format = 'csv', filters = {} } = body;
      const allResponses = await fetchPaginated(base44.asServiceRole.entities.FeedbackResponse, {}, '-created_date', MAX_PAGE);
      const exportTruncated = allResponses.length === MAX_PAGE;
      let filtered = [...allResponses];

      // Apply same filters
      if (filters.status && filters.status !== 'all') filtered = filtered.filter(f => f.status === filters.status);
      if (filters.category && filters.category !== 'all') filtered = filtered.filter(f => f.category === filters.category);

      // Enrich all exported rows with user info
      const exportUserIds = [...new Set(filtered.map(f => f.user_id))];
      const exportUserResults = await Promise.all(
        exportUserIds.map(id => base44.asServiceRole.entities.User.filter({ id }))
      );
      const userMap = {};
      exportUserResults.flat().forEach(u => { userMap[String(u.id)] = { full_name: u.full_name, email: u.email }; });

      const rows = filtered.map(f => ({
        id: f.id,
        user_id: f.user_id,
        user_name: userMap[String(f.user_id)]?.full_name || '',
        user_email: userMap[String(f.user_id)]?.email || '',
        cohort_id: f.cohort_id || '',
        source: f.source || 'in_app',
        channel: f.channel || '',
        platform: f.platform || 'web',
        experience_rating: f.experience_rating || '',
        confusion_level: f.confusion_level || '',
        confusion_text: f.confusion_text || '',
        favorite_thing: f.favorite_thing || '',
        favorite_thing_text: f.favorite_thing_text || '',
        improvement_one_thing: f.improvement_one_thing || '',
        recommend_ponty: f.recommend_ponty || '',
        recommend_to_yes: f.recommend_to_yes || '',
        status: f.status || 'new',
        priority: f.priority || 'med',
        category: f.category || 'other',
        tags: (f.tags || []).join(';'),
        assigned_to: f.assigned_to || '',
        internal_notes: f.internal_notes || '',
        created_at: f.created_date || '',
        updated_at: f.updated_date || '',
      }));

      if (format === 'json') {
        return Response.json({ data: rows, total: rows.length, has_more: exportTruncated });
      }

      // CSV
      if (rows.length === 0) return Response.json({ csv: '', total: 0, has_more: exportTruncated });
      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(',')];
      rows.forEach(row => {
        csvLines.push(headers.map(h => {
          const val = String(row[h] || '').replace(/"/g, '""');
          return val.includes(',') || val.includes('\n') || val.includes('"') ? `"${val}"` : val;
        }).join(','));
      });

      return Response.json({ csv: csvLines.join('\n'), total: rows.length, has_more: exportTruncated });
    }

    // ── IMPORT ──
    if (mode === 'import') {
      const { records = [], commit = false } = body;

      // Fetch users needed for import resolution — paginated
      const allUsers = await fetchPaginated(base44.asServiceRole.entities.User, {}, '-created_date', MAX_PAGE);
      const userByEmail = {};
      const userById = {};
      allUsers.forEach(u => {
        userByEmail[u.email?.toLowerCase()] = u;
        userById[String(u.id)] = u;
      });

      const results = { total: records.length, imported: 0, skipped: 0, errors: [] };

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const row = i + 1;

        // Resolve user
        let resolvedUserId = null;
        if (rec.user_id && userById[String(rec.user_id)]) {
          resolvedUserId = String(rec.user_id);
        } else if (rec.user_email) {
          const found = userByEmail[rec.user_email.toLowerCase()];
          if (found) resolvedUserId = String(found.id);
        }

        if (!resolvedUserId) {
          results.errors.push({ row, reason: 'Usuário não encontrado' });
          results.skipped++;
          continue;
        }

        if (!rec.experience_rating) {
          results.errors.push({ row, reason: 'experience_rating é obrigatório' });
          results.skipped++;
          continue;
        }

        if (commit) {
          const importData = {
            user_id: resolvedUserId,
            source: 'import',
            experience_rating: rec.experience_rating,
            confusion_level: rec.confusion_level || 'none',
            confusion_text: rec.confusion_text || '',
            favorite_thing: rec.favorite_thing || '',
            favorite_thing_text: rec.favorite_thing_text || '',
            improvement_one_thing: rec.improvement_one_thing || '',
            recommend_ponty: rec.recommend_ponty || '',
            recommend_to_yes: rec.recommend_to_yes || '',
            status: rec.status || 'new',
            priority: rec.priority || 'med',
            category: rec.category || 'other',
            tags: rec.tags ? (typeof rec.tags === 'string' ? rec.tags.split(';').filter(Boolean) : rec.tags) : [],
            platform: rec.platform || 'unknown',
            channel: rec.channel || 'link',
          };
          await base44.asServiceRole.entities.FeedbackResponse.create(importData);
        }
        results.imported++;
      }

      if (commit) {
        await base44.asServiceRole.entities.AuditLog.create({
          admin_id: String(admin.id),
          admin_email: admin.email,
          action: 'feedback_status_update',
          details: `Imported ${results.imported} feedback responses (${results.skipped} skipped)`,
          timestamp: new Date().toISOString(),
        });
      }

      return Response.json({ success: true, results, mode: commit ? 'commit' : 'dry_run' });
    }

    return Response.json({ error: 'Invalid mode. Use: list, update, export, import' }, { status: 400 });
  } catch (error) {
    console.error('[adminFeedbackResponses] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});