import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('none');

  useEffect(() => {
    if (!profile) {
      setIsSubscribed(false);
      setSubscriptionStatus('none');
      return;
    }

    const status = profile.subscription_status || 'none';
    const isActive = status === 'active' || profile.account_state === 'active';
    
    setSubscriptionStatus(status);
    setIsSubscribed(isActive);
  }, [profile]);

  const value = {
    isSubscribed,
    subscriptionStatus,
    canAccessFeature: (feature) => {
      // For now, all features require subscription
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