import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const FN = 'adminAnalyticsV2';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// ─── Helpers ───

function parseRange(range) {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, days };
}

function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function hoursDiff(from, to) {
  if (!from || !to) return null;
  return Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60));
}

function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
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

// ─── Label computation ───

function computeCreatorLabels(creator, apps, deliveries) {
  const labels = [];
  if (creator.account_state !== 'ready') labels.push('onboarding_incomplete');
  if (apps.length > 0 && apps.every(a => a.status === 'rejected' || a.status === 'withdrawn')) labels.push('applied_no_accept');
  const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'completed');
  if (accepted.length > 0 && deliveries.filter(d => d.status === 'submitted' || d.status === 'approved').length === 0) labels.push('accepted_no_delivery');
  const submitted = deliveries.filter(d => d.submitted_at);
  if (submitted.length > 0) {
    const avgHrs = avg(submitted.map(d => hoursDiff(d.created_date, d.submitted_at)).filter(Boolean));
    if (avgHrs > 168) labels.push('slow_submitter');
  }
  const disputed = deliveries.filter(d => d.status === 'in_dispute' || d.status === 'contested');
  if (disputed.length >= 2 || (deliveries.length > 0 && disputed.length / deliveries.length > 0.3)) labels.push('high_dispute_risk');
  const approved = deliveries.filter(d => d.status === 'approved');
  if (approved.length >= 3 && deliveries.filter(d => d.on_time).length / Math.max(approved.length, 1) >= 0.9) labels.push('top_performer');
  return labels;
}

function computeBrandLabels(brand, campaigns, apps, deliveries) {
  const labels = [];
  if (brand.account_state !== 'ready') labels.push('onboarding_incomplete');
  if (campaigns.length === 0 && brand.account_state === 'ready') labels.push('created_no_campaign');
  const withZeroApps = campaigns.filter(c => (c.total_applications || 0) === 0 && c.status === 'active');
  if (withZeroApps.length > 0) labels.push('campaign_no_apps');
  const pending = apps.filter(a => a.status === 'pending');
  if (pending.length > 0) {
    const avgWait = avg(pending.map(a => hoursDiff(a.created_date, new Date().toISOString())).filter(Boolean));
    if (avgWait > 120) labels.push('slow_responder');
  }
  const disputed = deliveries.filter(d => d.status === 'in_dispute' || d.status === 'contested');
  if (disputed.length >= 2) labels.push('high_dispute_rate');
  const approved = deliveries.filter(d => d.status === 'approved');
  if (approved.length >= 3) labels.push('high_quality');
  return labels;
}

// ─── MODE HANDLERS ───

