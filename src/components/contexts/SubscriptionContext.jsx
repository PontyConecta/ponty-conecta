import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile, profileType } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('starter');
  const [planLevel, setPlanLevel] = useState(null);

  useEffect(() => {
    if (!profile) {
      setIsSubscribed(false);
      setSubscriptionStatus('starter');
      setPlanLevel(null);
      return;
    }

    // Brands are always free — treat as subscribed so no paywall triggers
    if (profileType === 'brand') {
      setSubscriptionStatus('free');
      setIsSubscribed(true);
      setPlanLevel(null);
      return;
    }

    const status = profile.subscription_status || 'starter';
    const isPremium = status === 'premium';
    const currentPlanLevel = profile.plan_level || null;
    
    setSubscriptionStatus(status);
    setIsSubscribed(isPremium);
    setPlanLevel(currentPlanLevel);
  }, [profile, profileType]);

  const value = {
    isSubscribed,
    subscriptionStatus,
    planLevel,
    canAccessFeature: (feature) => {
      return isSubscribed;
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