import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #13: Filter out hidden profiles, inactive, and test accounts

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

    if (creators.length === ROW_CAP) console.warn('[exportMetaAudience] WARNING: creators capped at 50000');
    if (brands.length === ROW_CAP) console.warn('[exportMetaAudience] WARNING: brands capped at 50000');

    // FIX: Filter out hidden and non-eligible profiles
    const ELIGIBLE_STATUSES = ['starter', 'premium', 'legacy', 'free'];
    const eligibleCreators = creators.filter(c =>
      !c.is_hidden &&
      ELIGIBLE_STATUSES.includes(c.subscription_status || 'starter') &&
      c.account_state === 'ready'
    );
    const eligibleBrands = brands.filter(b =>
      !b.is_hidden &&
      ELIGIBLE_STATUSES.includes(b.subscription_status || 'free') &&
      b.account_state === 'ready'
    );

    const userIds = new Set();
    for (const c of eligibleCreators) { if (c.user_id) userIds.add(c.user_id); }
    for (const b of eligibleBrands) { if (b.user_id) userIds.add(b.user_id); }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', ROW_CAP);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // Filter out test/internal accounts
    const EXCLUDED_DOMAINS = ['@test.', '@example.', '@ponty.dev'];
    const isTestEmail = (email) => EXCLUDED_DOMAINS.some(d => email.includes(d));

    const rows = [];
    rows.push('"email","fn","ln","ph","ct","st","country","zip"');

    const seen = new Set();

    const addRow = (profile) => {
      const uid = profile.user_id;
      if (!uid || seen.has(uid)) return;
      seen.add(uid);

      const u = userMap.get(uid);
      if (!u?.email) return;
      if (isTestEmail(u.email)) return;

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

    for (const c of eligibleCreators) addRow(c);
    for (const b of eligibleBrands) addRow(b);

    console.log(`[exportMetaAudience] Exported ${rows.length - 1} eligible profiles (filtered from ${creators.length + brands.length} total)`);

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