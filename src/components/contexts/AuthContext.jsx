import React, { useState, useEffect, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setUser(null);
        setProfile(null);
        setProfileType(null);
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      const [brands, creators] = await Promise.all([
        base44.entities.Brand.filter({ user_id: userData.id }),
        base44.entities.Creator.filter({ user_id: userData.id })
      ]);

      if (brands.length > 0) {
        setProfile(brands[0]);
        setProfileType('brand');
      } else if (creators.length > 0) {
        setProfile(creators[0]);
        setProfileType('creator');
      } else {
        setProfile(null);
        setProfileType(null);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!profile || !profileType) return;

    try {
      if (profileType === 'brand') {
        await base44.entities.Brand.update(profile.id, updates);
      } else {
        await base44.entities.Creator.update(profile.id, updates);
      }
      
      // Reload profile data to ensure UI is in sync
      await loadUserData();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const logout = (redirectUrl) => {
    base44.auth.logout(redirectUrl);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const value = {
    user,
    profile,
    profileType,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refresh: loadUserData,
    updateProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}