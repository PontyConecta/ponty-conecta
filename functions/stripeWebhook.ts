import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(base44, event.data.object);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdate(base44, event.data.object);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(base44, event.data.object);
        break;
      }
      case 'invoice.paid': {
        await handleInvoicePaid(base44, event.data.object);
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(base44, event.data.object);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: 'Webhook processing failed', details: error.message }, { status: 400 });
  }
});

// Helper: find profile by stripe_customer_id OR by metadata
async function findProfile(base44, customerId, metadata) {
  console.log('findProfile called - customerId:', customerId, 'metadata:', JSON.stringify(metadata));

  // Try metadata first (most reliable)
  if (metadata?.base44_profile_id && metadata?.base44_profile_type) {
    const entityName = metadata.base44_profile_type === 'brand' ? 'Brand' : 'Creator';
    try {
      const profiles = await base44.asServiceRole.entities[entityName].filter({ id: metadata.base44_profile_id });
      if (profiles.length > 0) {
        console.log(`Found profile via metadata: ${entityName} ${profiles[0].id}`);
        return { profile: profiles[0], profileType: metadata.base44_profile_type, entityName };
      }
      console.log('Metadata profile_id lookup returned 0 results');
    } catch (e) {
      console.error('Metadata lookup failed:', e.message);
    }
  }

  // Try by user_id from metadata
  if (metadata?.base44_user_id) {
    console.log('Trying user_id lookup:', metadata.base44_user_id);
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ user_id: metadata.base44_user_id }),
      base44.asServiceRole.entities.Creator.filter({ user_id: metadata.base44_user_id })
    ]);
    console.log('user_id lookup results - brands:', brands.length, 'creators:', creators.length);
    if (brands.length > 0) {
      return { profile: brands[0], profileType: 'brand', entityName: 'Brand' };
    }
    if (creators.length > 0) {
      return { profile: creators[0], profileType: 'creator', entityName: 'Creator' };
    }
  }

  // Fallback: search by stripe_customer_id
  if (customerId) {
    console.log('Trying stripe_customer_id lookup:', customerId);
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ stripe_customer_id: customerId }),
      base44.asServiceRole.entities.Creator.filter({ stripe_customer_id: customerId })
    ]);
    console.log('customer_id lookup results - brands:', brands.length, 'creators:', creators.length);
    if (brands.length > 0) {
      return { profile: brands[0], profileType: 'brand', entityName: 'Brand' };
    }
    if (creators.length > 0) {
      return { profile: creators[0], profileType: 'creator', entityName: 'Creator' };
    }
  }

  // Last resort: search ALL brands and creators by customer email from Stripe
  if (customerId) {
    try {
      console.log('Last resort: looking up customer email from Stripe');
      const customer = await stripe.customers.retrieve(customerId);
      if (customer?.email) {
        console.log('Customer email:', customer.email);
        // Find user by email
        const users = await base44.asServiceRole.entities.User.filter({ email: customer.email });
        if (users.length > 0) {
          const userId = users[0].id;
          console.log('Found user by email, id:', userId);
          const [brands, creators] = await Promise.all([
            base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
            base44.asServiceRole.entities.Creator.filter({ user_id: userId })
          ]);
          if (brands.length > 0) {
            console.log('Found brand via email lookup');
            return { profile: brands[0], profileType: 'brand', entityName: 'Brand' };
          }
          if (creators.length > 0) {
            console.log('Found creator via email lookup');
            return { profile: creators[0], profileType: 'creator', entityName: 'Creator' };
          }
        }
      }
    } catch (e) {
      console.error('Last resort lookup failed:', e.message);
    }
  }

  console.error('CRITICAL: Profile not found after all attempts. customerId:', customerId, 'metadata:', JSON.stringify(metadata));
  return null;
}

async function handleCheckoutCompleted(base44, session) {
  console.log('=== CHECKOUT COMPLETED ===');
  console.log('Session ID:', session.id);
  console.log('Customer:', session.customer);
  console.log('Subscription:', session.subscription);
  console.log('Metadata:', JSON.stringify(session.metadata));
  
  const metadata = session.metadata || {};
  const userId = metadata.base44_user_id;
  const planType = metadata.base44_plan_type;

  const result = await findProfile(base44, session.customer, metadata);
  if (!result) {
    console.error('CRITICAL: Cannot activate subscription - profile not found. customer:', session.customer, 'metadata:', JSON.stringify(metadata));
    return;
  }

  const { profile, profileType, entityName } = result;
  console.log('Profile found:', entityName, profile.id, 'user_id:', profile.user_id);

  // Get the subscription from Stripe and update its metadata
  const subscriptionId = session.subscription;
  let nextBillingDate = null;
  if (subscriptionId) {
    try {
      // Ensure subscription has metadata for future webhook events
      await stripe.subscriptions.update(subscriptionId, {
        metadata: {
          base44_user_id: userId || profile.user_id,
          base44_profile_id: profile.id,
          base44_profile_type: profileType,
          base44_plan_type: planType,
          base44_app_id: Deno.env.get('BASE44_APP_ID')
        }
      });
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      nextBillingDate = new Date(sub.current_period_end * 1000).toISOString();
      console.log('Subscription metadata updated, next billing:', nextBillingDate);
    } catch (e) {
      console.error('Could not update/retrieve subscription:', e.message);
    }
  }

  // Create subscription record
  try {
    await base44.asServiceRole.entities.Subscription.create({
      user_id: userId || profile.user_id,
      plan_type: planType || `${profileType}_monthly`,
      status: 'premium',
      start_date: new Date().toISOString().split('T')[0],
      amount: session.amount_total ? session.amount_total / 100 : 45,
      currency: (session.currency || 'brl').toUpperCase(),
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer,
      next_billing_date: nextBillingDate,
      plan_name: `Ponty ${profileType === 'brand' ? 'Marcas' : 'Criadores'}`
    });
    console.log('Subscription record created');
  } catch (e) {
    console.error('Failed to create subscription record:', e.message);
  }

  // Update profile with premium status
  const updateData = {
    subscription_status: 'premium',
    plan_level: 'premium',
    stripe_customer_id: session.customer
  };
  console.log('Updating profile with:', JSON.stringify(updateData));
  await base44.asServiceRole.entities[entityName].update(profile.id, updateData);

  console.log(`SUCCESS: Subscription activated for ${profileType} ${profile.id}`);
}

