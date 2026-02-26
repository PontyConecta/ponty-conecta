import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { trackPurchase } from '@/components/analytics/analyticsUtils';
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
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';

export default function Subscription() {
  const { user, profile: authProfile, profileType: authProfileType, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const navigate = useNavigate();

  useEffect(() => {
    if (authProfile && authProfileType) {
      setProfile(authProfile);
      setProfileType(authProfileType);
      setLoading(false);
    }
  }, [authProfile, authProfileType]);

  useEffect(() => {
    // Check for success parameter in URL after profile is loaded — force refresh
    if (profile && profileType) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        // Force refresh profile from DB to pick up webhook updates
        refreshProfile();
        const plan = urlParams.get('plan') || selectedPlan;
        trackPurchase({
          value: plan === 'monthly' ? 45 : 450,
          currency: 'BRL',
          content_name: `Assinatura ${profileType === 'brand' ? 'Marca' : 'Criador'} ${plan === 'monthly' ? 'Mensal' : 'Anual'}`,
          subscription_status: profile.subscription_status
        });
      }
    }
  }, [profile, profileType]);

  const handleSubscribe = async () => {
    if (window.self !== window.top) {
      alert('⚠️ O checkout do Stripe só funciona no aplicativo publicado.\n\nPor favor, publique seu app e acesse-o diretamente para realizar o pagamento.');
      return;
    }

    setSubscribing(true);
    try {
      const planType = `${profileType}_${selectedPlan}`;
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan_type: planType,
        profile_type: profileType
      });

      if (response.data?.url) {
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';
  const isSubscribed = isProfileSubscribed(profile);

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
    const planName = 'Premium';
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg bg-primary">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Sua Assinatura</h1>
          <p className="text-muted-foreground">Você tem acesso completo à plataforma</p>
        </div>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-0 mb-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativa
                </Badge>
                <h3 className="text-xl font-semibold text-foreground">Plano {planName}</h3>
                <p className="text-muted-foreground">Acesso ilimitado a todas as funcionalidades</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">R$ 45</p>
                <p className="text-muted-foreground">/mês</p>
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
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Gerenciar Assinatura</h4>
                <p className="text-sm text-muted-foreground">Atualize forma de pagamento, cancele ou altere seu plano</p>
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
      <div className="text-center mb-8 lg:mb-12">
        <Badge className="mb-4 bg-primary/10 text-primary border-0 px-4 py-1.5">
          {isBrand ? <Building2 className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2" />}
          {isBrand ? 'Plano para Marcas' : 'Plano para Criadores'}
        </Badge>

        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
          Desbloqueie todo o potencial
        </h1>
        <p className="text-lg max-w-xl mx-auto text-muted-foreground">
          {isBrand 
            ? 'Crie campanhas e conecte-se com os melhores criadores' 
            : 'Acesse oportunidades e trabalhe com grandes marcas'}
        </p>
      </div>

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
                  ? `border-2 border-primary shadow-lg` 
                  : 'border-2 border-transparent'}
              `}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  {plan.discount && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0">
                      {plan.discount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-foreground">R$ {plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <div className={`w-full h-1 rounded-full transition-colors ${selectedPlan === plan.id ? 'bg-primary' : 'bg-border'}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            O que está incluso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Shield, label: 'Pagamento Seguro' },
          { icon: Zap, label: 'Acesso Imediato' },
          { icon: Users, label: 'Suporte Humano' }
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-muted">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm bg-card">
              <item.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleSubscribe}
          disabled={subscribing}
          className="w-full sm:w-auto px-12 h-14 text-lg shadow-xl text-white bg-primary hover:bg-primary/90"
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
        onClick={() => navigate(createPageUrl(isBrand ? 'BrandDashboard' : 'CreatorDashboard'))}
        className="text-muted-foreground hover:opacity-70"
        >
          Continuar explorando gratuitamente
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-center text-sm mt-6 text-muted-foreground">
        Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
        <br />Cancele a qualquer momento pelo portal de assinatura.
      </p>
    </div>
  );
}