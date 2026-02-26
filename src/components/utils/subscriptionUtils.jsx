/**
 * Single source of truth for subscription logic.
 * Used by SubscriptionContext and any page that needs to check subscription status.
 */

export function isProfileSubscribed(profile) {
  if (!profile) return false;
  const status = profile.subscription_status || 'starter';

  if (status === 'premium' || status === 'legacy') return true;

  if (status === 'trial' && profile.trial_end_date) {
    return new Date(profile.trial_end_date) > new Date();
  }

  return false;
}

export function getSubscriptionStatus(profile) {
  if (!profile) return 'starter';
  return profile.subscription_status || 'starter';
}

export function getPlanLevel(profile) {
  if (!profile) return null;
  return profile.plan_level || null;
}