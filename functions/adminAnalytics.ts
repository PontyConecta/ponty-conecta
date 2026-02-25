import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { dateRange, type } = await req.json();

    // Users list request
    if (type === 'list_users') {
      const [allUsers, allBrands, allCreators] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.Brand.list(),
        base44.asServiceRole.entities.Creator.list()
      ]);
      return Response.json({ users: allUsers, brands: allBrands, creators: allCreators });
    }

    // Date range calculation
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();
    
    if (typeof dateRange === 'object' && dateRange?.type === 'custom') {
      startDate = new Date(dateRange.from);
      const rangeDays = Math.ceil((new Date(dateRange.to) - startDate) / (1000 * 60 * 60 * 24));
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - rangeDays);
    } else if (dateRange === 'day') {
      startDate.setDate(now.getDate() - 1);
      previousStartDate.setDate(now.getDate() - 2);
    } else if (dateRange === 'week') {
      startDate.setDate(now.getDate() - 7);
      previousStartDate.setDate(now.getDate() - 14);
    } else if (dateRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
      previousStartDate.setMonth(now.getMonth() - 2);
    } else if (dateRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
      previousStartDate.setFullYear(now.getFullYear() - 2);
    }

    // Fetch all data in parallel
    const [allUsers, brands, creators, campaigns, applications, deliveries, subscriptions, disputes] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.Delivery.list(),
      base44.asServiceRole.entities.Subscription.list(),
      base44.asServiceRole.entities.Dispute.list()
    ]);

    // Helper: filter by date range
    const filterByDate = (items, start, end, dateField = 'created_date') => {
      return items.filter(item => {
        const d = new Date(item[dateField]);
        return d >= start && d <= (end || now);
      });
    };

    // Current and previous period items
    const recentBrands = filterByDate(brands, startDate, now);
    const recentCreators = filterByDate(creators, startDate, now);
    const previousBrands = filterByDate(brands, previousStartDate, startDate);
    const previousCreators = filterByDate(creators, previousStartDate, startDate);
    const recentApplications = filterByDate(applications, startDate, now);
    const previousApplications = filterByDate(applications, previousStartDate, startDate);
    const recentDeliveries = filterByDate(deliveries, startDate, now);
    const previousDeliveries = filterByDate(deliveries, previousStartDate, startDate);

    // === FINANCIAL METRICS ===
    const activeSubs = subscriptions.filter(s => s.status === 'premium' || s.status === 'active');
    const brandSubs = activeSubs.filter(s => s.plan_type?.includes('brand'));
    const creatorSubs = activeSubs.filter(s => s.plan_type?.includes('creator'));

    const calcMRR = (subs) => subs.reduce((sum, s) => {
      const monthly = s.plan_type?.includes('annual') ? (s.amount || 0) / 12 : (s.amount || 0);
      return sum + monthly;
    }, 0);

    const totalMRR = calcMRR(activeSubs);
    const brandMRR = calcMRR(brandSubs);
    const creatorMRR = calcMRR(creatorSubs);

    const filteredMRR = totalMRR;

    const totalActiveUsers = brands.filter(b => b.account_state === 'ready').length + creators.filter(c => c.account_state === 'ready').length;
    const brandActiveUsers = brands.filter(b => b.account_state === 'ready').length;
    const creatorActiveUsers = creators.filter(c => c.account_state === 'ready').length;
    const filteredActiveUsers = totalActiveUsers;

    const arpu = filteredActiveUsers > 0 ? filteredMRR / filteredActiveUsers : 0;
    const arr = filteredMRR * 12;

    // LTV estimation (average subscription lifetime * ARPU)
    const avgLifetimeMonths = 12; // Estimated
    const ltv = arpu * avgLifetimeMonths;

    // Churn
    const cancelledSubs = subscriptions.filter(s => s.status === 'legacy' || s.status === 'cancelled');
    const churnRate = subscriptions.length > 0 ? (cancelledSubs.length / subscriptions.length * 100) : 0;

    // Retention rate
    const retentionRate = 100 - churnRate;

    // === SUCCESS METRICS ===
    const approvedDeliveries = deliveries.filter(d => d.status === 'approved').length;
    const completedDeliveries = deliveries.filter(d => ['approved', 'closed'].includes(d.status)).length;
    const totalFinishedDeliveries = deliveries.filter(d => ['approved', 'contested', 'closed', 'resolved'].includes(d.status)).length;
    const successRate = totalFinishedDeliveries > 0 ? (approvedDeliveries / totalFinishedDeliveries * 100) : 100;

    // Conversion funnel
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalApps = applications.length;
    const acceptedApps = applications.filter(a => a.status === 'accepted').length;
    const completedApps = applications.filter(a => a.status === 'completed').length;
    const conversionRate = totalApps > 0 ? (acceptedApps / totalApps * 100) : 0;
    const fulfillmentRate = acceptedApps > 0 ? (completedDeliveries / acceptedApps * 100) : 0;

    // === GROWTH METRICS WITH COMPARISON ===
    const currentNewUsers = recentBrands.length + recentCreators.length;
    const previousNewUsers = previousBrands.length + previousCreators.length;
    const growthRate = previousNewUsers > 0 ? ((currentNewUsers - previousNewUsers) / previousNewUsers * 100) : (currentNewUsers > 0 ? 100 : 0);

    const currentAppsCount = recentApplications.length;
    const previousAppsCount = previousApplications.length;
    const appsGrowth = previousAppsCount > 0 ? ((currentAppsCount - previousAppsCount) / previousAppsCount * 100) : 0;

    // === PIPELINE (Campaigns by status) ===
    const pipeline = {
      draft: campaigns.filter(c => c.status === 'draft').length,
      under_review: campaigns.filter(c => c.status === 'under_review').length,
      active: activeCampaigns,
      applications_closed: campaigns.filter(c => c.status === 'applications_closed').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      cancelled: campaigns.filter(c => c.status === 'cancelled').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
    };

    // === CHARTS ===

    // Revenue chart (12 months, by segment)
    const revenueChart = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthSubs = subscriptions.filter(s => {
        const subDate = new Date(s.start_date || s.created_date);
        return subDate.getMonth() === date.getMonth() && 
               subDate.getFullYear() === date.getFullYear() &&
               (s.status === 'premium' || s.status === 'active');
      });
      
      const brandRev = calcMRR(monthSubs.filter(s => s.plan_type?.includes('brand')));
      const creatorRev = calcMRR(monthSubs.filter(s => s.plan_type?.includes('creator')));
      const totalRev = brandRev + creatorRev;
      
      revenueChart.push({ 
        date: monthStr, 
        total: Math.round(totalRev),
        marcas: Math.round(brandRev), 
        criadores: Math.round(creatorRev)
      });
    }

    // User growth chart (weekly, cumulative)
    const userGrowthChart = [];
    const weeks = dateRange === 'year' ? 12 : dateRange === 'month' ? 8 : 7;
    const interval = dateRange === 'year' ? 30 : 7;
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * interval));
      const dateStr = dateRange === 'year' 
        ? date.toLocaleDateString('pt-BR', { month: 'short' })
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      
      const weekBrands = brands.filter(b => new Date(b.created_date) <= date).length;
      const weekCreators = creators.filter(c => new Date(c.created_date) <= date).length;
      const newBrands = brands.filter(b => {
        const d = new Date(b.created_date);
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - interval);
        return d > prevDate && d <= date;
      }).length;
      const newCreators = creators.filter(c => {
        const d = new Date(c.created_date);
        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - interval);
        return d > prevDate && d <= date;
      }).length;
      
      userGrowthChart.push({ 
        date: dateStr, 
        marcas_total: weekBrands, 
        criadores_total: weekCreators,
        novos_marcas: newBrands,
        novos_criadores: newCreators
      });
    }

    // Engagement chart (daily for week/day, weekly for month/year)
    const engagementChart = [];
    const engDays = dateRange === 'day' ? 24 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 12;
    for (let i = engDays - 1; i >= 0; i--) {
      let date, dateStr, matchFn;
      
      if (dateRange === 'day') {
        date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        dateStr = `${date.getHours()}h`;
        matchFn = (itemDate) => itemDate.getHours() === date.getHours() && itemDate.toDateString() === date.toDateString();
      } else if (dateRange === 'year') {
        date = new Date();
        date.setMonth(date.getMonth() - i);
        dateStr = date.toLocaleDateString('pt-BR', { month: 'short' });
        matchFn = (itemDate) => itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
      } else {
        date = new Date();
        date.setDate(date.getDate() - i);
        dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        matchFn = (itemDate) => itemDate.toDateString() === date.toDateString();
      }
      
      const dayApps = applications.filter(a => matchFn(new Date(a.created_date))).length;
      const dayDeliveries = deliveries.filter(d => matchFn(new Date(d.created_date))).length;
      const dayAccepted = applications.filter(a => a.status === 'accepted' && a.accepted_at && matchFn(new Date(a.accepted_at))).length;
      
      engagementChart.push({ 
        date: dateStr, 
        candidaturas: dayApps, 
        entregas: dayDeliveries,
        aceitas: dayAccepted
      });
    }

    // Conversion funnel data
    const funnelData = [
      { stage: 'Campanhas Criadas', value: totalCampaigns, color: '#818cf8' },
      { stage: 'Campanhas Ativas', value: activeCampaigns, color: '#6366f1' },
      { stage: 'Candidaturas', value: totalApps, color: '#3b82f6' },
      { stage: 'Aceitas', value: acceptedApps, color: '#10b981' },
      { stage: 'Entregas Aprovadas', value: approvedDeliveries, color: '#059669' },
    ];

    // Category/niche distribution
    const nicheCount = {};
    creators.forEach(c => {
      (c.niche || []).forEach(n => { nicheCount[n] = (nicheCount[n] || 0) + 1; });
    });
    const nicheDistribution = Object.entries(nicheCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Platform distribution
    const platformCount = {};
    creators.forEach(c => {
      (c.platforms || []).forEach(p => { platformCount[p.name] = (platformCount[p.name] || 0) + 1; });
    });
    const platformDistribution = Object.entries(platformCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // State distribution
    const stateCount = {};
    [...brands, ...creators].forEach(p => {
      if (p.state) stateCount[p.state] = (stateCount[p.state] || 0) + 1;
    });
    const stateDistribution = Object.entries(stateCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Profile size distribution
    const sizeCount = { nano: 0, micro: 0, mid: 0, macro: 0, mega: 0 };
    creators.forEach(c => { if (c.profile_size) sizeCount[c.profile_size]++; });
    const sizeDistribution = Object.entries(sizeCount)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Subscription plan distribution
    const planCount = { starter: 0, premium: 0, trial: 0, legacy: 0 };
    [...brands, ...creators].forEach(p => {
      const s = p.subscription_status || 'starter';
      if (planCount[s] !== undefined) planCount[s]++;
    });
    const planDistribution = Object.entries(planCount)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Disputes summary
    const disputesSummary = {
      open: disputes.filter(d => d.status === 'open').length,
      under_review: disputes.filter(d => d.status === 'under_review').length,
      resolved_brand: disputes.filter(d => d.status === 'resolved_brand_favor').length,
      resolved_creator: disputes.filter(d => d.status === 'resolved_creator_favor').length,
      total: disputes.length,
    };

    // Top brands by campaigns
    const brandCampaignCount = {};
    campaigns.forEach(c => {
      if (c.brand_id) brandCampaignCount[c.brand_id] = (brandCampaignCount[c.brand_id] || 0) + 1;
    });
    const topBrands = Object.entries(brandCampaignCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const brand = brands.find(b => b.id === id);
        return { name: brand?.company_name || 'Desconhecido', campaigns: count };
      });

    // Top creators by applications
    const creatorAppCount = {};
    applications.forEach(a => {
      if (a.creator_id) creatorAppCount[a.creator_id] = (creatorAppCount[a.creator_id] || 0) + 1;
    });
    const topCreators = Object.entries(creatorAppCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const creator = creators.find(c => c.id === id);
        return { name: creator?.display_name || 'Desconhecido', applications: count };
      });

    // Build response
    const analytics = {
      // Summary metrics
      mrr: Math.round(filteredMRR),
      brandMRR: Math.round(brandMRR),
      creatorMRR: Math.round(creatorMRR),
      arr: Math.round(arr),
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv),
      churnRate: Math.round(churnRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,

      // User counts
      totalUsers: allUsers.length,
      totalBrands: brands.length,
      totalCreators: creators.length,
      activeUsers: totalActiveUsers,
      brandActiveUsers,
      creatorActiveUsers,
      activeSubscribers: activeSubs.length,
      brandSubscribers: brandSubs.length,
      creatorSubscribers: creatorSubs.length,

      // Period metrics
      newUsers: currentNewUsers,
      newBrands: recentBrands.length,
      newCreators: recentCreators.length,
      previousNewUsers,
      growthRate: Math.round(growthRate * 10) / 10,
      newApplications: currentAppsCount,
      appsGrowth: Math.round(appsGrowth * 10) / 10,

      // Campaign / marketplace
      totalCampaigns,
      activeCampaigns,
      totalApplications: totalApps,
      acceptedApplications: acceptedApps,
      completedDeliveries,
      pendingDisputes: disputesSummary.open + disputesSummary.under_review,

      // Pipeline
      pipeline,
      funnelData,
      disputesSummary,

      // Rankings
      topBrands,
      topCreators,

      // Distributions
      nicheDistribution,
      platformDistribution,
      stateDistribution,
      sizeDistribution,
      planDistribution,

      // Charts
      revenueChart,
      userGrowthChart,
      engagementChart,
    };

    return Response.json(analytics);

  } catch (error) {
    console.error('Admin analytics error:', error);
    return Response.json({ 
      error: 'Erro ao processar analytics',
      details: error.message 
    }, { status: 500 });
  }
});