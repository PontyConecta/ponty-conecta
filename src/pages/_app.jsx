import React from 'react';
import { AuthProvider } from '@/components/contexts/AuthContext';
import { SubscriptionProvider } from '@/components/contexts/SubscriptionContext';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </AuthProvider>
  );
}