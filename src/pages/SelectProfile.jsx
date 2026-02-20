import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Megaphone,
  Users,
  FileCheck,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SelectProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('SelectProfile'));
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      const [brands, creators] = await Promise.all([
        base44.entities.Brand.filter({ user_id: userData.id }),
        base44.entities.Creator.filter({ user_id: userData.id })
      ]);

      if (brands.length > 0) {
        const dest = brands[0].account_state === 'ready' ? 'BrandDashboard' : 'OnboardingBrand';
        navigate(createPageUrl(dest));
        return;
      }
      if (creators.length > 0) {
        const dest = creators[0].account_state === 'ready' ? 'CreatorDashboard' : 'OnboardingCreator';
        navigate(createPageUrl(dest));
        return;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = async (type) => {
    setSelecting(true);
    try {
      // Double-check no existing profile exists (prevent duplicates)
      const [existingBrands, existingCreators] = await Promise.all([
        base44.entities.Brand.filter({ user_id: user.id }),
        base44.entities.Creator.filter({ user_id: user.id })
      ]);

      if (existingBrands.length > 0 || existingCreators.length > 0) {
        // Profile already exists, redirect instead of creating duplicate
        if (existingBrands.length > 0) {
          const dest = existingBrands[0].account_state === 'ready' ? 'BrandDashboard' : 'OnboardingBrand';
          navigate(createPageUrl(dest));
        } else {
          const dest = existingCreators[0].account_state === 'ready' ? 'CreatorDashboard' : 'OnboardingCreator';
          navigate(createPageUrl(dest));
        }
        return;
      }

      if (type === 'brand') {
        await base44.entities.Brand.create({
          user_id: user.id,
          account_state: 'incomplete',
          onboarding_step: 1
        });
        navigate(createPageUrl('OnboardingBrand'));
      } else {
        await base44.entities.Creator.create({
          user_id: user.id,
          display_name: user.full_name,
          account_state: 'incomplete',
          onboarding_step: 1
        });
        navigate(createPageUrl('OnboardingCreator'));
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9038fa]" />
      </div>
    );
  }

  const profiles = [
    {
      type: 'brand',
      icon: Building2,
      title: 'Sou uma Marca',
      subtitle: 'Quero contratar criadores',
      bgColor: '#9038fa',
      shadowColor: 'shadow-purple-500/25',
      features: [
        'Crie campanhas estruturadas',
        'Selecione criadores ideais',
        'Avalie entregas com critérios claros',
        'Proteção em disputas'
      ]
    },
    {
      type: 'creator',
      icon: Sparkles,
      title: 'Sou Criador',
      subtitle: 'Quero trabalhar com marcas',
      bgColor: '#b77aff',
      shadowColor: 'shadow-purple-500/25',
      features: [
        'Acesse oportunidades filtradas',
        'Candidate-se a campanhas',
        'Regras claras desde o início',
        'Pagamento garantido por entregas'
      ]
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20" style={{ backgroundColor: '#9038fa' }}>
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Ponty</span>
        </Link>

        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Bem-vindo, {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Escolha como você quer usar a plataforma. Você poderá criar perfis adicionais depois.
        </p>
      </div>

      {/* Profile Cards */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card 
              className={`
                relative overflow-hidden p-8 cursor-pointer transition-all duration-300
                hover:shadow-2xl hover:-translate-y-1 border-2 border-transparent
                hover:border-slate-200
              `}
              onClick={() => !selecting && selectProfile(profile.type)}
            >
              {/* Background circle */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10" style={{ backgroundColor: profile.bgColor }} />
              
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl" style={{ backgroundColor: profile.bgColor }}>
                <profile.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{profile.title}</h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{profile.subtitle}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {profile.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Button 
                className="w-full hover:opacity-90 text-white h-12"
                style={{ backgroundColor: profile.bgColor }}
                disabled={selecting}
              >
                {selecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Começar como {profile.type === 'brand' ? 'Marca' : 'Criador'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info Section */}
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-[#9038fa] hover:underline">Termos de Uso</a>
          {' '}e{' '}
          <a href="#" className="text-[#9038fa] hover:underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}