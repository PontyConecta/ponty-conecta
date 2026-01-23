import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Shield,
  Users,
  Loader2,
  ArrowRight,
  Building2,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      // Create subscription record
      const subscription = await base44.entities.Subscription.create({
        user_id: user.id,
        plan_type: `${profileType}_${selectedPlan}`,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (selectedPlan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: selectedPlan === 'monthly' ? 45 : 450,
        currency: 'BRL'
      });

      // Update profile to active
      if (profileType === 'brand') {
        await base44.entities.Brand.update(profile.id, { account_state: 'active' });
        window.location.href = createPageUrl('BrandDashboard');
      } else {
        await base44.entities.Creator.update(profile.id, { account_state: 'active' });
        window.location.href = createPageUrl('CreatorDashboard');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubscribing(false);
    }
  };

  const handleSkip = async () => {
    // For now, just redirect to dashboard in exploring mode
    if (profileType === 'brand') {
      window.location.href = createPageUrl('BrandDashboard');
    } else {
      window.location.href = createPageUrl('CreatorDashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';
  const accentColor = isBrand ? 'indigo' : 'orange';

  const brandFeatures = [
    'Criação ilimitada de campanhas',
    'Acesso completo a todos os criadores',
    'Sistema de candidaturas e convites',
    'Gestão de entregas com critérios',
    'Resolução de disputas pela plataforma',
    'Histórico protegido juridicamente',
    'Suporte prioritário'
  ];

  const creatorFeatures = [
    'Acesso a todas as oportunidades',
    'Candidaturas ilimitadas',
    'Perfil destacado para marcas',
    'Sistema de entregas com provas',
    'Proteção em disputas',
    'Histórico de trabalhos',
    'Suporte prioritário'
  ];

  const features = isBrand ? brandFeatures : creatorFeatures;

  const plans = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 45,
      period: '/mês',
      description: 'Flexibilidade para começar'
    },
    {
      id: 'annual',
      name: 'Anual',
      price: 450,
      period: '/ano',
      description: 'Economize R$ 90',
      badge: 'Melhor Oferta',
      discount: '17% OFF'
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isBrand ? 'from-indigo-600 to-violet-600' : 'from-orange-500 to-amber-500'} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>

          <Badge className={`mb-4 ${isBrand ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'} border-0 px-4 py-1.5`}>
            {isBrand ? <Building2 className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
            {isBrand ? 'Plano para Marcas' : 'Plano para Criadores'}
          </Badge>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Desbloqueie todo o potencial
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            {isBrand 
              ? 'Comece a criar campanhas e conecte-se com os melhores criadores' 
              : 'Acesse oportunidades exclusivas e trabalhe com grandes marcas'}
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`
                  relative cursor-pointer transition-all h-full
                  ${selectedPlan === plan.id 
                    ? `border-2 ${isBrand ? 'border-indigo-500' : 'border-orange-500'} shadow-lg` 
                    : 'border-2 border-transparent hover:border-slate-200'}
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${isBrand ? 'bg-indigo-600' : 'bg-orange-500'} text-white text-xs font-medium px-3 py-1 rounded-full`}>
                    {plan.badge}
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>
                    {plan.discount && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        {plan.discount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-slate-900">R$ {plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <div className={`
                    w-full h-1 rounded-full transition-colors
                    ${selectedPlan === plan.id 
                      ? (isBrand ? 'bg-indigo-500' : 'bg-orange-500')
                      : 'bg-slate-200'}
                  `} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${isBrand ? 'text-indigo-600' : 'text-orange-500'}`} />
              O que está incluso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Shield, label: 'Pagamento Seguro' },
            { icon: Zap, label: 'Acesso Imediato' },
            { icon: Users, label: 'Suporte Humano' }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={handleSubscribe}
            disabled={subscribing}
            className={`
              w-full sm:w-auto px-12 h-14 text-lg
              ${isBrand 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'}
              shadow-xl
            `}
          >
            {subscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Assinar por R$ {selectedPlan === 'monthly' ? '45/mês' : '450/ano'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-700"
          >
            Continuar explorando (sem assinar)
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
          <br />Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}