async function handleSubscriptionUpdate(base44, subscription) {
  console.log('=== SUBSCRIPTION UPDATE ===');
  console.log('Subscription ID:', subscription.id, 'Status:', subscription.status);
  console.log('Customer:', subscription.customer);
  console.log('Metadata:', JSON.stringify(subscription.metadata));
  console.log('Cancel at period end:', subscription.cancel_at_period_end);

  // Get metadata from subscription
  const metadata = subscription.metadata || {};
  const result = await findProfile(base44, subscription.customer, metadata);
  
  if (!result) {
    console.error('Profile not found for subscription update');
    return;
  }

  const { profile, profileType, entityName } = result;

  // Map Stripe status to our system
  const statusMap = {
    'active': 'premium',
    'past_due': 'pending',
    'canceled': 'legacy',
    'unpaid': 'pending',
    'trialing': 'premium'
  };
  let mappedStatus = statusMap[subscription.status] || 'starter';

  // Active but cancelling = legacy (still has access)
  if (subscription.status === 'active' && subscription.cancel_at_period_end) {
    mappedStatus = 'legacy';
  }

  // Update subscription record
  const subs = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscription.id 
  });

  if (subs.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
      status: mappedStatus,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      last_billing_date: new Date(subscription.current_period_start * 1000).toISOString(),
      auto_renew: !subscription.cancel_at_period_end,
      end_date: subscription.cancel_at_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0] 
        : null
    });
  }

  // Update profile
  const planLevel = (mappedStatus === 'premium' || mappedStatus === 'legacy') ? 'premium' : null;
  const profileUpdate = {
    subscription_status: mappedStatus,
    plan_level: planLevel,
    stripe_customer_id: subscription.customer
  };
  console.log('Updating profile:', entityName, profile.id, JSON.stringify(profileUpdate));
  await base44.asServiceRole.entities[entityName].update(profile.id, profileUpdate);

  console.log(`SUCCESS: Subscription updated for ${profileType} ${profile.id} -> ${mappedStatus}`);
}

async function handleSubscriptionDeleted(base44, subscription) {
  console.log('Subscription deleted:', subscription.id);

  const metadata = subscription.metadata || {};
  const result = await findProfile(base44, subscription.customer, metadata);
  
  if (!result) {
    console.error('Profile not found for subscription deletion');
    return;
  }

  const { profile, profileType, entityName } = result;

  // Update subscription record
  const subs = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscription.id 
  });

  if (subs.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
      status: 'starter',
      end_date: new Date().toISOString().split('T')[0]
    });
  }

  // Update profile - downgrade to starter
  await base44.asServiceRole.entities[entityName].update(profile.id, {
    subscription_status: 'starter',
    plan_level: null
  });

  console.log(`Subscription cancelled for ${profileType} ${profile.id}`);
}

async function handleInvoicePaid(base44, invoice) {
  console.log('Invoice paid:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Also update the profile to premium (in case it was pending)
  const metadata = invoice.subscription_details?.metadata || {};
  const result = await findProfile(base44, invoice.customer, metadata);
  
  if (result) {
    const { profile, entityName } = result;
    if (profile.subscription_status !== 'premium') {
      await base44.asServiceRole.entities[entityName].update(profile.id, {
        subscription_status: 'premium',
        plan_level: 'premium'
      });
      console.log('Profile updated to premium via invoice.paid');
    }
  }

  const subs = await base44.asServiceRole.entities.Subscription.filter({ 
    stripe_subscription_id: subscriptionId 
  });

  if (subs.length > 0) {
    await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
      status: 'premium',
      last_billing_date: new Date(invoice.period_start * 1000).toISOString(),
      next_billing_date: new Date(invoice.period_end * 1000).toISOString()
    });
  }
}

async function handleInvoicePaymentFailed(base44, invoice) {
  console.error('Invoice payment failed:', invoice.id);

  const metadata = invoice.subscription_details?.metadata || {};
  const result = await findProfile(base44, invoice.customer, metadata);

  if (result) {
    const { profile, profileType, entityName } = result;
    await base44.asServiceRole.entities[entityName].update(profile.id, {
      subscription_status: 'pending',
      plan_level: null
    });
    console.log(`Payment failed for ${profileType} ${profile.id}`);
  }
}