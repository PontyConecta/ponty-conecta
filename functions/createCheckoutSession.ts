import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, profile_type } = await req.json();

    // Get profile to check if customer_id exists
    let profile;
    if (profile_type === 'brand') {
      const brands = await base44.entities.Brand.filter({ user_id: user.id });
      profile = brands[0];
    } else {
      const creators = await base44.entities.Creator.filter({ user_id: user.id });
      profile = creators[0];
    }

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Plan pricing - Stripe Price IDs
    const plans = {
      creator_monthly: { price_id: 'price_1T0mKj5mO0MOlPiwygqDD9Ik' },
      creator_annual: { price_id: 'price_1T0mL35mO0MOlPiwL0KgYmF0' },
      brand_monthly: { price_id: 'price_1T0mLs5mO0MOlPiwAPa2REpZ' },
      brand_annual: { price_id: 'price_1T0mM45mO0MOlPiw24tnfQAG' }
    };

    const planConfig = plans[plan_type];
    if (!planConfig) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id,
          base44_profile_id: profile.id,
          base44_profile_type: profile_type,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
      customerId = customer.id;

      // Save customer ID to profile
      if (profile_type === 'brand') {
        await base44.entities.Brand.update(profile.id, { stripe_customer_id: customerId });
      } else {
        await base44.entities.Creator.update(profile.id, { stripe_customer_id: customerId });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.price_id,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/subscription?success=true`,
      cancel_url: `${req.headers.get('origin')}/subscription?canceled=true`,
      metadata: {
        base44_user_id: user.id,
        base44_profile_id: profile.id,
        base44_profile_type: profile_type,
        base44_plan_type: plan_type,
        base44_app_id: Deno.env.get('BASE44_APP_ID')
      }
    });

    return Response.json({ 
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: 'Failed to create checkout session', 
      details: error.message 
    }, { status: 500 });
  }
});