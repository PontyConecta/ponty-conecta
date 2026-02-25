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

    // Fetch all brands and creators to get known stripe_customer_ids
    const [allBrands, allCreators] = await Promise.all([
      base44.asServiceRole.entities.Brand.list(),
      base44.asServiceRole.entities.Creator.list(),
    ]);

    const knownCustomerIds = new Set();
    for (const b of allBrands) {
      if (b.stripe_customer_id) knownCustomerIds.add(b.stripe_customer_id);
    }
    for (const c of allCreators) {
      if (c.stripe_customer_id) knownCustomerIds.add(c.stripe_customer_id);
    }

    // Fetch all Stripe subscriptions (active, past_due, trialing)
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

    // Find subscriptions whose customer is NOT in our known set
    const orphanMap = {};
    for (const sub of subscriptions) {
      const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
      if (!custId || knownCustomerIds.has(custId)) continue;

      if (!orphanMap[custId]) {
        const custObj = typeof sub.customer === 'object' ? sub.customer : null;
        orphanMap[custId] = {
          stripe_customer_id: custId,
          email: custObj?.email || 'desconhecido',
          name: custObj?.name || '',
          subscriptions: [],
        };
      }

      const item = sub.items?.data?.[0];
      orphanMap[custId].subscriptions.push({
        id: sub.id,
        status: sub.status,
        product: typeof item?.price?.product === 'string' ? item.price.product : item?.price?.product?.id || 'desconhecido',
        product_name: typeof item?.price?.product === 'object' ? item.price.product.name : '',
        amount: (item?.price?.unit_amount || 0) / 100,
        interval: item?.price?.recurring?.interval || 'one_time',
        created: new Date(sub.created * 1000).toISOString(),
      });
    }

    const orphans = Object.values(orphanMap);

    console.log(`Found ${orphans.length} Stripe customer(s) without matching profile in platform`);

    return Response.json({
      orphanCount: orphans.length,
      orphans,
    });

  } catch (error) {
    console.error('Orphan Stripe customers error:', error);
    return Response.json({ error: 'Erro ao buscar clientes Stripe sem perfil', details: error.message }, { status: 500 });
  }
});