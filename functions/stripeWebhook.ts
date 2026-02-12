import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  // Set base44 auth from request headers before any Stripe operations
  const base44 = createClientFromRequest(req);
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature (async version for Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(base44, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(base44, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(base44, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        await handleInvoicePaid(base44, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(base44, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed', 
      details: error.message 
    }, { status: 400 });
  }
});

async function handleCheckoutCompleted(base44, session) {
  console.log('Checkout completed:', session.id);
  
  const metadata = session.metadata;
  const profileId = metadata.base44_profile_id;
  const profileType = metadata.base44_profile_type;
  const planType = metadata.base44_plan_type;
  const userId = metadata.base44_user_id;

  if (!profileId || !profileType || !userId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get the subscription
  const subscriptionId = session.subscription;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine plan level from plan type
  const planLevelMap = {
    'brand_monthly': 'Premium',
    'brand_annual': 'Premium',
    'creator_monthly': 'Premium',
    'creator_annual': 'Premium'
  };
  const determinedPlanLevel = planLevelMap[planType] || 'Premium';

  // Create subscription record
  await base44.asServiceRole.entities.Subscription.create({
    user_id: userId,
    plan_type: planType,
    status: 'Premium',
    start_date: new Date().toISOString().split('T')[0],
    amount: session.amount_total / 100, // Convert from cents
    currency: session.currency.toUpperCase(),
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: session.customer,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    plan_name: `Ponty ${profileType === 'brand' ? 'Marcas' : 'Criadores'}`
  });

  // Update profile with subscription status and plan level
  const EntityType = profileType === 'brand' ? 'Brand' : 'Creator';
  await base44.asServiceRole.entities[EntityType].update(profileId, {
    subscription_status: 'Premium',
    plan_level: determinedPlanLevel,
    stripe_customer_id: session.customer
  });

  console.log(`Subscription activated for ${profileType} ${profileId}`);
}

async function handleSubscriptionUpdate(base44, subscription) {
  console.log('Subscription updated:', subscription.id);

  const customerId = subscription.customer;
  
  // Find profile by customer ID
  const [brands, creators] = await Promise.all([
    base44.asServiceRole.entities.Brand.filter({ stripe_customer_id: customerId }),
    base44.asServiceRole.entities.Creator.filter({ stripe_customer_id: customerId })
  ]);

  const profile = brands[0] || creators[0];
  const profileType = brands[0] ? 'brand' : 'creator';

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update subscription record
  const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscription.id 
  });

  // Map Stripe status to our premium naming
  const statusMap = {
    'active': 'Premium',
    'past_due': 'Pending',
    'canceled': 'Legacy',
    'unpaid': 'Pending',
    'trialing': 'Explorer'
  };
  const mappedStatus = statusMap[subscription.status] || 'Guest';

  if (subscriptions.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
      status: mappedStatus,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      last_billing_date: new Date(subscription.current_period_start * 1000).toISOString()
    });
  }

  // Update profile status and plan level
  const EntityType = profileType === 'brand' ? 'Brand' : 'Creator';
  const planLevel = subscription.status === 'active' ? 'Premium' : null;
  
  await base44.asServiceRole.entities[EntityType].update(profile.id, {
    subscription_status: mappedStatus,
    plan_level: planLevel
  });

  console.log(`Subscription updated for ${profileType} ${profile.id}`);
}

async function handleSubscriptionDeleted(base44, subscription) {
  console.log('Subscription deleted:', subscription.id);

  const customerId = subscription.customer;
  
  // Find profile by customer ID
  const [brands, creators] = await Promise.all([
    base44.asServiceRole.entities.Brand.filter({ stripe_customer_id: customerId }),
    base44.asServiceRole.entities.Creator.filter({ stripe_customer_id: customerId })
  ]);

  const profile = brands[0] || creators[0];
  const profileType = brands[0] ? 'brand' : 'creator';

  if (!profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update subscription record
  const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscription.id 
  });

  if (subscriptions.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
      status: 'Legacy',
      end_date: new Date().toISOString().split('T')[0]
    });
  }

  // Update profile - remove plan level on cancellation
  const EntityType = profileType === 'brand' ? 'Brand' : 'Creator';
  await base44.asServiceRole.entities[EntityType].update(profile.id, {
    subscription_status: 'Legacy',
    plan_level: null
  });

  console.log(`Subscription cancelled for ${profileType} ${profile.id}`);
}

async function handleInvoicePaid(base44, invoice) {
  console.log('Invoice paid:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscriptionId 
  });

  if (subscriptions.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
      last_billing_date: new Date(invoice.period_start * 1000).toISOString(),
      next_billing_date: new Date(invoice.period_end * 1000).toISOString()
    });
  }
}

async function handleInvoicePaymentFailed(base44, invoice) {
  console.error('Invoice payment failed:', invoice.id);

  const customerId = invoice.customer;
  
  // Find profile and notify
  const [brands, creators] = await Promise.all([
    base44.asServiceRole.entities.Brand.filter({ stripe_customer_id: customerId }),
    base44.asServiceRole.entities.Creator.filter({ stripe_customer_id: customerId })
  ]);

  const profile = brands[0] || creators[0];
  const profileType = brands[0] ? 'brand' : 'creator';

  if (profile) {
    const EntityType = profileType === 'brand' ? 'Brand' : 'Creator';
    await base44.asServiceRole.entities[EntityType].update(profile.id, {
      subscription_status: 'Pending',
      plan_level: null
    });
    
    console.log(`Payment failed for ${profileType} ${profile.id}`);
  }
}