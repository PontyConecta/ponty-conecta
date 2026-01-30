import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckInterval, setSessionCheckInterval] = useState(null);

  // Verificar autenticação
  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setUser(null);
        setProfile(null);
        setProfileType(null);
        return false;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      // Buscar perfil (Brand ou Creator)
      try {
        const brandProfiles = await base44.entities.Brand.filter({ user_id: userData.id });
        if (brandProfiles.length > 0) {
          setProfile(brandProfiles[0]);
          setProfileType('brand');
          return true;
        }

        const creatorProfiles = await base44.entities.Creator.filter({ user_id: userData.id });
        if (creatorProfiles.length > 0) {
          setProfile(creatorProfiles[0]);
          setProfileType('creator');
          return true;
        }

        // Usuário autenticado mas sem perfil
        setProfile(null);
        setProfileType(null);
      } catch (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
      }

      return true;
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      setUser(null);
      setProfile(null);
      setProfileType(null);
      return false;
    }
  };

  // Inicialização e polling de sessão
  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setLoading(false);
    };

    init();

    // Verificar sessão a cada 5 minutos
    const interval = setInterval(async () => {
      const isValid = await checkAuth();
      if (!isValid && user) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      }
    }, 5 * 60 * 1000);

    setSessionCheckInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Atualizar perfil
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      if (profileType === 'brand') {
        const brandProfiles = await base44.entities.Brand.filter({ user_id: user.id });
        if (brandProfiles.length > 0) {
          setProfile(brandProfiles[0]);
        }
      } else if (profileType === 'creator') {
        const creatorProfiles = await base44.entities.Creator.filter({ user_id: user.id });
        if (creatorProfiles.length > 0) {
          setProfile(creatorProfiles[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Logout
  const logout = async (redirectUrl = '/') => {
    try {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
      await base44.auth.logout(redirectUrl);
      setUser(null);
      setProfile(null);
      setProfileType(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.href = redirectUrl;
    }
  };

  const value = {
    user,
    profile,
    profileType,
    loading,
    checkAuth,
    refreshProfile,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}