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

    const { profile_type } = await req.json();

    // Get profile
    let profile;
    if (profile_type === 'brand') {
      const brands = await base44.entities.Brand.filter({ user_id: user.id });
      profile = brands[0];
    } else {
      const creators = await base44.entities.Creator.filter({ user_id: user.id });
      profile = creators[0];
    }

    if (!profile || !profile.stripe_customer_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/subscription`,
    });

    return Response.json({ url: session.url });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return Response.json({ 
      error: 'Failed to create portal session', 
      details: error.message 
    }, { status: 500 });
  }
});