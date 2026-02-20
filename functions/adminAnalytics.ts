import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se usuário é admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { dateRange } = await req.json();

    // Calcular datas baseado no range
    const now = new Date();
    let startDate = new Date();
    
    if (dateRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Check if this is a users-only request
    const { dateRange, type } = await req.json();

    if (type === 'list_users') {
      const [users, brands, creators] = await Promise.all([
        base44.asServiceRole.entities.User.list(),
        base44.asServiceRole.entities.Brand.list(),
        base44.asServiceRole.entities.Creator.list()
      ]);
      return Response.json({ users, brands, creators });
    }

    // Buscar dados das entidades usando service role
    const [brands, creators, campaigns, applications, deliveries, subscriptions, disputes] = await Promise.all([
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.Delivery.list(),
      base44.asServiceRole.entities.Subscription.list(),
      base44.asServiceRole.entities.Dispute.list()
    ]);

    // Filtrar por data
    const filterByDate = (items, dateField = 'created_date') => {
      return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startDate;
      });
    };

    const recentBrands = filterByDate(brands);
    const recentCreators = filterByDate(creators);
    const recentCampaigns = filterByDate(campaigns);
    const recentApplications = filterByDate(applications);
    const recentDeliveries = filterByDate(deliveries);

    // Calcular métricas
    const activeSubscribers = subscriptions.filter(s => s.status === 'active').length;
    const totalUsers = brands.length + creators.length;
    const activeUsers = brands.filter(b => b.account_state === 'active').length + 
                        creators.filter(c => c.account_state === 'active').length;
    
    // MRR (Monthly Recurring Revenue)
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const monthlyAmount = s.plan_type?.includes('annual') ? s.amount / 12 : s.amount;
        return sum + (monthlyAmount || 0);
      }, 0);

    // ARPU (Average Revenue Per User)
    const arpu = activeUsers > 0 ? mrr / activeUsers : 0;

    // Taxa de sucesso (deliveries aprovadas)
    const approvedDeliveries = deliveries.filter(d => d.status === 'approved').length;
    const totalDeliveries = deliveries.filter(d => ['approved', 'contested', 'closed'].includes(d.status)).length;
    const successRate = totalDeliveries > 0 ? (approvedDeliveries / totalDeliveries * 100).toFixed(1) : 0;

    // Novos usuários no período
    const newUsers = recentBrands.length + recentCreators.length;

    // Churn rate (assinaturas canceladas vs ativas)
    const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled').length;
    const totalSubs = subscriptions.length;
    const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs * 100).toFixed(1) : 0;

    // Gráfico de receita (últimos 12 meses)
    const revenueChart = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthSubs = subscriptions.filter(s => {
        const subDate = new Date(s.start_date);
        return subDate.getMonth() === date.getMonth() && 
               subDate.getFullYear() === date.getFullYear() &&
               s.status === 'active';
      });
      
      const revenue = monthSubs.reduce((sum, s) => {
        const monthlyAmount = s.plan_type?.includes('annual') ? s.amount / 12 : s.amount;
        return sum + (monthlyAmount || 0);
      }, 0);
      
      revenueChart.push({ date: monthStr, revenue: Math.round(revenue) });
    }

    // Gráfico de crescimento de usuários
    const userGrowthChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      
      const weekBrands = brands.filter(b => new Date(b.created_date) <= date).length;
      const weekCreators = creators.filter(c => new Date(c.created_date) <= date).length;
      
      userGrowthChart.push({ date: dateStr, brands: weekBrands, creators: weekCreators });
    }

    // Gráfico de engajamento
    const engagementChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      
      const dayApplications = applications.filter(a => {
        const appDate = new Date(a.created_date);
        return appDate.toDateString() === date.toDateString();
      }).length;
      
      const dayDeliveries = deliveries.filter(d => {
        const delDate = new Date(d.created_date);
        return delDate.toDateString() === date.toDateString();
      }).length;
      
      engagementChart.push({ date: dateStr, applications: dayApplications, deliveries: dayDeliveries });
    }

    // Distribuição de categorias
    const categoryCount = {};
    campaigns.forEach(c => {
      const niches = c.niche_required || [];
      niches.forEach(niche => {
        categoryCount[niche] = (categoryCount[niche] || 0) + 1;
      });
    });
    
    const categoryDistribution = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Montar resposta
    const analytics = {
      mrr,
      activeUsers,
      successRate,
      arpu,
      activeSubscribers,
      newUsers,
      churnRate,
      totalUsers,
      totalBrands: brands.length,
      totalCreators: creators.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalApplications: applications.length,
      conversionRate: applications.length > 0 ? (applications.filter(a => a.status === 'accepted').length / applications.length * 100).toFixed(1) : 0,
      completedDeliveries: deliveries.filter(d => d.status === 'approved').length,
      pendingDisputes: disputes.filter(d => d.status === 'open').length,
      totalTransactionValue: deliveries.filter(d => d.status === 'approved').length * 500, // Estimativa
      revenueChart,
      userGrowthChart,
      engagementChart,
      categoryDistribution
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