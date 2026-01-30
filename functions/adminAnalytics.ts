import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Verify admin access
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all data in parallel
    const [
      allUsers,
      allBrands,
      allCreators,
      allCampaigns,
      allApplications,
      allDeliveries,
      allSubscriptions
    ] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
      base44.asServiceRole.entities.Campaign.list(),
      base44.asServiceRole.entities.Application.list(),
      base44.asServiceRole.entities.Delivery.list(),
      base44.asServiceRole.entities.Subscription.list()
    ]);

    // Calculate active subscriptions MRR
    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active');
    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.plan_type?.includes('monthly')) {
        return sum + (sub.amount || 45);
      } else if (sub.plan_type?.includes('annual')) {
        return sum + ((sub.amount || 450) / 12);
      }
      return sum;
    }, 0);

    // Growth metrics
    const newBrandsToday = allBrands.filter(b => 
      new Date(b.created_date) >= todayStart
    ).length;
    
    const newCreatorsToday = allCreators.filter(c => 
      new Date(c.created_date) >= todayStart
    ).length;

    const newBrandsWeek = allBrands.filter(b => 
      new Date(b.created_date) >= weekStart
    ).length;
    
    const newCreatorsWeek = allCreators.filter(c => 
      new Date(c.created_date) >= weekStart
    ).length;

    const newBrandsMonth = allBrands.filter(b => 
      new Date(b.created_date) >= monthStart
    ).length;
    
    const newCreatorsMonth = allCreators.filter(c => 
      new Date(c.created_date) >= monthStart
    ).length;

    // Engagement metrics
    const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter(a => a.status === 'pending').length;
    const approvedDeliveries = allDeliveries.filter(d => d.status === 'approved').length;
    const disputedDeliveries = allDeliveries.filter(d => d.status === 'in_dispute').length;

    // User distribution
    const activeBrands = allBrands.filter(b => b.subscription_status === 'active').length;
    const activeCreators = allCreators.filter(c => c.subscription_status === 'active').length;
    const exploringBrands = allBrands.filter(b => b.account_state === 'exploring').length;
    const exploringCreators = allCreators.filter(c => c.account_state === 'exploring').length;

    // Success metrics
    const successRate = allDeliveries.length > 0 
      ? ((approvedDeliveries / allDeliveries.length) * 100).toFixed(1)
      : 0;

    return Response.json({
      revenue: {
        mrr: Math.round(monthlyRevenue),
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue: Math.round(monthlyRevenue * activeSubscriptions.length)
      },
      growth: {
        today: { brands: newBrandsToday, creators: newCreatorsToday },
        week: { brands: newBrandsWeek, creators: newCreatorsWeek },
        month: { brands: newBrandsMonth, creators: newCreatorsMonth }
      },
      engagement: {
        activeCampaigns,
        totalApplications,
        pendingApplications,
        approvedDeliveries,
        disputedDeliveries,
        successRate: parseFloat(successRate)
      },
      users: {
        total: allUsers.length,
        brands: {
          total: allBrands.length,
          active: activeBrands,
          exploring: exploringBrands
        },
        creators: {
          total: allCreators.length,
          active: activeCreators,
          exploring: exploringCreators
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});