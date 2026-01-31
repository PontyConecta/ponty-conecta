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
  Star,
  CreditCard,
  ExternalLink
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
    // Check if running inside iframe (preview mode)
    if (window.self !== window.top) {
      alert('⚠️ O checkout do Stripe só funciona no aplicativo publicado.\n\nPor favor, publique seu app e acesse-o diretamente para realizar o pagamento.');
      return;
    }

    setSubscribing(true);
    try {
      const planType = `${profileType}_${selectedPlan}`;
      
      // Create Stripe checkout session
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan_type: planType,
        profile_type: profileType
      });

      if (response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Erro ao iniciar pagamento. Tente novamente.');
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await base44.functions.invoke('createCustomerPortalSession', {
        profile_type: profileType
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Erro ao abrir portal de gerenciamento. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';
  const isSubscribed = profile?.subscription_status === 'active' || profile?.account_state === 'active';
  const accentColor = isBrand ? 'indigo' : 'orange';

  const brandFeatures = [
    'Criação ilimitada de campanhas',
    'Acesso completo a todos os criadores',
    'Visualizar perfis e contatos',
    'Sistema de candidaturas e convites',
    'Gestão de entregas com critérios',
    'Resolução de disputas pela plataforma',
    'Suporte prioritário'
  ];

  const creatorFeatures = [
    'Acesso a todas as oportunidades',
    'Candidaturas ilimitadas',
    'Perfil destacado para marcas',
    'Visualizar contatos de marcas',
    'Sistema de entregas com provas',
    'Proteção em disputas',
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

  // Already subscribed view
  if (isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${isBrand ? 'from-indigo-500 to-violet-500' : 'from-orange-500 to-amber-500'} mb-4 shadow-lg`}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sua Assinatura</h1>
          <p className="text-slate-600">Você tem acesso completo à plataforma</p>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativa
                </Badge>
                <h3 className="text-xl font-semibold text-slate-900">Plano Pro</h3>
                <p className="text-slate-600">Acesso ilimitado a todas as funcionalidades</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">R$ 45</p>
                <p className="text-slate-500">/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">O que está incluso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-slate-400" />
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">Gerenciar Assinatura</h4>
                <p className="text-sm text-slate-500">Atualize forma de pagamento, cancele ou altere seu plano</p>
              </div>
              <Button variant="outline" onClick={handleManageSubscription}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Subscription selection view
  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-8 lg:mb-12">
        <Badge className={`mb-4 ${isBrand ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'} border-0 px-4 py-1.5`}>
          {isBrand ? <Building2 className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
          {isBrand ? 'Plano para Marcas' : 'Plano para Criadores'}
        </Badge>

        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
          Desbloqueie todo o potencial
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          {isBrand 
            ? 'Crie campanhas e conecte-se com os melhores criadores' 
            : 'Acesse oportunidades e trabalhe com grandes marcas'}
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-12">
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
          <div key={index} className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
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
          size="lg"
          onClick={() => window.location.href = createPageUrl(isBrand ? 'BrandDashboard' : 'CreatorDashboard')}
          className="text-slate-600 hover:text-slate-900"
        >
          Continuar explorando gratuitamente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
        <br />Cancele a qualquer momento pelo portal de assinatura.
      </p>
    </div>
  );
}