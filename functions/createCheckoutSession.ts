import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PLANS = {
  creator_monthly: 'price_1T2eqHClKKJL3yH7ahYUD7DO',
  creator_annual: 'price_1T2etyClKKJL3yH772SRUgHK',
  brand_monthly: 'price_1T2evuClKKJL3yH71JXx0PN3',
  brand_annual: 'price_1T2evuClKKJL3yH7ndV4xoB0'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [user, body] = await Promise.all([
      base44.auth.me(),
      req.json()
    ]);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, profile_type } = body;
    const priceId = PLANS[plan_type];
    if (!priceId) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Get profile
    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || user.email,
      metadata: {
        base44_user_id: user.id,
        base44_profile_type: profile_type,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });
    console.log('Customer created:', customer.id);

    // Save customer ID (fire and forget)
    base44.entities[entityName].update(profile.id, { stripe_customer_id: customer.id }).catch(() => {});

    // Create checkout session
    const origin = req.headers.get('origin') || 'https://pontyconecta.com.br';
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
      metadata: {
        base44_user_id: user.id,
        base44_profile_id: profile.id,
        base44_profile_type: profile_type,
        base44_plan_type: plan_type,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    return Response.json({ url: session.url, sessionId: session.id });

  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: 'Failed to create checkout session', details: error.message }, { status: 500 });
  }
});