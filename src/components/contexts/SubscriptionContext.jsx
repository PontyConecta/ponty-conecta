import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('Guest');
  const [planLevel, setPlanLevel] = useState(null);

  useEffect(() => {
    if (!profile) {
      setIsSubscribed(false);
      setSubscriptionStatus('starter');
      setPlanLevel(null);
      return;
    }

    const status = profile.subscription_status || 'starter';
    // premium, legacy and active trial users have full access
    let isPremium = status === 'premium' || status === 'legacy';
    
    // Check trial: must have trial status AND valid trial_end_date
    if (status === 'trial' && profile.trial_end_date) {
      const trialEnd = new Date(profile.trial_end_date);
      isPremium = trialEnd > new Date();
    }

    const currentPlanLevel = profile.plan_level || null;
    
    setSubscriptionStatus(status);
    setIsSubscribed(isPremium);
    setPlanLevel(currentPlanLevel);
  }, [profile]);

  const value = {
    isSubscribed,
    subscriptionStatus,
    planLevel,
    canAccessFeature: (feature) => {
      // Premium/legacy users have full access based on plan_level from database
      return isSubscribed && !!planLevel;
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}