async function handleSummary(base44, range, filters) {
  const { start, end, days } = parseRange(range);
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [allUsers, allBrands, allCreators, allCampaigns, allApps, allDeliveries, allDisputes] = await Promise.all([
    base44.asServiceRole.entities.User.list(),
    base44.asServiceRole.entities.Brand.list(),
    base44.asServiceRole.entities.Creator.list(),
    base44.asServiceRole.entities.Campaign.list(),
    base44.asServiceRole.entities.Application.list(),
    base44.asServiceRole.entities.Delivery.list(),
    base44.asServiceRole.entities.Dispute.list(),
  ]);

  // Apply profile filters
  let brands = filters.profile_type === 'creator' ? [] : applyProfileFilters(allBrands, filters);
  let creators = filters.profile_type === 'brand' ? [] : applyProfileFilters(allCreators, filters);
  const brandUserIds = new Set(brands.map(b => b.user_id));
  const creatorUserIds = new Set(creators.map(c => c.user_id));
  const profileUserIds = new Set([...brandUserIds, ...creatorUserIds]);

  // Users that match filters
  const users = filters.profile_type
    ? allUsers.filter(u => profileUserIds.has(u.id))
    : allUsers;

  // ── USER METRICS ──
  const newBrands = brands.filter(b => inRange(b.created_date, start, end));
  const newCreators = creators.filter(c => inRange(c.created_date, start, end));

  const wauUsers = users.filter(u => u.last_active && new Date(u.last_active) >= sevenDaysAgo);
  const mauUsers = users.filter(u => u.last_active && new Date(u.last_active) >= thirtyDaysAgo);
  const reactivated = users.filter(u =>
    u.last_active && inRange(u.last_active, start, end) &&
    u.created_date && (new Date(end) - new Date(u.created_date)) > 30 * 24 * 60 * 60 * 1000 &&
    (!u.first_active || !inRange(u.first_active, start, end))
  );
  const dormant = users.filter(u =>
    !u.last_active || (new Date(end) - new Date(u.last_active)) > 30 * 24 * 60 * 60 * 1000
  );
  const neverActive = users.filter(u => !u.first_active && !u.last_active);

  // Onboarding completion
  const readyBrands = brands.filter(b => b.account_state === 'ready' && inRange(b.created_date, start, end));
  const readyCreators = creators.filter(c => c.account_state === 'ready' && inRange(c.created_date, start, end));
  const onboardBrandRate = pct(readyBrands.length, newBrands.length);
  const onboardCreatorRate = pct(readyCreators.length, newCreators.length);

  // Time signup → ready (for those completed in range)
  const brandReadyTimes = readyBrands.map(b => hoursDiff(b.created_date, b.updated_date)).filter(h => h !== null && h >= 0);
  const creatorReadyTimes = readyCreators.map(c => hoursDiff(c.created_date, c.updated_date)).filter(h => h !== null && h >= 0);

  // ── TIME TO FIRST VALUE ──
  const brandIds = new Set(brands.map(b => b.id));
  const creatorIds = new Set(creators.map(c => c.id));

  // Creator TTFV
  const creatorFirstAppTimes = [];
  const creatorFirstAcceptTimes = [];
  const creatorFirstDeliveryTimes = [];
  for (const c of creators) {
    const myApps = allApps.filter(a => a.creator_id === c.id);
    if (myApps.length > 0) {
      const earliest = myApps.reduce((min, a) => a.created_date < min ? a.created_date : min, myApps[0].created_date);
      const h = hoursDiff(c.created_date, earliest);
      if (h !== null && h >= 0) creatorFirstAppTimes.push(h);
    }
    const accepted = myApps.filter(a => a.accepted_at);
    if (accepted.length > 0) {
      const earliest = accepted.reduce((min, a) => a.accepted_at < min ? a.accepted_at : min, accepted[0].accepted_at);
      const h = hoursDiff(c.created_date, earliest);
      if (h !== null && h >= 0) creatorFirstAcceptTimes.push(h);
    }
    const myDel = allDeliveries.filter(d => d.creator_id === c.id && d.submitted_at);
    if (myDel.length > 0) {
      const earliest = myDel.reduce((min, d) => d.submitted_at < min ? d.submitted_at : min, myDel[0].submitted_at);
      const h = hoursDiff(c.created_date, earliest);
      if (h !== null && h >= 0) creatorFirstDeliveryTimes.push(h);
    }
  }

  // Brand TTFV
  const brandFirstCampaignTimes = [];
  const brandFirstAcceptTimes = [];
  const brandFirstApproveTimes = [];
  for (const b of brands) {
    const myCamps = allCampaigns.filter(c => c.brand_id === b.id);
    if (myCamps.length > 0) {
      const earliest = myCamps.reduce((min, c) => c.created_date < min ? c.created_date : min, myCamps[0].created_date);
      const h = hoursDiff(b.created_date, earliest);
      if (h !== null && h >= 0) brandFirstCampaignTimes.push(h);
    }
    const myApps = allApps.filter(a => a.brand_id === b.id && a.accepted_at);
    if (myApps.length > 0) {
      const earliest = myApps.reduce((min, a) => a.accepted_at < min ? a.accepted_at : min, myApps[0].accepted_at);
      const h = hoursDiff(b.created_date, earliest);
      if (h !== null && h >= 0) brandFirstAcceptTimes.push(h);
    }
    const myDel = allDeliveries.filter(d => d.brand_id === b.id && d.approved_at);
    if (myDel.length > 0) {
      const earliest = myDel.reduce((min, d) => d.approved_at < min ? d.approved_at : min, myDel[0].approved_at);
      const h = hoursDiff(b.created_date, earliest);
      if (h !== null && h >= 0) brandFirstApproveTimes.push(h);
    }
  }

  // ── MARKETPLACE METRICS ──
  const activeCampaigns = allCampaigns.filter(c => c.status === 'active');
  const campaignsZeroApps = activeCampaigns.filter(c => (c.total_applications || 0) === 0);

  // Time active → first app
  const activeToFirstAppTimes = [];
  for (const camp of activeCampaigns) {
    const campApps = allApps.filter(a => a.campaign_id === camp.id);
    if (campApps.length > 0) {
      const earliest = campApps.reduce((min, a) => a.created_date < min ? a.created_date : min, campApps[0].created_date);
      const h = hoursDiff(camp.updated_date, earliest); // updated_date ≈ when it went active
      if (h !== null && h >= 0) activeToFirstAppTimes.push(h);
    }
  }

  const appsPerCampaign = allCampaigns.filter(c => c.total_applications > 0).map(c => c.total_applications || 0);
  const acceptedApps = allApps.filter(a => a.status === 'accepted' || a.status === 'completed');
  const pendingApps = allApps.filter(a => a.status === 'pending');

  // Brand response time
  const responseTimes = allApps
    .filter(a => a.accepted_at || a.rejected_at)
    .map(a => hoursDiff(a.created_date, a.accepted_at || a.rejected_at))
    .filter(h => h !== null && h >= 0);

  // Fill rate
  const fillablesCampaigns = allCampaigns.filter(c => c.slots_total > 0);
  const totalSlots = fillablesCampaigns.reduce((s, c) => s + (c.slots_total || 0), 0);
  const filledSlots = fillablesCampaigns.reduce((s, c) => s + (c.slots_filled || 0), 0);

  // ── EXECUTION METRICS ──
  const submittedDel = allDeliveries.filter(d => d.status === 'submitted');
  const approvedDel = allDeliveries.filter(d => d.status === 'approved');
  const contestedDel = allDeliveries.filter(d => ['in_dispute', 'contested'].includes(d.status));
  const onTimeDel = allDeliveries.filter(d => d.on_time === true);
  const finishedDel = allDeliveries.filter(d => ['approved', 'closed', 'in_dispute', 'contested', 'resolved'].includes(d.status));

  const submitToApproveTimes = approvedDel
    .map(d => hoursDiff(d.submitted_at, d.approved_at))
    .filter(h => h !== null && h >= 0);

  const openDisputes = allDisputes.filter(d => d.status === 'open' || d.status === 'under_review');
  const resolvedDisputes = allDisputes.filter(d => d.status.startsWith('resolved_'));
  const disputeResolveTimes = resolvedDisputes
    .map(d => hoursDiff(d.created_date, d.resolved_at))
    .filter(h => h !== null && h >= 0);

  // ── ALERTS ──
  const incompleteOnboarding7d = [...brands, ...creators].filter(p =>
    p.account_state !== 'ready' &&
    p.created_date && (new Date(end) - new Date(p.created_date)) > 7 * 24 * 60 * 60 * 1000
  );

  const premiumUserIds = new Set([
    ...brands.filter(b => b.subscription_status === 'premium').map(b => b.user_id),
    ...creators.filter(c => c.subscription_status === 'premium').map(c => c.user_id),
  ]);
  const dormantPremium = users.filter(u =>
    premiumUserIds.has(u.id) &&
    (!u.last_active || (new Date(end) - new Date(u.last_active)) > 30 * 24 * 60 * 60 * 1000)
  );

  // ── PIPELINE ──
  const pipeline = {
    draft: allCampaigns.filter(c => c.status === 'draft').length,
    under_review: allCampaigns.filter(c => c.status === 'under_review').length,
    active: activeCampaigns.length,
    paused: allCampaigns.filter(c => c.status === 'paused').length,
    applications_closed: allCampaigns.filter(c => c.status === 'applications_closed').length,
    completed: allCampaigns.filter(c => c.status === 'completed').length,
    cancelled: allCampaigns.filter(c => c.status === 'cancelled').length,
  };

  // ── PREVIOUS PERIOD for growth comparison ──
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  const prevNewBrands = brands.filter(b => inRange(b.created_date, prevStart, start));
  const prevNewCreators = creators.filter(c => inRange(c.created_date, prevStart, start));
  const previousNewUsers = prevNewBrands.length + prevNewCreators.length;
  const currentNewUsers = newBrands.length + newCreators.length;
  const growthRate = previousNewUsers > 0
    ? Math.round(((currentNewUsers - previousNewUsers) / previousNewUsers) * 100 * 10) / 10
    : (currentNewUsers > 0 ? 100 : 0);

  // ── SUCCESS / CONVERSION ──
  const completedDeliveriesCount = allDeliveries.filter(d => ['approved', 'closed'].includes(d.status)).length;
  const totalFinishedDel = finishedDel.length;
  const successRate = totalFinishedDel > 0 ? Math.round((approvedDel.length / totalFinishedDel) * 1000) / 10 : 100;
  const conversionRate = allApps.length > 0 ? Math.round((acceptedApps.length / allApps.length) * 1000) / 10 : 0;
  const fulfillmentRate = acceptedApps.length > 0 ? Math.round((completedDeliveriesCount / acceptedApps.length) * 1000) / 10 : 0;

  // ── FUNNELDATA ──
  const funnelData = [
    { stage: 'Campanhas Criadas', value: allCampaigns.length, color: '#818cf8' },
    { stage: 'Campanhas Ativas', value: activeCampaigns.length, color: '#6366f1' },
    { stage: 'Candidaturas', value: allApps.length, color: '#3b82f6' },
    { stage: 'Aceitas', value: acceptedApps.length, color: '#10b981' },
    { stage: 'Entregas Aprovadas', value: approvedDel.length, color: '#059669' },
  ];

  // ── ENGAGEMENT CHART (daily/monthly) ──
  const engagementChart = [];
  const engDays = days <= 7 ? 7 : days <= 30 ? 30 : 12;
  for (let i = engDays - 1; i >= 0; i--) {
    let date, dateStr, matchFn;
    if (days > 30) {
      date = new Date(end);
      date.setMonth(date.getMonth() - i);
      dateStr = date.toLocaleDateString('pt-BR', { month: 'short' });
      matchFn = (itemDate) => itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
    } else {
      date = new Date(end);
      date.setDate(date.getDate() - i);
      dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      matchFn = (itemDate) => itemDate.toDateString() === date.toDateString();
    }
    engagementChart.push({
      date: dateStr,
      candidaturas: allApps.filter(a => matchFn(new Date(a.created_date))).length,
      entregas: allDeliveries.filter(d => matchFn(new Date(d.created_date))).length,
      aceitas: allApps.filter(a => (a.status === 'accepted' || a.status === 'completed') && a.accepted_at && matchFn(new Date(a.accepted_at))).length,
    });
  }

  // ── USER GROWTH CHART ──
  const userGrowthChart = [];
  const ugWeeks = days > 30 ? 12 : 8;
  const ugInterval = days > 30 ? 30 : 7;
  for (let i = ugWeeks - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - (i * ugInterval));
    const dateStr = days > 30
      ? date.toLocaleDateString('pt-BR', { month: 'short' })
      : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const prevDate = new Date(date); prevDate.setDate(prevDate.getDate() - ugInterval);
    userGrowthChart.push({
      date: dateStr,
      marcas_total: brands.filter(b => new Date(b.created_date) <= date).length,
      criadores_total: creators.filter(c => new Date(c.created_date) <= date).length,
      novos_marcas: brands.filter(b => { const d2 = new Date(b.created_date); return d2 > prevDate && d2 <= date; }).length,
      novos_criadores: creators.filter(c => { const d2 = new Date(c.created_date); return d2 > prevDate && d2 <= date; }).length,
    });
  }

  // ── DISTRIBUTIONS ──
  const nicheCount = {};
  creators.forEach(c => (c.niche || []).forEach(n => { nicheCount[n] = (nicheCount[n] || 0) + 1; }));
  const nicheDistribution = Object.entries(nicheCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const platformCount = {};
  creators.forEach(c => (c.platforms || []).forEach(p => { platformCount[p.name] = (platformCount[p.name] || 0) + 1; }));
  const platformDistribution = Object.entries(platformCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const stateCount = {};
  [...brands, ...creators].forEach(p => { if (p.state) stateCount[p.state] = (stateCount[p.state] || 0) + 1; });
  const stateDistribution = Object.entries(stateCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  const sizeCount = { nano: 0, micro: 0, mid: 0, macro: 0, mega: 0 };
  creators.forEach(c => { if (c.profile_size) sizeCount[c.profile_size]++; });
  const sizeDistribution = Object.entries(sizeCount).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const planCount = { starter: 0, premium: 0, trial: 0, legacy: 0 };
  [...brands, ...creators].forEach(p => { const s = p.subscription_status || 'starter'; if (planCount[s] !== undefined) planCount[s]++; });
  const planDistribution = Object.entries(planCount).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));

  // ── DISPUTES SUMMARY ──
  const disputesSummary = {
    open: allDisputes.filter(d => d.status === 'open').length,
    under_review: allDisputes.filter(d => d.status === 'under_review').length,
    resolved_brand: allDisputes.filter(d => d.status === 'resolved_brand_favor').length,
    resolved_creator: allDisputes.filter(d => d.status === 'resolved_creator_favor').length,
    total: allDisputes.length,
  };

  // ── TOP RANKINGS ──
  const brandCampaignCount = {};
  allCampaigns.forEach(c => { if (c.brand_id) brandCampaignCount[c.brand_id] = (brandCampaignCount[c.brand_id] || 0) + 1; });
  const topBrands = Object.entries(brandCampaignCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, count]) => ({ name: brands.find(b => b.id === id)?.company_name || 'Desconhecido', campaigns: count }));

  const creatorAppCount = {};
  allApps.forEach(a => { if (a.creator_id) creatorAppCount[a.creator_id] = (creatorAppCount[a.creator_id] || 0) + 1; });
  const topCreators = Object.entries(creatorAppCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, count]) => ({ name: creators.find(c => c.id === id)?.display_name || 'Desconhecido', applications: count }));

  // ── ACTIVE USERS ──
  const brandActiveUsers = brands.filter(b => b.account_state === 'ready').length;
  const creatorActiveUsers = creators.filter(c => c.account_state === 'ready').length;

  // ── NEW APPS for engagement tab ──
  const newApplications = allApps.filter(a => inRange(a.created_date, start, end)).length;

  return Response.json({
    period: { range, start: start.toISOString(), end: end.toISOString() },
    users: {
      total: users.length,
      brands: brands.length, creators: creators.length,
      new_signups: currentNewUsers,
      new_brands: newBrands.length, new_creators: newCreators.length,
      wau: wauUsers.length,
      wau_brands: wauUsers.filter(u => brandUserIds.has(u.id)).length,
      wau_creators: wauUsers.filter(u => creatorUserIds.has(u.id)).length,
      mau: mauUsers.length,
      mau_brands: mauUsers.filter(u => brandUserIds.has(u.id)).length,
      mau_creators: mauUsers.filter(u => creatorUserIds.has(u.id)).length,
      reactivated: reactivated.length,
      dormant: dormant.length,
      never_active: neverActive.length,
      onboarding_completion_rate: { brand: onboardBrandRate, creator: onboardCreatorRate },
      avg_time_signup_to_ready_hours: { brand: avg(brandReadyTimes), creator: avg(creatorReadyTimes) },
    },
    time_to_first_value: {
      creator: {
        signup_to_first_app_hours: avg(creatorFirstAppTimes),
        signup_to_first_accepted_hours: avg(creatorFirstAcceptTimes),
        signup_to_first_delivery_hours: avg(creatorFirstDeliveryTimes),
      },
      brand: {
        signup_to_first_campaign_hours: avg(brandFirstCampaignTimes),
        signup_to_first_accept_hours: avg(brandFirstAcceptTimes),
        signup_to_first_approve_hours: avg(brandFirstApproveTimes),
      },
    },
    marketplace: {
      total_campaigns: allCampaigns.length,
      active_campaigns: activeCampaigns.length,
      campaigns_zero_apps: campaignsZeroApps.length,
      avg_time_active_to_first_app_hours: avg(activeToFirstAppTimes),
      avg_apps_per_campaign: avg(appsPerCampaign),
      median_apps_per_campaign: median(appsPerCampaign),
      approval_rate: pct(acceptedApps.length, allApps.length),
      avg_brand_response_time_hours: avg(responseTimes),
      fill_rate: pct(filledSlots, totalSlots),
      total_applications: allApps.length,
      pending_applications: pendingApps.length,
      accepted_applications: acceptedApps.length,
    },
    execution: {
      total_deliveries: allDeliveries.length,
      submitted: submittedDel.length,
      approved: approvedDel.length,
      contested: contestedDel.length,
      on_time_rate: pct(onTimeDel.length, finishedDel.length),
      avg_time_submitted_to_approved_hours: avg(submitToApproveTimes),
      dispute_rate: pct(contestedDel.length, finishedDel.length),
      disputes_open: openDisputes.length,
      disputes_resolved: resolvedDisputes.length,
      avg_dispute_resolution_hours: avg(disputeResolveTimes),
      outcomes: {
        creator_favor: allDisputes.filter(d => d.status === 'resolved_creator_favor').length,
        brand_favor: allDisputes.filter(d => d.status === 'resolved_brand_favor').length,
      },
    },
    alerts: {
      pending_applications: pendingApps.length,
      submitted_deliveries_awaiting_review: submittedDel.length,
      open_disputes: openDisputes.length,
      campaigns_zero_apps: campaignsZeroApps.length,
      incomplete_onboarding_7d: incompleteOnboarding7d.length,
      dormant_premium_users: dormantPremium.length,
    },
    pipeline,
    // ── COMPAT LAYER (flat fields matching v1 shape for UI) ──
    totalUsers: users.length,
    totalBrands: brands.length,
    totalCreators: creators.length,
    brandActiveUsers,
    creatorActiveUsers,
    newUsers: currentNewUsers,
    newBrands: newBrands.length,
    newCreators: newCreators.length,
    previousNewUsers,
    growthRate,
    activeCampaigns: activeCampaigns.length,
    totalApplications: allApps.length,
    acceptedApplications: acceptedApps.length,
    completedDeliveries: completedDeliveriesCount,
    newApplications,
    conversionRate,
    successRate,
    fulfillmentRate,
    pendingDisputes: disputesSummary.open + disputesSummary.under_review,
    funnelData,
    disputesSummary,
    engagementChart,
    userGrowthChart,
    nicheDistribution,
    platformDistribution,
    stateDistribution,
    sizeDistribution,
    planDistribution,
    topBrands,
    topCreators,
  });
}

