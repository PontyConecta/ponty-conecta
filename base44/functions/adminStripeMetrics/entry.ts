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

    // Fetch all users, brands, creators in parallel
    const [allUsers, allBrands, allCreators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);

    // Build set of excluded Stripe customer IDs, user IDs, AND emails from users flagged exclude_from_financials
    const excludedCustomerIds = new Set();
    const excludedUserIds = new Set();
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

    // No hardcoded orphan exclusions
    const orphanExcludedCount = 0;

    console.log(`Excluding ${excludedUsers.length} user(s) + ${orphanExcludedCount} orphan(s) (${excludedCustomerIds.size} Stripe customer(s), ${excludedEmails.size} email(s)) from financials`);
    console.log(`Excluded Stripe IDs: ${[...excludedCustomerIds].join(', ')}`);
    console.log(`Excluded emails: ${[...excludedEmails].join(', ')}`);

    const subscriptions = [];
    let hasMore = true;
    let startingAfter = undefined;
    
    while (hasMore) {
      const params = { limit: 100, status: 'all', expand: ['data.plan.product', 'data.customer'] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      subscriptions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - (365 * 24 * 60 * 60);

    const invoicesRaw = [];
    hasMore = true;
    startingAfter = undefined;
    
    while (hasMore) {
      const params = { limit: 100, created: { gte: oneYearAgo }, status: 'paid', expand: ['data.charge'] };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.invoices.list(params);
      invoicesRaw.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Filter out invoices whose charge was refunded
    const invoices = invoicesRaw.filter(inv => {
      const charge = inv.charge;
      if (charge && typeof charge === 'object' && charge.refunded) {
        console.log(`Excluding refunded invoice ${inv.id} (charge ${charge.id}, amount ${inv.amount_paid / 100})`);
        return false;
      }
      return true;
    });
    console.log(`Invoices: ${invoicesRaw.length} total, ${invoicesRaw.length - invoices.length} refunded excluded, ${invoices.length} valid`);

    const BRAND_PRODUCT = 'prod_U0gIiVNyRmWGIs';
    const CREATOR_PRODUCT = 'prod_U0gCi96g4grdc0';

    // Filter: must have value AND not be an excluded customer
    const hasValue = (sub) => {
      const item = sub.items?.data?.[0];
      return item?.price?.unit_amount > 0;
    };

    const getCustomerId = (sub) => typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
    const getCustomerEmail = (sub) => (typeof sub.customer === 'object' && sub.customer?.email) ? sub.customer.email.toLowerCase() : null;

    // Build set of all known user emails and all known stripe customer IDs for matching
    const allUserEmails = new Set(allUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
    const allKnownCustomerIds = new Set();
    allBrands.forEach(b => { if (b.stripe_customer_id) allKnownCustomerIds.add(b.stripe_customer_id); });
    allCreators.forEach(c => { if (c.stripe_customer_id) allKnownCustomerIds.add(c.stripe_customer_id); });

    const isNotExcluded = (sub) => {
      const custId = getCustomerId(sub);
      if (excludedCustomerIds.has(custId)) return false;
      const email = getCustomerEmail(sub);
      if (email && excludedEmails.has(email)) return false;
      // Exclude orphan Stripe customers (no matching user in the system)
      const isKnownById = allKnownCustomerIds.has(custId);
      const isKnownByEmail = email && allUserEmails.has(email);
      if (!isKnownById && !isKnownByEmail) {
        console.log(`Excluding orphan Stripe sub ${sub.id} (customer ${custId}, email ${email})`);
        return false;
      }
      return true;
    };

    const validSub = (sub) => hasValue(sub) && isNotExcluded(sub);
    const validInvoice = (inv) => {
      const custId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
      if (excludedCustomerIds.has(custId)) return false;
      // Also check invoice customer email if available
      const custEmail = (typeof inv.customer === 'object' && inv.customer?.email) ? inv.customer.email.toLowerCase() : null;
      if (custEmail && excludedEmails.has(custEmail)) return false;
      return true;
    };

    const activeSubs = subscriptions.filter(s => (s.status === 'active' || s.status === 'trialing') && validSub(s));

    // Build set of customer IDs that have an active sub — their cancelled subs are superseded
    const activeCustomerIds = new Set(activeSubs.map(s => getCustomerId(s)));

    const cancelledSubs = subscriptions.filter(s => {
      if (s.status !== 'canceled') return false;
      if (!validSub(s)) return false;
      // Exclude cancelled subs if the same customer has an active replacement
      if (activeCustomerIds.has(getCustomerId(s))) return false;
      return true;
    });
    const pastDueSubs = subscriptions.filter(s => s.status === 'past_due' && validSub(s));
    const filteredInvoices = invoices.filter(validInvoice);

    const getProductId = (sub) => {
      const item = sub.items?.data?.[0];
      const product = item?.price?.product;
      if (typeof product === 'string') return product;
      if (product?.id) return product.id;
      return null;
    };

    const brandActiveSubs = activeSubs.filter(s => getProductId(s) === BRAND_PRODUCT);
    const creatorActiveSubs = activeSubs.filter(s => getProductId(s) === CREATOR_PRODUCT);

    const brandCancelledSubs = cancelledSubs.filter(s => getProductId(s) === BRAND_PRODUCT);
    const creatorCancelledSubs = cancelledSubs.filter(s => getProductId(s) === CREATOR_PRODUCT);

    const calcSubMRR = (sub) => {
      const item = sub.items?.data?.[0];
      if (!item) return 0;
      const amount = (item.price?.unit_amount || 0) / 100;
      const interval = item.price?.recurring?.interval;
      const intervalCount = item.price?.recurring?.interval_count || 1;
      if (interval === 'month') return amount / intervalCount;
      if (interval === 'year') return amount / (12 * intervalCount);
      if (interval === 'week') return (amount * 52) / (12 * intervalCount);
      if (interval === 'day') return (amount * 365) / (12 * intervalCount);
      return amount;
    };

    const totalMRR = activeSubs.reduce((sum, s) => sum + calcSubMRR(s), 0);
    const brandMRR = brandActiveSubs.reduce((sum, s) => sum + calcSubMRR(s), 0);
    const creatorMRR = creatorActiveSubs.reduce((sum, s) => sum + calcSubMRR(s), 0);
    const arr = totalMRR * 12;
    const arpu = activeSubs.length > 0 ? totalMRR / activeSubs.length : 0;

    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const recentlyCancelled = cancelledSubs.filter(s => s.canceled_at && s.canceled_at >= thirtyDaysAgo);
    const brandRecentlyCancelled = recentlyCancelled.filter(s => getProductId(s) === BRAND_PRODUCT);
    const creatorRecentlyCancelled = recentlyCancelled.filter(s => getProductId(s) === CREATOR_PRODUCT);

    // Churn calculations per segment
    const calcChurn = (active, cancelled) => {
      const total = active.length + cancelled.length;
      return total > 0 ? (cancelled.length / total * 100) : 0;
    };
    const calcLtv = (mrrVal, activeCount, churnPct) => {
      const segArpu = activeCount > 0 ? mrrVal / activeCount : 0;
      const churnDecimal = churnPct / 100;
      return churnDecimal > 0 ? segArpu / churnDecimal : segArpu * 24;
    };

    const monthlyChurnRate = calcChurn(activeSubs, recentlyCancelled);
    const brandChurnRate = calcChurn(brandActiveSubs, brandRecentlyCancelled);
    const creatorChurnRate = calcChurn(creatorActiveSubs, creatorRecentlyCancelled);

    const retentionRate = 100 - monthlyChurnRate;
    const brandRetentionRate = 100 - brandChurnRate;
    const creatorRetentionRate = 100 - creatorChurnRate;

    const ltv = calcLtv(totalMRR, activeSubs.length, monthlyChurnRate);
    const brandLtv = calcLtv(brandMRR, brandActiveSubs.length, brandChurnRate);
    const creatorLtv = calcLtv(creatorMRR, creatorActiveSubs.length, creatorChurnRate);

    const brandArpu = brandActiveSubs.length > 0 ? brandMRR / brandActiveSubs.length : 0;
    const creatorArpu = creatorActiveSubs.length > 0 ? creatorMRR / creatorActiveSubs.length : 0;

    const revenueByMonth = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = { total: 0, brand: 0, creator: 0, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) };
    }

    for (const inv of filteredInvoices) {
      const amount = (inv.amount_paid || 0) / 100;
      if (amount <= 0) continue; // Skip zero-value invoices
      const d = new Date(inv.created * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!revenueByMonth[key]) continue;
      revenueByMonth[key].total += amount;
      const lineProduct = inv.lines?.data?.[0]?.price?.product;
      const prodId = typeof lineProduct === 'string' ? lineProduct : lineProduct?.id;
      if (prodId === BRAND_PRODUCT) revenueByMonth[key].brand += amount;
      else if (prodId === CREATOR_PRODUCT) revenueByMonth[key].creator += amount;
      else { revenueByMonth[key].brand += amount / 2; revenueByMonth[key].creator += amount / 2; }
    }

    const revenueChart = Object.values(revenueByMonth).map(m => ({
      date: m.label,
      total: Math.round(m.total * 100) / 100,
      marcas: Math.round(m.brand * 100) / 100,
      criadores: Math.round(m.creator * 100) / 100,
    }));

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + ((inv.amount_paid || 0) / 100), 0);
    const thisMonthKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
    const lastMonthKey = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();

    const trialingSubs = subscriptions.filter(s => s.status === 'trialing' && validSub(s));

    const subDistribution = [
      { name: 'Ativas', value: activeSubs.length, color: '#10b981' },
      { name: 'Trial', value: trialingSubs.length, color: '#3b82f6' },
      { name: 'Canceladas', value: cancelledSubs.length, color: '#ef4444' },
      { name: 'Vencidas', value: pastDueSubs.length, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    let monthlyCount = 0, annualCount = 0;
    activeSubs.forEach(s => {
      if (s.items?.data?.[0]?.price?.recurring?.interval === 'year') annualCount++;
      else monthlyCount++;
    });

    // Brand/Creator revenue for this/last month
    const thisMonthBrandRevenue = Math.round((revenueByMonth[thisMonthKey]?.brand || 0) * 100) / 100;
    const thisMonthCreatorRevenue = Math.round((revenueByMonth[thisMonthKey]?.creator || 0) * 100) / 100;
    const lastMonthBrandRevenue = Math.round((revenueByMonth[lastMonthKey]?.brand || 0) * 100) / 100;
    const lastMonthCreatorRevenue = Math.round((revenueByMonth[lastMonthKey]?.creator || 0) * 100) / 100;

    const brandTotalRevenue = filteredInvoices
      .filter(inv => {
        const lp = inv.lines?.data?.[0]?.price?.product;
        return (typeof lp === 'string' ? lp : lp?.id) === BRAND_PRODUCT;
      })
      .reduce((sum, inv) => sum + ((inv.amount_paid || 0) / 100), 0);
    const creatorTotalRevenue = filteredInvoices
      .filter(inv => {
        const lp = inv.lines?.data?.[0]?.price?.product;
        return (typeof lp === 'string' ? lp : lp?.id) === CREATOR_PRODUCT;
      })
      .reduce((sum, inv) => sum + ((inv.amount_paid || 0) / 100), 0);

    // Also provide counts that include manually-set premium users who are excluded
    // Count profiles with subscription_status=premium whose user is excluded
    const excludedPremiumBrands = allBrands.filter(b => b.subscription_status === 'premium' && excludedUserIds.has(b.user_id));
    const excludedPremiumCreators = allCreators.filter(c => c.subscription_status === 'premium' && excludedUserIds.has(c.user_id));
    const excludedPremiumCount = excludedPremiumBrands.length + excludedPremiumCreators.length;

    return Response.json({
      mrr: Math.round(totalMRR * 100) / 100,
      brandMRR: Math.round(brandMRR * 100) / 100,
      creatorMRR: Math.round(creatorMRR * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      brandArpu: Math.round(brandArpu * 100) / 100,
      creatorArpu: Math.round(creatorArpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      brandLtv: Math.round(brandLtv * 100) / 100,
      creatorLtv: Math.round(creatorLtv * 100) / 100,
      churnRate: Math.round(monthlyChurnRate * 10) / 10,
      brandChurnRate: Math.round(brandChurnRate * 10) / 10,
      creatorChurnRate: Math.round(creatorChurnRate * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      brandRetentionRate: Math.round(brandRetentionRate * 10) / 10,
      creatorRetentionRate: Math.round(creatorRetentionRate * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      brandTotalRevenue: Math.round(brandTotalRevenue * 100) / 100,
      creatorTotalRevenue: Math.round(creatorTotalRevenue * 100) / 100,
      thisMonthRevenue: Math.round((revenueByMonth[thisMonthKey]?.total || 0) * 100) / 100,
      lastMonthRevenue: Math.round((revenueByMonth[lastMonthKey]?.total || 0) * 100) / 100,
      thisMonthBrandRevenue,
      thisMonthCreatorRevenue,
      lastMonthBrandRevenue,
      lastMonthCreatorRevenue,
      totalActiveSubscribers: activeSubs.length,
      brandSubscribers: brandActiveSubs.length,
      creatorSubscribers: creatorActiveSubs.length,
      trialingSubscribers: trialingSubs.length,
      cancelledSubscribers: cancelledSubs.length,
      pastDueSubscribers: pastDueSubs.length,
      totalSubscriptions: subscriptions.filter(s => validSub(s)).length,
      excludedCount: excludedUsers.length + orphanExcludedCount,
      excludedManualCount: excludedUsers.length,
      excludedOrphanCount: orphanExcludedCount,
      excludedPremiumCount,
      recentlyCancelledCount: recentlyCancelled.length,
      brandRecentlyCancelledCount: brandRecentlyCancelled.length,
      creatorRecentlyCancelledCount: creatorRecentlyCancelled.length,
      revenueChart,
      subDistribution,
      planTypeDistribution: [
        { name: 'Mensal', value: monthlyCount, color: '#818cf8' },
        { name: 'Anual', value: annualCount, color: '#f59e0b' },
      ].filter(d => d.value > 0),
      monthlySubscribers: monthlyCount,
      annualSubscribers: annualCount,
    });

  } catch (error) {
    console.error('Stripe metrics error:', error);
    return Response.json({ error: 'Erro ao buscar métricas Stripe', details: error.message }, { status: 500 });
  }
});