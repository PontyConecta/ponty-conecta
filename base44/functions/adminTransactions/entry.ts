import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Toggle exclude_from_financials on a user
    if (action === 'toggle_exclude') {
      const { user_id, exclude } = body;
      if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });
      await base44.asServiceRole.entities.User.update(user_id, { exclude_from_financials: !!exclude });
      return Response.json({ success: true });
    }

    // Fetch all data
    const [allUsers, allBrands, allCreators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);

    // Build excluded sets
    const excludedUserIds = new Set();
    const excludedCustomerIds = new Set();
    const excludedEmails = new Set();
    const excludedUsers = allUsers.filter(u => u.exclude_from_financials);
    for (const u of excludedUsers) {
      excludedUserIds.add(u.id);
      if (u.email) excludedEmails.add(u.email.toLowerCase());
      const brand = allBrands.find(b => b.user_id === u.id);
      const creator = allCreators.find(c => c.user_id === u.id);
      if (brand?.stripe_customer_id) excludedCustomerIds.add(brand.stripe_customer_id);
      if (creator?.stripe_customer_id) excludedCustomerIds.add(creator.stripe_customer_id);
    }

    // Fetch ALL Stripe subscriptions
    const subscriptions = [];
    let hasMore = true;
    let startingAfter = undefined;
    while (hasMore) {
      const params = { limit: 100, status: 'all', expand: ['data.customer', 'data.plan.product'] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      subscriptions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    const BRAND_PRODUCT = 'prod_U0gIiVNyRmWGIs';
    const CREATOR_PRODUCT = 'prod_U0gCi96g4grdc0';

    const transactions = subscriptions.map(sub => {
      const customer = sub.customer;
      const customerId = typeof customer === 'string' ? customer : customer?.id;
      const customerEmail = typeof customer === 'object' ? customer?.email : null;
      const item = sub.items?.data?.[0];
      const amount = (item?.price?.unit_amount || 0) / 100;
      const interval = item?.price?.recurring?.interval;
      const product = item?.price?.product;
      const productId = typeof product === 'string' ? product : product?.id;

      // Determine profile type
      let profileType = 'desconhecido';
      if (productId === BRAND_PRODUCT) profileType = 'marca';
      else if (productId === CREATOR_PRODUCT) profileType = 'criador';

      // Determine plan type
      const planType = interval === 'year' ? 'anual' : 'mensal';

      // Match to user
      const matchingBrand = allBrands.find(b => b.stripe_customer_id === customerId);
      const matchingCreator = allCreators.find(c => c.stripe_customer_id === customerId);
      const matchingUserId = matchingBrand?.user_id || matchingCreator?.user_id;
      const matchingUser = matchingUserId ? allUsers.find(u => u.id === matchingUserId) : null;

      // If no profile match, try email match
      let userEmail = matchingUser?.email || customerEmail;
      let userId = matchingUser?.id || null;
      let isExcluded = false;

      if (matchingUser) {
        isExcluded = !!matchingUser.exclude_from_financials;
      } else if (customerEmail) {
        isExcluded = excludedEmails.has(customerEmail.toLowerCase());
        const emailUser = allUsers.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
        if (emailUser) {
          userId = emailUser.id;
          userEmail = emailUser.email;
          isExcluded = !!emailUser.exclude_from_financials;
        }
      }

      // Map status
      let status = sub.status;
      if (status === 'active' || status === 'trialing') status = 'ativa';
      else if (status === 'canceled') status = 'cancelada';
      else if (status === 'past_due') status = 'pendente';

      return {
        date: new Date(sub.created * 1000).toISOString(),
        email: userEmail || 'desconhecido',
        user_id: userId,
        profile_type: profileType,
        plan_type: planType,
        amount,
        status,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customerId,
        is_excluded: isExcluded,
      };
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Totals
    const activeReal = transactions.filter(t => t.status === 'ativa' && !t.is_excluded);
    const activeAll = transactions.filter(t => t.status === 'ativa');
    const realRevenue = activeReal.reduce((sum, t) => sum + t.amount, 0);
    const grossRevenue = activeAll.reduce((sum, t) => sum + t.amount, 0);

    return Response.json({
      transactions,
      summary: {
        total: transactions.length,
        real_revenue: Math.round(realRevenue * 100) / 100,
        gross_revenue: Math.round(grossRevenue * 100) / 100,
        active_count: activeAll.length,
        active_real_count: activeReal.length,
        excluded_count: excludedUsers.length,
      }
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});