async function handleLists(base44, range, listType, limit, cursor) {
  const { start, end } = parseRange(range);

  // Fetch what we need based on list type
  const pageSize = Math.min(limit || 20, 50);

  if (listType === 'pending_applications') {
    const apps = await base44.asServiceRole.entities.Application.filter({ status: 'pending' }, '-created_date');
    const paged = paginateWithCursor(apps, cursor, pageSize);
    // Enrich
    const campaignIds = [...new Set(paged.items.map(a => a.campaign_id))];
    const creatorIds = [...new Set(paged.items.map(a => a.creator_id))];
    const brandIds = [...new Set(paged.items.map(a => a.brand_id))];
    const [campaigns, creators, brands] = await Promise.all([
      batchFetch(base44.asServiceRole.entities.Campaign, campaignIds),
      batchFetch(base44.asServiceRole.entities.Creator, creatorIds),
      batchFetch(base44.asServiceRole.entities.Brand, brandIds),
    ]);
    return Response.json({
      list_type: listType,
      items: paged.items.map(a => ({
        id: a.id,
        campaign_title: campaigns[a.campaign_id]?.title || '—',
        creator_name: creators[a.creator_id]?.display_name || '—',
        brand_name: brands[a.brand_id]?.company_name || '—',
        created_date: a.created_date,
        days_pending: Math.round((Date.now() - new Date(a.created_date)) / (1000 * 60 * 60 * 24)),
      })),
      total: apps.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
    });
  }

  if (listType === 'submitted_deliveries') {
    const dels = await base44.asServiceRole.entities.Delivery.filter({ status: 'submitted' }, '-created_date');
    const paged = paginateWithCursor(dels, cursor, pageSize);
    const campaignIds = [...new Set(paged.items.map(d => d.campaign_id))];
    const creatorIds = [...new Set(paged.items.map(d => d.creator_id))];
    const [campaigns, creators] = await Promise.all([
      batchFetch(base44.asServiceRole.entities.Campaign, campaignIds),
      batchFetch(base44.asServiceRole.entities.Creator, creatorIds),
    ]);
    return Response.json({
      list_type: listType,
      items: paged.items.map(d => ({
        id: d.id,
        campaign_title: campaigns[d.campaign_id]?.title || '—',
        creator_name: creators[d.creator_id]?.display_name || '—',
        submitted_at: d.submitted_at,
        days_waiting: d.submitted_at ? Math.round((Date.now() - new Date(d.submitted_at)) / (1000 * 60 * 60 * 24)) : 0,
      })),
      total: dels.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
    });
  }

  if (listType === 'open_disputes') {
    const allDisputes = await base44.asServiceRole.entities.Dispute.list();
    const open = allDisputes.filter(d => d.status === 'open' || d.status === 'under_review');
    const paged = paginateWithCursor(open, cursor, pageSize);
    return Response.json({
      list_type: listType,
      items: paged.items.map(d => ({
        id: d.id,
        delivery_id: d.delivery_id,
        raised_by: d.raised_by,
        status: d.status,
        reason: d.reason?.substring(0, 100),
        created_date: d.created_date,
        days_open: Math.round((Date.now() - new Date(d.created_date)) / (1000 * 60 * 60 * 24)),
      })),
      total: open.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
    });
  }

  if (listType === 'campaigns_zero_apps') {
    const camps = await base44.asServiceRole.entities.Campaign.filter({ status: 'active' });
    const zero = camps.filter(c => (c.total_applications || 0) === 0);
    const paged = paginateWithCursor(zero, cursor, pageSize);
    const brandIds = [...new Set(paged.items.map(c => c.brand_id))];
    const brands = await batchFetch(base44.asServiceRole.entities.Brand, brandIds);
    return Response.json({
      list_type: listType,
      items: paged.items.map(c => ({
        id: c.id,
        title: c.title,
        brand_name: brands[c.brand_id]?.company_name || '—',
        created_date: c.created_date,
        deadline: c.deadline,
        days_active: Math.round((Date.now() - new Date(c.created_date)) / (1000 * 60 * 60 * 24)),
      })),
      total: zero.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
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
    const paged = paginateWithCursor(incomplete, cursor, pageSize);
    return Response.json({
      list_type: listType,
      items: paged.items.map(p => ({
        id: p.id,
        user_id: p.user_id,
        type: p._type,
        name: p.company_name || p.display_name || '—',
        onboarding_step: p.onboarding_step,
        created_date: p.created_date,
        days_since_signup: Math.round((Date.now() - new Date(p.created_date)) / (1000 * 60 * 60 * 24)),
      })),
      total: incomplete.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
    });
  }

  if (listType === 'list_users') {
    const [users, brands, creators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);
    return Response.json({
      list_type: listType,
      users,
      brands,
      creators,
    });
  }

  if (listType === 'dormant_users' || listType === 'dormant_premium') {
    const [users, brands, creators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);
    const threshold = new Date(); threshold.setDate(threshold.getDate() - 30);
    let dormant = users.filter(u => !u.last_active || new Date(u.last_active) < threshold);
    if (listType === 'dormant_premium') {
      const premiumUserIds = new Set([
        ...brands.filter(b => b.subscription_status === 'premium').map(b => b.user_id),
        ...creators.filter(c => c.subscription_status === 'premium').map(c => c.user_id),
      ]);
      dormant = dormant.filter(u => premiumUserIds.has(u.id));
    }
    const paged = paginateWithCursor(dormant, cursor, pageSize);
    const brandMap = Object.fromEntries(brands.map(b => [b.user_id, b]));
    const creatorMap = Object.fromEntries(creators.map(c => [c.user_id, c]));
    return Response.json({
      list_type: listType,
      items: paged.items.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        profile_type: brandMap[u.id] ? 'brand' : creatorMap[u.id] ? 'creator' : 'none',
        last_active: u.last_active,
        days_inactive: u.last_active ? Math.round((Date.now() - new Date(u.last_active)) / (1000 * 60 * 60 * 24)) : null,
        subscription_status: (brandMap[u.id] || creatorMap[u.id])?.subscription_status || 'starter',
      })),
      total: dormant.length,
      next_cursor: paged.next_cursor,
      has_more: paged.has_more,
    });
  }

  return err(`Unknown list_type: ${listType}`, 'INVALID_INPUT');
}

