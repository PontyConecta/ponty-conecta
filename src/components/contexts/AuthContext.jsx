import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { getPersistedUtms } from '@/utils/utmUtils';

const AuthContext = createContext(null);

// Retroactive UTM backfill: if profile has no utm_source but localStorage has UTM data, save it
function backfillUtm(profile, entityName) {
  if (!profile || profile.utm_source) return;
  const utmData = getPersistedUtms();
  if (!utmData?.utm_source) return;
  base44.entities[entityName].update(profile.id, {
    utm_source: utmData.utm_source,
    utm_medium: utmData.utm_medium || null,
    utm_campaign: utmData.utm_campaign || null,
    utm_content: utmData.utm_content || null,
    utm_term: utmData.utm_term || null,
  }).catch(() => {}); // fire-and-forget
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckIntervalRef = useRef(null);
  const userRef = useRef(null);
  const [updating, setUpdating] = useState(false);

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

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'user_data', user_id: userData.id });

      // Buscar ambos os perfis em paralelo
      try {
        const [brandProfiles, creatorProfiles] = await Promise.all([
          base44.entities.Brand.filter({ user_id: userData.id }),
          base44.entities.Creator.filter({ user_id: userData.id }),
        ]);

        const hasBrand = brandProfiles.length > 0;
        const hasCreator = creatorProfiles.length > 0;

        if (hasBrand && hasCreator) {
          const brandReady = brandProfiles[0].account_state === 'ready';
          const creatorReady = creatorProfiles[0].account_state === 'ready';

          if (creatorReady && !brandReady) {
            setProfile(creatorProfiles[0]);
            setProfileType('creator');
            backfillUtm(creatorProfiles[0], 'Creator');
          } else if (brandReady && !creatorReady) {
            setProfile(brandProfiles[0]);
            setProfileType('brand');
            backfillUtm(brandProfiles[0], 'Brand');
          } else {
            const brandDate = new Date(brandProfiles[0].created_date || 0);
            const creatorDate = new Date(creatorProfiles[0].created_date || 0);
            if (creatorDate > brandDate) {
              setProfile(creatorProfiles[0]);
              setProfileType('creator');
              backfillUtm(creatorProfiles[0], 'Creator');
            } else {
              setProfile(brandProfiles[0]);
              setProfileType('brand');
              backfillUtm(brandProfiles[0], 'Brand');
            }
          }
          return true;
        }

        if (hasBrand) {
          setProfile(brandProfiles[0]);
          setProfileType('brand');
          backfillUtm(brandProfiles[0], 'Brand');
          return true;
        }

        if (hasCreator) {
          setProfile(creatorProfiles[0]);
          setProfileType('creator');
          backfillUtm(creatorProfiles[0], 'Creator');
          return true;
        }

        // Usuário autenticado mas sem perfil
        setProfile(null);
        setProfileType(null);
      } catch (profileError) {
        console.error('Error loading profile:', profileError);
        // Retry once
        try {
          const [brandProfiles, creatorProfiles] = await Promise.all([
            base44.entities.Brand.filter({ user_id: userData.id }),
            base44.entities.Creator.filter({ user_id: userData.id }),
          ]);

          const hasBrand = brandProfiles.length > 0;
          const hasCreator = creatorProfiles.length > 0;

          if (hasBrand && hasCreator) {
            const brandReady = brandProfiles[0].account_state === 'ready';
            const creatorReady = creatorProfiles[0].account_state === 'ready';
            if (creatorReady && !brandReady) {
              setProfile(creatorProfiles[0]);
              setProfileType('creator');
            } else if (brandReady && !creatorReady) {
              setProfile(brandProfiles[0]);
              setProfileType('brand');
            } else {
              const brandDate = new Date(brandProfiles[0].created_date || 0);
              const creatorDate = new Date(creatorProfiles[0].created_date || 0);
              if (creatorDate > brandDate) {
                setProfile(creatorProfiles[0]);
                setProfileType('creator');
              } else {
                setProfile(brandProfiles[0]);
                setProfileType('brand');
              }
            }
            return true;
          }
          if (hasBrand) { setProfile(brandProfiles[0]); setProfileType('brand'); return true; }
          if (hasCreator) { setProfile(creatorProfiles[0]); setProfileType('creator'); return true; }
          setProfile(null);
          setProfileType(null);
        } catch (retryError) {
          console.error('Profile load retry failed:', retryError);
        }
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
      if (!isValid && userRef.current) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      }
    }, 5 * 60 * 1000);

    sessionCheckIntervalRef.current = interval;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Keep userRef in sync for interval closure
  useEffect(() => { userRef.current = user; }, [user]);

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

  // Atualizar perfil com feedback (sem reload)
  // SECURITY: Routes through backend function to enforce field sanitization
  const updateProfile = async (updates) => {
    if (!profile || !profileType) {
      toast.error('Perfil não encontrado');
      return false;
    }

    setUpdating(true);
    try {
      const response = await base44.functions.invoke('updateProfile', {
        profile_type: profileType,
        updates
      });

      if (response.data?.success && response.data?.profile) {
        setProfile(response.data.profile);
      } else {
        // Fallback: refresh from server
        await refreshProfile();
      }

      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const msg = error?.response?.data?.error || 'Erro ao salvar alterações. Tente novamente.';
      toast.error(msg);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  // Logout
  const logout = async (redirectUrl = '/') => {
    try {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      setUser(null);
      setProfile(null);
      setProfileType(null);
      await base44.auth.logout(redirectUrl);
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
    updating,
    checkAuth,
    refreshProfile,
    updateProfile,
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