import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Get all active subscriptions from Stripe
    const subs = await stripe.subscriptions.list({ 
      limit: 100, 
      status: 'active',
      expand: ['data.customer', 'data.plan.product']
    });

    // Get excluded users
    const [allUsers, allBrands, allCreators] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);

    const excludedUsers = allUsers.filter(u => u.exclude_from_financials);
    const excludedCustomerIds = new Set();
    
    for (const u of excludedUsers) {
      const brand = allBrands.find(b => b.user_id === u.id);
      const creator = allCreators.find(c => c.user_id === u.id);
      if (brand?.stripe_customer_id) excludedCustomerIds.add(brand.stripe_customer_id);
      if (creator?.stripe_customer_id) excludedCustomerIds.add(creator.stripe_customer_id);
    }

    const details = subs.data.map(sub => {
      const customer = sub.customer;
      const customerId = typeof customer === 'string' ? customer : customer?.id;
      const customerEmail = typeof customer === 'object' ? customer?.email : null;
      const item = sub.items?.data?.[0];
      const amount = (item?.price?.unit_amount || 0) / 100;
      const interval = item?.price?.recurring?.interval;
      const product = item?.price?.product;
      const productId = typeof product === 'string' ? product : product?.id;
      const productName = typeof product === 'object' ? product?.name : productId;
      const isExcluded = excludedCustomerIds.has(customerId);

      // Try to find matching user
      const matchingBrand = allBrands.find(b => b.stripe_customer_id === customerId);
      const matchingCreator = allCreators.find(c => c.stripe_customer_id === customerId);
      const matchingUserId = matchingBrand?.user_id || matchingCreator?.user_id;
      const matchingUser = matchingUserId ? allUsers.find(u => u.id === matchingUserId) : null;

      return {
        sub_id: sub.id,
        status: sub.status,
        customer_id: customerId,
        customer_email: customerEmail,
        amount_brl: amount,
        interval,
        product_name: productName,
        product_id: productId,
        is_excluded: isExcluded,
        matched_user_email: matchingUser?.email || null,
        matched_user_excluded: matchingUser?.exclude_from_financials || false,
        matched_brand: matchingBrand ? { id: matchingBrand.id, company: matchingBrand.company_name, stripe_id: matchingBrand.stripe_customer_id } : null,
        matched_creator: matchingCreator ? { id: matchingCreator.id, name: matchingCreator.display_name, stripe_id: matchingCreator.stripe_customer_id } : null,
      };
    });

    // Also list excluded users and their stripe IDs
    const excludedDetail = excludedUsers.map(u => {
      const brand = allBrands.find(b => b.user_id === u.id);
      const creator = allCreators.find(c => c.user_id === u.id);
      return {
        user_id: u.id,
        email: u.email,
        brand_stripe_id: brand?.stripe_customer_id || null,
        creator_stripe_id: creator?.stripe_customer_id || null,
        has_stripe_id: !!(brand?.stripe_customer_id || creator?.stripe_customer_id),
      };
    });

    return Response.json({
      total_active_subs: subs.data.length,
      subscriptions: details,
      excluded_users: excludedDetail,
      excluded_customer_ids: [...excludedCustomerIds],
    });

  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});