/**
 * Single source of truth for subscription logic.
 * Used by SubscriptionContext and any page that needs to check subscription status.
 */

export function isProfileSubscribed(profile) {
  if (!profile) return false;
  if (profile.subscription_status !== 'premium') return false;
  if (profile.trial_end_date && !profile.stripe_customer_id) {
    return new Date(profile.trial_end_date) > new Date();
  }
  return true;
}

export function isOnTrial(profile) {
  if (!profile) return false;
  if (profile.subscription_status !== 'premium') return false;
  if (!profile.trial_end_date) return false;
  return new Date(profile.trial_end_date) > new Date();
}

export function getSubscriptionStatus(profile) {
  if (!profile) return 'starter';
  return profile.subscription_status || 'starter';
}

export function getPlanLevel(profile) {
  if (!profile) return null;
  return profile.plan_level || null;
}