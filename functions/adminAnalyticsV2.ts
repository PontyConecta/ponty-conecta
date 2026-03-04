import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FN = 'adminAnalyticsV2';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// ─── Helpers ───

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function parseRange(range) {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  return 30; // default 30d
}

function hoursBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60));
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function applyProfileFilters(profiles, filters) {
  let result = profiles;
  if (filters.subscription_status) result = result.filter(p => p.subscription_status === filters.subscription_status);
  if (filters.account_state) result = result.filter(p => p.account_state === filters.account_state);
  if (filters.state) result = result.filter(p => p.state === filters.state);
  if (filters.industry) result = result.filter(p => p.industry === filters.industry);
  if (filters.niche) result = result.filter(p => (p.niche || []).includes(filters.niche));
  return result;
}

// ─── Label calculators ───

function calcCreatorLabels(creator, apps, deliveries) {
  const labels = [];
  if (creator.account_state !== 'ready') labels.push('onboarding_incomplete');
  if (apps.length > 0 && apps.every(a => a.status !== 'accepted' && a.status !== 'completed')) labels.push('applied_no_accept');
  const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'completed');
  if (accepted.length > 0 && deliveries.filter(d => d.status === 'submitted' || d.status === 'approved').length === 0) labels.push('accepted_no_delivery');
  const submitted = deliveries.filter(d => d.status === 'submitted');
  if (submitted.length > 0) {
    const avgWait = submitted.reduce((sum, d) => sum + (Date.now() - new Date(d.submitted_at || d.created_date).getTime()), 0) / submitted.length;
    if (avgWait > 7 * 24 * 60 * 60 * 1000) labels.push('slow_submitter');
  }
  const disputes = deliveries.filter(d => d.status === 'in_dispute' || d.status === 'contested');
  if (disputes.length >= 2 || (deliveries.length > 0 && disputes.length / deliveries.length > 0.3)) labels.push('high_dispute_risk');
  const approved = deliveries.filter(d => d.status === 'approved');
  if (approved.length >= 3 && deliveries.filter(d => d.on_time).length / Math.max(approved.length, 1) > 0.9) labels.push('top_performer');
  return labels;
}

function calcBrandLabels(brand, campaigns, apps, deliveries) {
  const labels = [];
  if (brand.account_state !== 'ready') labels.push('onboarding_incomplete');
  if (campaigns.length === 0 && brand.account_state === 'ready') labels.push('created_no_campaign');
  const zeroCampaigns = campaigns.filter(c => (c.total_applications || 0) === 0 && c.status === 'active');
  if (zeroCampaigns.length > 0) labels.push('campaign_no_apps');
  const pending = apps.filter(a => a.status === 'pending');
  if (pending.length > 0) {
    const avgPending = pending.reduce((sum, a) => sum + (Date.now() - new Date(a.created_date).getTime()), 0) / pending.length;
    if (avgPending > 5 * 24 * 60 * 60 * 1000) labels.push('slow_responder');
  }
  const disputeDeliveries = deliveries.filter(d => d.status === 'in_dispute' || d.status === 'contested');
  if (disputeDeliveries.length >= 2) labels.push('high_dispute_rate');
  const approved = deliveries.filter(d => d.status === 'approved');
  if (approved.length >= 3) labels.push('high_quality');
  return labels;
}

