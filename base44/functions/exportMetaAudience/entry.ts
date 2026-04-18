import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const ROW_CAP = 50000;
    const [creators, brands] = await Promise.all([
      base44.asServiceRole.entities.Creator.list('-created_date', ROW_CAP),
      base44.asServiceRole.entities.Brand.list('-created_date', ROW_CAP),
    ]);

    if (creators.length === ROW_CAP) console.warn('[exportMetaAudience] WARNING: creators capped at 50000 — some records may be missing.');
    if (brands.length === ROW_CAP) console.warn('[exportMetaAudience] WARNING: brands capped at 50000 — some records may be missing.');

    const userIds = new Set();
    for (const c of creators) { if (c.user_id) userIds.add(c.user_id); }
    for (const b of brands) { if (b.user_id) userIds.add(b.user_id); }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', ROW_CAP);
    if (allUsers.length === ROW_CAP) console.warn('[exportMetaAudience] WARNING: users capped at 50000 — some records may be missing.');
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const rows = [];
    rows.push('"email","fn","ln","ph","ct","st","country","zip"');

    const seen = new Set();

    const addRow = (profile) => {
      const uid = profile.user_id;
      if (!uid || seen.has(uid)) return;
      seen.add(uid);

      const u = userMap.get(uid);
      if (!u?.email) return;

      const email = u.email.toLowerCase().trim();
      const nameParts = (u.full_name || '').trim().split(' ');
      const fn = nameParts[0] || '';
      const ln = nameParts.slice(1).join(' ') || '';
      const ph = (profile.contact_phone || profile.contact_whatsapp || '').replace(/\D/g, '');
      const ct = profile.city || '';
      const st = profile.state || '';
      const country = 'BR';
      const zip = '';

      const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
      rows.push([email, fn, ln, ph, ct, st, country, zip].map(escape).join(','));
    };

    for (const c of creators) addRow(c);
    for (const b of brands) addRow(b);

    const csv = rows.join('\n');
    const date = new Date().toISOString().split('T')[0];
    const filename = `ponty_meta_audience_${date}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Meta audience export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});