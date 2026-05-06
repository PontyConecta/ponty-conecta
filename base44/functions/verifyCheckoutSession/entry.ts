import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await req.json();
    if (!session_id || typeof session_id !== 'string') {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    console.log('[verifyCheckoutSession] Verifying session:', session_id, 'for user:', user.id);

    // Retrieve the checkout session with subscription expanded
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription']
    });

    if (!session) {
      console.error('[verifyCheckoutSession] Session not found:', session_id);
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Validate that this session belongs to the requesting user
    const metadata = session.metadata || {};
    if (metadata.base44_user_id && metadata.base44_user_id !== user.id) {
      console.error('[verifyCheckoutSession] User mismatch:', user.id, '!=', metadata.base44_user_id);
      return Response.json({ error: 'Session does not belong to this user' }, { status: 403 });
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      console.log('[verifyCheckoutSession] Payment not yet paid:', session.payment_status);
      return Response.json({ verified: false, status: session.payment_status });
    }

    console.log('[verifyCheckoutSession] Payment confirmed. Activating subscription idempotently.');

    // Determine profile type and entity
    const profileType = metadata.base44_profile_type || 'creator';
    const entityName = profileType === 'brand' ? 'Brand' : 'Creator';

    // Brands are free-forever
    if (profileType === 'brand') {
      console.log('[verifyCheckoutSession] Brand profile — ignoring activation');
      return Response.json({ verified: true, already_active: true });
    }

    // Find the profile
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) {
      console.error('[verifyCheckoutSession] Profile not found for user:', user.id);
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Idempotent: if already premium, return success
    if (profile.subscription_status === 'premium') {
      console.log('[verifyCheckoutSession] Already premium — idempotent return');
      return Response.json({ verified: true, already_active: true });
    }

    // Derive plan_level from subscription
    let planLevel = 'premium_monthly';
    const subscription = session.subscription;
    if (subscription && typeof subscription === 'object') {
      const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
      planLevel = interval === 'year' ? 'premium_annual' : 'premium_monthly';
    } else if (typeof subscription === 'string') {
      try {
        const sub = await stripe.subscriptions.retrieve(subscription);
        const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
        planLevel = interval === 'year' ? 'premium_annual' : 'premium_monthly';
      } catch (e) {
        console.error('[verifyCheckoutSession] Could not retrieve subscription:', e.message);
      }
    }

    // Activate profile
    const updateData = {
      subscription_status: 'premium',
      plan_level: planLevel,
      stripe_customer_id: session.customer
    };
    await base44.entities[entityName].update(profile.id, updateData);
    console.log('[verifyCheckoutSession] Profile activated:', profile.id, planLevel);

    // Create/update Subscription record idempotently
    const subscriptionId = typeof subscription === 'object' ? subscription?.id : subscription;
    if (subscriptionId) {
      const existingSubs = await base44.entities.Subscription.filter({ stripe_subscription_id: subscriptionId });
      const subData = {
        user_id: user.id,
        plan_type: metadata.base44_plan_type || `${profileType}_monthly`,
        status: 'premium',
        start_date: new Date().toISOString().split('T')[0],
        amount: session.amount_total ? session.amount_total / 100 : 45,
        currency: (session.currency || 'brl').toUpperCase(),
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer,
        plan_name: 'Ponty Criadores'
      };

      if (existingSubs.length > 0) {
        await base44.entities.Subscription.update(existingSubs[0].id, subData);
        console.log('[verifyCheckoutSession] Subscription record updated');
      } else {
        await base44.entities.Subscription.create(subData);
        console.log('[verifyCheckoutSession] Subscription record created');
      }
    }

    return Response.json({ verified: true, plan_level: planLevel });

  } catch (error) {
    console.error('[verifyCheckoutSession] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});