// ─── Handler ───

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH (admin-only) ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);
    if (user.role !== 'admin') return err('Forbidden: Admin access required', 'FORBIDDEN', 403);

    // ── 2. PARSE INPUT ──
    const body = await req.json();
    const mode = body.mode || 'summary';
    const range = body.range || '30d';
    const filters = body.filters || {};
    const limit = Math.min(body.limit || 20, 100);
    const cursor = body.cursor || null;
    const targetId = body.target_id || null;
    const listType = body.list_type || null;

    const rangeDays = parseRange(range);
    const rangeStart = daysAgo(rangeDays);
    const now = new Date();

    // ────────────────────────────────────────────
    // MODE: SUMMARY
    // ────────────────────────────────────────────
    if (mode === 'summary') {
      // Fetch core data in parallel
      const [allUsers, brands, creators, campaigns, applications, deliveries, disputes] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.Brand.list(),
        base44.asServiceRole.entities.Creator.list(),
        base44.asServiceRole.entities.Campaign.list(),
        base44.asServiceRole.entities.Application.list(),
        base44.asServiceRole.entities.Delivery.list(),
        base44.asServiceRole.entities.Dispute.list(),
      ]);

      // Apply filters to profiles
      const filteredBrands = filters.profile_type === 'creator' ? [] : applyProfileFilters(brands, filters);
      const filteredCreators = filters.profile_type === 'brand' ? [] : applyProfileFilters(creators, filters);

      // Build user maps
      const brandUserIds = new Set(filteredBrands.map(b => b.user_id));
      const creatorUserIds = new Set(filteredCreators.map(c => c.user_id));
      const allProfileUserIds = new Set([...brandUserIds, ...creatorUserIds]);

      const usersInScope = allUsers.filter(u => allProfileUserIds.has(u.id));

      // Time helpers
      const inRange = (dateStr) => dateStr && new Date(dateStr) >= rangeStart;
      const sevenDaysAgo = daysAgo(7);
      const thirtyDaysAgo = daysAgo(30);

      // ── USER METRICS ──
      const newBrands = filteredBrands.filter(b => inRange(b.created_date));
      const newCreators = filteredCreators.filter(c => inRange(c.created_date));

      const wauUsers = usersInScope.filter(u => u.last_active && new Date(u.last_active) >= sevenDaysAgo);
      const mauUsers = usersInScope.filter(u => u.last_active && new Date(u.last_active) >= thirtyDaysAgo);
      const wauBrands = wauUsers.filter(u => brandUserIds.has(u.id));
      const wauCreators = wauUsers.filter(u => creatorUserIds.has(u.id));
      const mauBrands = mauUsers.filter(u => brandUserIds.has(u.id));
      const mauCreators = mauUsers.filter(u => creatorUserIds.has(u.id));

      const reactivated = usersInScope.filter(u =>
        u.last_active && new Date(u.last_active) >= rangeStart &&
        u.created_date && new Date(u.created_date) < daysAgo(30)
      );

      const dormant = usersInScope.filter(u =>
        !u.last_active || new Date(u.last_active) < thirtyDaysAgo
      );
      const neverActive = usersInScope.filter(u => !u.last_active && !u.first_active);

      // Onboarding completion
      const readyBrands = filteredBrands.filter(b => b.account_state === 'ready' && inRange(b.created_date));
      const readyCreators = filteredCreators.filter(c => c.account_state === 'ready' && inRange(c.created_date));
      const brandCompletionRate = newBrands.length > 0 ? Math.round(readyBrands.length / newBrands.length * 1000) / 10 : 0;
      const creatorCompletionRate = newCreators.length > 0 ? Math.round(readyCreators.length / newCreators.length * 1000) / 10 : 0;

      // Time signup → ready (for those that completed in range)
      const brandReadyTimes = readyBrands.map(b => hoursBetween(b.created_date, b.updated_date)).filter(h => h !== null && h >= 0);
      const creatorReadyTimes = readyCreators.map(c => hoursBetween(c.created_date, c.updated_date)).filter(h => h !== null && h >= 0);

      // ── TIME TO FIRST VALUE ──
      // Creator: signup → first application
      const creatorFirstAppTimes = [];
      const creatorFirstAcceptTimes = [];
      const creatorFirstDeliveryTimes = [];
      for (const c of filteredCreators.filter(cr => inRange(cr.created_date))) {
        const cApps = applications.filter(a => a.creator_id === c.id);
        if (cApps.length > 0) {
          const earliest = cApps.reduce((min, a) => new Date(a.created_date) < new Date(min.created_date) ? a : min, cApps[0]);
          const h = hoursBetween(c.created_date, earliest.created_date);
          if (h !== null && h >= 0) creatorFirstAppTimes.push(h);
        }
        const accepted = cApps.filter(a => a.status === 'accepted' || a.status === 'completed');
        if (accepted.length > 0) {
          const earliest = accepted.reduce((min, a) => new Date(a.accepted_at || a.created_date) < new Date(min.accepted_at || min.created_date) ? a : min, accepted[0]);
          const h = hoursBetween(c.created_date, earliest.accepted_at || earliest.created_date);
          if (h !== null && h >= 0) creatorFirstAcceptTimes.push(h);
        }
        const cDels = deliveries.filter(d => d.creator_id === c.id && d.submitted_at);
        if (cDels.length > 0) {
          const earliest = cDels.reduce((min, d) => new Date(d.submitted_at) < new Date(min.submitted_at) ? d : min, cDels[0]);
          const h = hoursBetween(c.created_date, earliest.submitted_at);
          if (h !== null && h >= 0) creatorFirstDeliveryTimes.push(h);
        }
      }

      const brandFirstCampaignTimes = [];
      const brandFirstAcceptTimes = [];
      const brandFirstApproveTimes = [];
      for (const b of filteredBrands.filter(br => inRange(br.created_date))) {
        const bCampaigns = campaigns.filter(c => c.brand_id === b.id);
        if (bCampaigns.length > 0) {
          const earliest = bCampaigns.reduce((min, c) => new Date(c.created_date) < new Date(min.created_date) ? c : min, bCampaigns[0]);
          const h = hoursBetween(b.created_date, earliest.created_date);
          if (h !== null && h >= 0) brandFirstCampaignTimes.push(h);
        }
        const bApps = applications.filter(a => a.brand_id === b.id && (a.status === 'accepted' || a.status === 'completed'));
        if (bApps.length > 0) {
          const earliest = bApps.reduce((min, a) => new Date(a.accepted_at || a.created_date) < new Date(min.accepted_at || min.created_date) ? a : min, bApps[0]);
          const h = hoursBetween(b.created_date, earliest.accepted_at || earliest.created_date);
          if (h !== null && h >= 0) brandFirstAcceptTimes.push(h);
        }
        const bDels = deliveries.filter(d => d.brand_id === b.id && d.approved_at);
        if (bDels.length > 0) {
          const earliest = bDels.reduce((min, d) => new Date(d.approved_at) < new Date(min.approved_at) ? d : min, bDels[0]);
          const h = hoursBetween(b.created_date, earliest.approved_at);
          if (h !== null && h >= 0) brandFirstApproveTimes.push(h);
        }
      }

      // ── MARKETPLACE ──
      const activeCampaigns = campaigns.filter(c => c.status === 'active');
      const campaignsZeroApps = activeCampaigns.filter(c => (c.total_applications || 0) === 0);

      // Time active → first app
      const activeToFirstApp = [];
      for (const c of activeCampaigns) {
        const cApps = applications.filter(a => a.campaign_id === c.id);
        if (cApps.length > 0) {
          const earliest = cApps.reduce((min, a) => new Date(a.created_date) < new Date(min.created_date) ? a : min, cApps[0]);
          const h = hoursBetween(c.updated_date || c.created_date, earliest.created_date);
          if (h !== null && h >= 0) activeToFirstApp.push(h);
        }
      }

      const appsPerCampaign = campaigns.filter(c => c.status !== 'draft').map(c => c.total_applications || 0);
      const totalApps = applications.length;
      const acceptedApps = applications.filter(a => a.status === 'accepted' || a.status === 'completed');
      const pendingApps = applications.filter(a => a.status === 'pending');

      // Brand response time
      const responseTimes = [];
      for (const a of applications.filter(ap => ap.status === 'accepted' || ap.status === 'rejected')) {
        const resolvedAt = a.accepted_at || a.rejected_at;
        if (resolvedAt) {
          const h = hoursBetween(a.created_date, resolvedAt);
          if (h !== null && h >= 0) responseTimes.push(h);
        }
      }

      const slotsTotal = campaigns.reduce((s, c) => s + (c.slots_total || 0), 0);
      const slotsFilled = campaigns.reduce((s, c) => s + (c.slots_filled || 0), 0);

      // ── EXECUTION ──
      const submittedDeliveries = deliveries.filter(d => d.status === 'submitted');
      const approvedDeliveries = deliveries.filter(d => d.status === 'approved');
      const onTimeDeliveries = deliveries.filter(d => d.on_time === true);
      const totalFinished = deliveries.filter(d => ['approved', 'closed', 'in_dispute', 'resolved'].includes(d.status));

      const submitToApprove = [];
      for (const d of approvedDeliveries) {
        if (d.submitted_at && d.approved_at) {
          const h = hoursBetween(d.submitted_at, d.approved_at);
          if (h !== null && h >= 0) submitToApprove.push(h);
        }
      }

      const disputedDeliveries = deliveries.filter(d => ['in_dispute', 'contested'].includes(d.status));
      const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'under_review');
      const resolvedDisputes = disputes.filter(d => d.status === 'resolved_creator_favor' || d.status === 'resolved_brand_favor');
      const disputeResolutionTimes = resolvedDisputes.map(d => hoursBetween(d.created_date, d.resolved_at)).filter(h => h !== null && h >= 0);

      // ── ALERTS ──
      const incompleteOnboarding7d = [...filteredBrands, ...filteredCreators].filter(
        p => p.account_state !== 'ready' && new Date(p.created_date) >= sevenDaysAgo
      );
      const dormantPremium = usersInScope.filter(u => {
        const profile = [...filteredBrands, ...filteredCreators].find(p => p.user_id === u.id);
        return profile && (profile.subscription_status === 'premium' || profile.subscription_status === 'legacy') &&
          (!u.last_active || new Date(u.last_active) < thirtyDaysAgo);
      });

      // ── PIPELINE ──
      const pipeline = {
        draft: campaigns.filter(c => c.status === 'draft').length,
        under_review: campaigns.filter(c => c.status === 'under_review').length,
        active: activeCampaigns.length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        applications_closed: campaigns.filter(c => c.status === 'applications_closed').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        cancelled: campaigns.filter(c => c.status === 'cancelled').length,
      };

      return Response.json({
        period: { range, start: rangeStart.toISOString(), end: now.toISOString() },
        users: {
          total: usersInScope.length,
          brands: filteredBrands.length,
          creators: filteredCreators.length,
          new_signups: newBrands.length + newCreators.length,
          new_brands: newBrands.length,
          new_creators: newCreators.length,
          wau: wauUsers.length, wau_brands: wauBrands.length, wau_creators: wauCreators.length,
          mau: mauUsers.length, mau_brands: mauBrands.length, mau_creators: mauCreators.length,
          reactivated: reactivated.length,
          dormant: dormant.length,
          never_active: neverActive.length,
          onboarding_completion_rate: { brand: brandCompletionRate, creator: creatorCompletionRate },
          avg_time_signup_to_ready_hours: {
            brand: brandReadyTimes.length > 0 ? Math.round(median(brandReadyTimes)) : null,
            creator: creatorReadyTimes.length > 0 ? Math.round(median(creatorReadyTimes)) : null,
          },
        },
        time_to_first_value: {
          creator: {
            signup_to_first_app_hours: creatorFirstAppTimes.length > 0 ? Math.round(median(creatorFirstAppTimes)) : null,
            signup_to_first_accepted_hours: creatorFirstAcceptTimes.length > 0 ? Math.round(median(creatorFirstAcceptTimes)) : null,
            signup_to_first_delivery_hours: creatorFirstDeliveryTimes.length > 0 ? Math.round(median(creatorFirstDeliveryTimes)) : null,
          },
          brand: {
            signup_to_first_campaign_hours: brandFirstCampaignTimes.length > 0 ? Math.round(median(brandFirstCampaignTimes)) : null,
            signup_to_first_accept_hours: brandFirstAcceptTimes.length > 0 ? Math.round(median(brandFirstAcceptTimes)) : null,
            signup_to_first_approve_hours: brandFirstApproveTimes.length > 0 ? Math.round(median(brandFirstApproveTimes)) : null,
          },
        },
        marketplace: {
          total_campaigns: campaigns.length,
          active_campaigns: activeCampaigns.length,
          campaigns_zero_apps: campaignsZeroApps.length,
          avg_time_active_to_first_app_hours: activeToFirstApp.length > 0 ? Math.round(median(activeToFirstApp)) : null,
          avg_apps_per_campaign: appsPerCampaign.length > 0 ? Math.round(appsPerCampaign.reduce((s, v) => s + v, 0) / appsPerCampaign.length * 10) / 10 : 0,
          median_apps_per_campaign: median(appsPerCampaign),
          approval_rate: totalApps > 0 ? Math.round(acceptedApps.length / totalApps * 1000) / 10 : 0,
          avg_brand_response_time_hours: responseTimes.length > 0 ? Math.round(median(responseTimes)) : null,
          fill_rate: slotsTotal > 0 ? Math.round(slotsFilled / slotsTotal * 1000) / 10 : 0,
          total_applications: totalApps,
          pending_applications: pendingApps.length,
          accepted_applications: acceptedApps.length,
        },
        execution: {
          total_deliveries: deliveries.length,
          submitted: submittedDeliveries.length,
          approved: approvedDeliveries.length,
          contested: disputedDeliveries.length,
          on_time_rate: totalFinished.length > 0 ? Math.round(onTimeDeliveries.length / totalFinished.length * 1000) / 10 : 100,
          avg_time_submitted_to_approved_hours: submitToApprove.length > 0 ? Math.round(median(submitToApprove)) : null,
          dispute_rate: totalFinished.length > 0 ? Math.round(disputedDeliveries.length / totalFinished.length * 1000) / 10 : 0,
          disputes_open: openDisputes.length,
          disputes_resolved: resolvedDisputes.length,
          avg_dispute_resolution_hours: disputeResolutionTimes.length > 0 ? Math.round(median(disputeResolutionTimes)) : null,
          outcomes: {
            creator_favor: disputes.filter(d => d.status === 'resolved_creator_favor').length,
            brand_favor: disputes.filter(d => d.status === 'resolved_brand_favor').length,
          },
        },
        alerts: {
          pending_applications: pendingApps.length,
          submitted_deliveries_awaiting_review: submittedDeliveries.length,
          open_disputes: openDisputes.length,
          campaigns_zero_apps: campaignsZeroApps.length,
          incomplete_onboarding_7d: incompleteOnboarding7d.length,
          dormant_premium_users: dormantPremium.length,
        },
        pipeline,
      });
    }

    // ────────────────────────────────────────────
    // MODE: LISTS
    // ────────────────────────────────────────────
    if (mode === 'lists') {
      if (!listType) return err('list_type is required for mode=lists', 'MISSING_FIELDS');

      const sevenDaysAgo = daysAgo(7);

      if (listType === 'pending_applications') {
        const apps = await base44.asServiceRole.entities.Application.filter({ status: 'pending' }, '-created_date');
        const page = cursor ? apps.filter(a => a.id > cursor) : apps;
        const items = page.slice(0, limit);
        // Batch fetch related
        const campaignIds = [...new Set(items.map(a => a.campaign_id))];
        const creatorIds = [...new Set(items.map(a => a.creator_id))];
        const brandIds = [...new Set(items.map(a => a.brand_id))];
        const [campaignsArr, creatorsArr, brandsArr] = await Promise.all([
          Promise.all(campaignIds.map(id => base44.asServiceRole.entities.Campaign.filter({ id }))),
          Promise.all(creatorIds.map(id => base44.asServiceRole.entities.Creator.filter({ id }))),
          Promise.all(brandIds.map(id => base44.asServiceRole.entities.Brand.filter({ id }))),
        ]);
        const cMap = Object.fromEntries(campaignsArr.flat().map(c => [c.id, c]));
        const crMap = Object.fromEntries(creatorsArr.flat().map(c => [c.id, c]));
        const bMap = Object.fromEntries(brandsArr.flat().map(b => [b.id, b]));

        return Response.json({
          list_type: listType,
          items: items.map(a => ({
            id: a.id, campaign_title: cMap[a.campaign_id]?.title || '?',
            creator_name: crMap[a.creator_id]?.display_name || '?',
            brand_name: bMap[a.brand_id]?.company_name || '?',
            created_date: a.created_date,
            days_pending: Math.round((Date.now() - new Date(a.created_date).getTime()) / (1000 * 60 * 60 * 24)),
          })),
          total: apps.length,
          next_cursor: items.length === limit ? items[items.length - 1].id : null,
          has_more: items.length === limit,
        });
      }

      if (listType === 'submitted_deliveries') {
        const dels = await base44.asServiceRole.entities.Delivery.filter({ status: 'submitted' }, '-created_date');
        const page = cursor ? dels.filter(d => d.id > cursor) : dels;
        const items = page.slice(0, limit);
        const campaignIds = [...new Set(items.map(d => d.campaign_id))];
        const creatorIds = [...new Set(items.map(d => d.creator_id))];
        const [campaignsArr, creatorsArr] = await Promise.all([
          Promise.all(campaignIds.map(id => base44.asServiceRole.entities.Campaign.filter({ id }))),
          Promise.all(creatorIds.map(id => base44.asServiceRole.entities.Creator.filter({ id }))),
        ]);
        const cMap = Object.fromEntries(campaignsArr.flat().map(c => [c.id, c]));
        const crMap = Object.fromEntries(creatorsArr.flat().map(c => [c.id, c]));

        return Response.json({
          list_type: listType,
          items: items.map(d => ({
            id: d.id, campaign_title: cMap[d.campaign_id]?.title || '?',
            creator_name: crMap[d.creator_id]?.display_name || '?',
            submitted_at: d.submitted_at, deadline: d.deadline,
            days_waiting: d.submitted_at ? Math.round((Date.now() - new Date(d.submitted_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          })),
          total: dels.length,
          next_cursor: items.length === limit ? items[items.length - 1].id : null,
          has_more: items.length === limit,
        });
      }

      if (listType === 'open_disputes') {
        const allDisputes = await base44.asServiceRole.entities.Dispute.list();
        const open = allDisputes.filter(d => d.status === 'open' || d.status === 'under_review');
        const items = open.slice(0, limit);
        return Response.json({
          list_type: listType,
          items: items.map(d => ({
            id: d.id, delivery_id: d.delivery_id, raised_by: d.raised_by,
            reason: (d.reason || '').slice(0, 100), status: d.status, created_date: d.created_date,
            days_open: Math.round((Date.now() - new Date(d.created_date).getTime()) / (1000 * 60 * 60 * 24)),
          })),
          total: open.length, next_cursor: null, has_more: false,
        });
      }

      if (listType === 'campaigns_zero_apps') {
        const campaigns = await base44.asServiceRole.entities.Campaign.filter({ status: 'active' });
        const zero = campaigns.filter(c => (c.total_applications || 0) === 0);
        const items = zero.slice(0, limit);
        return Response.json({
          list_type: listType,
          items: items.map(c => ({
            id: c.id, title: c.title, brand_id: c.brand_id,
            created_date: c.created_date, deadline: c.deadline,
            days_active: Math.round((Date.now() - new Date(c.created_date).getTime()) / (1000 * 60 * 60 * 24)),
          })),
          total: zero.length, next_cursor: null, has_more: false,
        });
      }

      if (listType === 'incomplete_onboarding') {
        const [brands, creators] = await Promise.all([
          base44.asServiceRole.entities.Brand.list(),
          base44.asServiceRole.entities.Creator.list(),
        ]);
        const incomplete = [
          ...brands.filter(b => b.account_state !== 'ready').map(b => ({ ...b, _type: 'brand' })),
          ...creators.filter(c => c.account_state !== 'ready').map(c => ({ ...c, _type: 'creator' })),
        ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        const items = incomplete.slice(0, limit);
        return Response.json({
          list_type: listType,
          items: items.map(p => ({
            id: p.id, user_id: p.user_id, type: p._type,
            name: p.company_name || p.display_name || '?',
            onboarding_step: p.onboarding_step, created_date: p.created_date,
          })),
          total: incomplete.length, next_cursor: null, has_more: false,
        });
      }

      if (listType === 'dormant_users') {
        const allUsers = await base44.asServiceRole.entities.User.list();
        const thirtyDaysAgo = daysAgo(30);
        const dormant = allUsers.filter(u => !u.last_active || new Date(u.last_active) < thirtyDaysAgo);
        const items = dormant.slice(0, limit);
        return Response.json({
          list_type: listType,
          items: items.map(u => ({
            id: u.id, email: u.email, full_name: u.full_name,
            last_active: u.last_active, created_date: u.created_date,
          })),
          total: dormant.length, next_cursor: null, has_more: false,
        });
      }

      if (listType === 'dormant_premium') {
        const [allUsers, brands, creators] = await Promise.all([
          base44.asServiceRole.entities.User.list(),
          base44.asServiceRole.entities.Brand.list(),
          base44.asServiceRole.entities.Creator.list(),
        ]);
        const thirtyDaysAgo = daysAgo(30);
        const profiles = [...brands, ...creators];
        const dormantPremium = allUsers.filter(u => {
          const profile = profiles.find(p => p.user_id === u.id);
          return profile && (profile.subscription_status === 'premium' || profile.subscription_status === 'legacy') &&
            (!u.last_active || new Date(u.last_active) < thirtyDaysAgo);
        });
        const items = dormantPremium.slice(0, limit);
        return Response.json({
          list_type: listType,
          items: items.map(u => ({
            id: u.id, email: u.email, full_name: u.full_name,
            last_active: u.last_active, created_date: u.created_date,
          })),
          total: dormantPremium.length, next_cursor: null, has_more: false,
        });
      }

      return err(`Unknown list_type: ${listType}`, 'INVALID_LIST_TYPE');
    }

    // ────────────────────────────────────────────
    // MODE: USER360
    // ────────────────────────────────────────────
    if (mode === 'user360') {
      if (!targetId) return err('target_id is required for mode=user360', 'MISSING_FIELDS');

      const allUsers = await base44.asServiceRole.entities.User.list();
      const targetUser = allUsers.find(u => String(u.id) === String(targetId));
      if (!targetUser) return err('User not found', 'NOT_FOUND', 404);

      const [brands, creators] = await Promise.all([
        base44.asServiceRole.entities.Brand.filter({ user_id: targetId }),
        base44.asServiceRole.entities.Creator.filter({ user_id: targetId }),
      ]);

      const profile = brands[0] || creators[0];
      const profileType = brands[0] ? 'brand' : creators[0] ? 'creator' : null;

      if (!profile) return err('Profile not found', 'NOT_FOUND', 404);

      const filterKey = profileType === 'brand' ? 'brand_id' : 'creator_id';
      const [apps, deliveries, missions] = await Promise.all([
        base44.asServiceRole.entities.Application.filter({ [filterKey]: profile.id }),
        base44.asServiceRole.entities.Delivery.filter({ [filterKey]: profile.id }),
        base44.asServiceRole.entities.Mission.filter({ user_id: targetId }),
      ]);

      // Fetch campaign names for activity
      const campaignIds = [...new Set([...apps.map(a => a.campaign_id), ...deliveries.map(d => d.campaign_id)])];
      const campaignsArr = await Promise.all(campaignIds.slice(0, 30).map(id => base44.asServiceRole.entities.Campaign.filter({ id })));
      const cMap = Object.fromEntries(campaignsArr.flat().map(c => [c.id, c]));

      // Metrics
      const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'completed');
      const approved = deliveries.filter(d => d.status === 'approved');
      const onTime = deliveries.filter(d => d.on_time === true);

      const deliveryTimes = approved.map(d => d.submitted_at && d.approved_at ? hoursBetween(d.submitted_at, d.approved_at) : null).filter(h => h !== null);

      // Labels
      let labels = [];
      if (profileType === 'creator') {
        labels = calcCreatorLabels(profile, apps, deliveries);
      } else {
        const bCampaigns = await base44.asServiceRole.entities.Campaign.filter({ brand_id: profile.id });
        labels = calcBrandLabels(profile, bCampaigns, apps, deliveries);
      }

      // Recent activity (last 20)
      const activity = [
        ...apps.map(a => ({ type: 'application', id: a.id, campaign_title: cMap[a.campaign_id]?.title || '?', status: a.status, date: a.created_date })),
        ...deliveries.map(d => ({ type: 'delivery', id: d.id, campaign_title: cMap[d.campaign_id]?.title || '?', status: d.status, date: d.submitted_at || d.created_date })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

      return Response.json({
        user: {
          id: targetUser.id, email: targetUser.email, full_name: targetUser.full_name, role: targetUser.role,
          created_date: targetUser.created_date, first_active: targetUser.first_active, last_active: targetUser.last_active,
          tags: targetUser.tags || [], exclude_from_financials: targetUser.exclude_from_financials || false,
          visibility_status: targetUser.visibility_status || 'visible',
        },
        profile: {
          type: profileType, id: profile.id,
          account_state: profile.account_state, onboarding_step: profile.onboarding_step,
          subscription_status: profile.subscription_status, plan_level: profile.plan_level,
          name: profile.company_name || profile.display_name || '',
          state: profile.state, city: profile.city,
          ...(profileType === 'creator' ? { niche: profile.niche, profile_size: profile.profile_size } : { industry: profile.industry }),
        },
        metrics: {
          total_applications: apps.length,
          accepted: accepted.length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          pending: apps.filter(a => a.status === 'pending').length,
          withdrawn: apps.filter(a => a.status === 'withdrawn').length,
          total_deliveries: deliveries.length,
          approved: approved.length,
          submitted: deliveries.filter(d => d.status === 'submitted').length,
          contested: deliveries.filter(d => d.status === 'in_dispute' || d.status === 'contested').length,
          on_time_rate: approved.length > 0 ? Math.round(onTime.length / approved.length * 100) : 100,
          avg_delivery_time_hours: deliveryTimes.length > 0 ? Math.round(median(deliveryTimes)) : null,
        },
        labels,
        recent_activity: activity,
        missions: missions.map(m => ({ title: m.title, status: m.status, progress: `${m.current_progress || 0}/${m.target_value || 1}` })),
      });
    }

    // ────────────────────────────────────────────
    // MODE: CAMPAIGN360
    // ────────────────────────────────────────────
    if (mode === 'campaign360') {
      if (!targetId) return err('target_id is required for mode=campaign360', 'MISSING_FIELDS');

      const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: targetId });
      if (campaigns.length === 0) return err('Campaign not found', 'NOT_FOUND', 404);
      const campaign = campaigns[0];

      const [apps, deliveries, brandArr] = await Promise.all([
        base44.asServiceRole.entities.Application.filter({ campaign_id: targetId }),
        base44.asServiceRole.entities.Delivery.filter({ campaign_id: targetId }),
        base44.asServiceRole.entities.Brand.filter({ id: campaign.brand_id }),
      ]);

      const brand = brandArr[0];

      // Fetch creator names
      const creatorIds = [...new Set([...apps.map(a => a.creator_id), ...deliveries.map(d => d.creator_id)])];
      const creatorsArr = await Promise.all(creatorIds.slice(0, 50).map(id => base44.asServiceRole.entities.Creator.filter({ id })));
      const crMap = Object.fromEntries(creatorsArr.flat().map(c => [c.id, c]));

      const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'completed');
      const responseTimes = apps.filter(a => a.accepted_at || a.rejected_at).map(a => {
        const resolved = a.accepted_at || a.rejected_at;
        return hoursBetween(a.created_date, resolved);
      }).filter(h => h !== null && h >= 0);

      // Time to first app
      let timeToFirstApp = null;
      if (apps.length > 0) {
        const earliest = apps.reduce((min, a) => new Date(a.created_date) < new Date(min.created_date) ? a : min, apps[0]);
        timeToFirstApp = hoursBetween(campaign.created_date, earliest.created_date);
      }

      return Response.json({
        campaign: {
          id: campaign.id, title: campaign.title, status: campaign.status,
          brand_name: brand?.company_name || '?', created_date: campaign.created_date,
          deadline: campaign.deadline, slots_total: campaign.slots_total, slots_filled: campaign.slots_filled,
          total_applications: campaign.total_applications || apps.length,
          remuneration_type: campaign.remuneration_type, budget_min: campaign.budget_min, budget_max: campaign.budget_max,
        },
        metrics: {
          time_to_first_app_hours: timeToFirstApp,
          avg_response_time_hours: responseTimes.length > 0 ? Math.round(median(responseTimes)) : null,
          approval_rate: apps.length > 0 ? Math.round(accepted.length / apps.length * 100) : 0,
          fill_rate: (campaign.slots_total || 0) > 0 ? Math.round((campaign.slots_filled || 0) / campaign.slots_total * 100) : 0,
        },
        applications: apps.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 50).map(a => ({
          id: a.id, creator_name: crMap[a.creator_id]?.display_name || '?',
          status: a.status, proposed_rate: a.proposed_rate, created_date: a.created_date,
        })),
        deliveries: deliveries.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 50).map(d => ({
          id: d.id, creator_name: crMap[d.creator_id]?.display_name || '?',
          status: d.status, on_time: d.on_time, submitted_at: d.submitted_at,
        })),
      });
    }

    return err(`Invalid mode: ${mode}`, 'INVALID_MODE');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});