async function handleUser360(base44, targetId) {
  // Find user
  const allUsers = await base44.asServiceRole.entities.User.list();
  const user = allUsers.find(u => String(u.id) === String(targetId));
  if (!user) return err('User not found', 'NOT_FOUND', 404);

  const [brands, creators] = await Promise.all([
    base44.asServiceRole.entities.Brand.filter({ user_id: user.id }),
    base44.asServiceRole.entities.Creator.filter({ user_id: user.id }),
  ]);
  const profile = brands[0] || creators[0];
  const profileType = brands[0] ? 'brand' : creators[0] ? 'creator' : null;

  if (!profile) return err('Profile not found', 'NOT_FOUND', 404);

  const filterKey = profileType === 'brand' ? 'brand_id' : 'creator_id';
  const [apps, deliveries, missions] = await Promise.all([
    base44.asServiceRole.entities.Application.filter({ [filterKey]: profile.id }),
    base44.asServiceRole.entities.Delivery.filter({ [filterKey]: profile.id }),
    base44.asServiceRole.entities.Mission.filter({ user_id: user.id }),
  ]);

  // Enrich campaigns for activity
  const campaignIds = [...new Set([...apps.map(a => a.campaign_id), ...deliveries.map(d => d.campaign_id)])];
  const campaigns = await batchFetch(base44.asServiceRole.entities.Campaign, campaignIds);

  // Compute labels
  let labels;
  if (profileType === 'creator') {
    labels = computeCreatorLabels(profile, apps, deliveries);
  } else {
    const brandCampaigns = await base44.asServiceRole.entities.Campaign.filter({ brand_id: profile.id });
    labels = computeBrandLabels(profile, brandCampaigns, apps, deliveries);
  }

  // Recent activity (last 20)
  const activity = [
    ...apps.map(a => ({ type: 'application', id: a.id, campaign_title: campaigns[a.campaign_id]?.title || '—', status: a.status, date: a.created_date })),
    ...deliveries.map(d => ({ type: 'delivery', id: d.id, campaign_title: campaigns[d.campaign_id]?.title || '—', status: d.status, date: d.submitted_at || d.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  // Metrics
  const approved = deliveries.filter(d => d.status === 'approved');
  const onTime = deliveries.filter(d => d.on_time === true);
  const deliveryTimes = approved.map(d => hoursDiff(d.created_date, d.approved_at)).filter(h => h !== null && h >= 0);

  return Response.json({
    user: {
      id: user.id, email: user.email, full_name: user.full_name, role: user.role,
      created_date: user.created_date, first_active: user.first_active, last_active: user.last_active,
      tags: user.tags || [], exclude_from_financials: user.exclude_from_financials || false,
      visibility_status: user.visibility_status || 'visible',
    },
    profile: {
      type: profileType, id: profile.id,
      account_state: profile.account_state, onboarding_step: profile.onboarding_step,
      subscription_status: profile.subscription_status, plan_level: profile.plan_level,
      display_name: profile.display_name || profile.company_name || '—',
      state: profile.state, city: profile.city,
      ...(profileType === 'creator' ? { niche: profile.niche, profile_size: profile.profile_size } : { industry: profile.industry }),
    },
    metrics: {
      total_applications: apps.length,
      accepted: apps.filter(a => a.status === 'accepted' || a.status === 'completed').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
      pending: apps.filter(a => a.status === 'pending').length,
      withdrawn: apps.filter(a => a.status === 'withdrawn').length,
      total_deliveries: deliveries.length,
      approved: approved.length,
      submitted: deliveries.filter(d => d.status === 'submitted').length,
      contested: deliveries.filter(d => ['in_dispute', 'contested'].includes(d.status)).length,
      on_time_rate: pct(onTime.length, Math.max(approved.length, 1)),
      avg_delivery_time_hours: avg(deliveryTimes),
    },
    labels,
    recent_activity: activity,
    missions: missions.map(m => ({ title: m.title, status: m.status, progress: `${m.current_progress || 0}/${m.target_value || 1}` })),
  });
}

async function handleCampaign360(base44, targetId) {
  const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: targetId });
  if (campaigns.length === 0) return err('Campaign not found', 'NOT_FOUND', 404);
  const campaign = campaigns[0];

  const [apps, deliveries, brands] = await Promise.all([
    base44.asServiceRole.entities.Application.filter({ campaign_id: campaign.id }),
    base44.asServiceRole.entities.Delivery.filter({ campaign_id: campaign.id }),
    base44.asServiceRole.entities.Brand.filter({ id: campaign.brand_id }),
  ]);

  const creatorIds = [...new Set([...apps.map(a => a.creator_id), ...deliveries.map(d => d.creator_id)])];
  const creators = await batchFetch(base44.asServiceRole.entities.Creator, creatorIds);

  // Time to first app
  const firstApp = apps.length > 0 ? apps.reduce((min, a) => a.created_date < min ? a.created_date : min, apps[0].created_date) : null;
  const timeToFirstApp = firstApp ? hoursDiff(campaign.created_date, firstApp) : null;

  // Avg response time
  const responded = apps.filter(a => a.accepted_at || a.rejected_at);
  const respTimes = responded.map(a => hoursDiff(a.created_date, a.accepted_at || a.rejected_at)).filter(h => h !== null && h >= 0);

  const accepted = apps.filter(a => a.status === 'accepted' || a.status === 'completed');

  return Response.json({
    campaign: {
      id: campaign.id, title: campaign.title, status: campaign.status,
      brand_name: brands[0]?.company_name || '—',
      created_date: campaign.created_date, deadline: campaign.deadline,
      slots_total: campaign.slots_total, slots_filled: campaign.slots_filled,
      total_applications: apps.length,
      remuneration_type: campaign.remuneration_type,
      budget_min: campaign.budget_min, budget_max: campaign.budget_max,
    },
    metrics: {
      time_to_first_app_hours: timeToFirstApp,
      avg_response_time_hours: avg(respTimes),
      approval_rate: pct(accepted.length, apps.length),
      fill_rate: pct(campaign.slots_filled || 0, campaign.slots_total || 1),
    },
    applications: apps.slice(0, 50).map(a => ({
      id: a.id,
      creator_name: creators[a.creator_id]?.display_name || '—',
      status: a.status,
      proposed_rate: a.proposed_rate,
      created_date: a.created_date,
    })),
    deliveries: deliveries.slice(0, 50).map(d => ({
      id: d.id,
      creator_name: creators[d.creator_id]?.display_name || '—',
      status: d.status,
      on_time: d.on_time,
      submitted_at: d.submitted_at,
    })),
  });
}

// ─── Utility ───

function paginateWithCursor(items, cursor, pageSize) {
  let startIdx = 0;
  if (cursor) {
    const idx = items.findIndex(i => String(i.id) === String(cursor));
    if (idx >= 0) startIdx = idx + 1;
  }
  const page = items.slice(startIdx, startIdx + pageSize);
  const hasMore = startIdx + pageSize < items.length;
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;
  return { items: page, has_more: hasMore, next_cursor: nextCursor };
}

async function batchFetch(entityApi, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const results = await Promise.all(unique.map(id => entityApi.filter({ id })));
  const map = {};
  for (const arr of results) {
    if (arr.length > 0) map[arr[0].id] = arr[0];
  }
  return map;
}

// ─── Main Handler ───

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
    const limit = body.limit || 20;
    const cursor = body.cursor || null;
    const targetId = body.target_id || null;
    const listType = body.list_type || null;

    console.log(`[${FN}] mode=${mode} range=${range} filters=${JSON.stringify(filters)}`);

    // ── 3. DISPATCH ──
    if (mode === 'summary') return await handleSummary(base44, range, filters);
    if (mode === 'lists') {
      if (!listType) return err('list_type is required for mode=lists', 'MISSING_FIELDS');
      return await handleLists(base44, range, listType, limit, cursor);
    }
    if (mode === 'user360') {
      if (!targetId) return err('target_id is required for mode=user360', 'MISSING_FIELDS');
      return await handleUser360(base44, targetId);
    }
    if (mode === 'campaign360') {
      if (!targetId) return err('target_id is required for mode=campaign360', 'MISSING_FIELDS');
      return await handleCampaign360(base44, targetId);
    }

    return err(`Invalid mode: ${mode}`, 'INVALID_INPUT');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});