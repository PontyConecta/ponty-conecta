import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader2, CreditCard, Crown, Shield, Zap, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { toast } from 'sonner';

const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'price_monthly', // Substitua pelo ID real da Stripe quando disponível
    name: 'Plano Mensal',
    price: 45,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Acesso completo à plataforma',
      'Gerenciamento de campanhas ilimitadas',
      'Suporte por email',
      'Analytics básico',
      'Até 10 criadores (Marcas)',
      'Até 5 campanhas simultâneas'
    ]
  },
  annual: {
    id: 'price_annual', // Substitua pelo ID real da Stripe quando disponível
    name: 'Plano Anual',
    price: 450,
    currency: 'BRL',
    interval: 'year',
    discount: '17%',
    features: [
      'Tudo do plano mensal',
      'Desconto de 17% (economize R$ 90)',
      'Suporte prioritário',
      'Analytics avançado',
      'Criadores ilimitados',
      'Campanhas ilimitadas'
    ]
  }
};

function SubscriptionCard({ plan, planKey, isSelected, onSelect }) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-600 shadow-lg ring-2 ring-indigo-600'
          : 'border-slate-200 hover:border-indigo-300'
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            {plan.discount && (
              <Badge className="mt-2 bg-green-100 text-green-800 border-0">
                Economize {plan.discount}
              </Badge>
            )}
          </div>
          {isSelected && (
            <Check className="w-6 h-6 text-indigo-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <span className="text-4xl font-bold text-slate-900">
            R$ {plan.price}
          </span>
          <span className="text-slate-600 ml-2">
            por {plan.interval === 'month' ? 'mês' : 'ano'}
          </span>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionPage() {
  const { user, profile, profileType } = useAuth();
  const { isSubscribed, subscriptionStatus, refresh: refreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (user && profile) {
      loadSubscriptionData();
    }
  }, [user, profile]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const subscriptions = await base44.entities.Subscription.filter({
        user_id: user.id,
        status: 'active'
      });

      if (subscriptions.length > 0) {
        setSubscription(subscriptions[0]);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Erro ao carregar dados de assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const plan = SUBSCRIPTION_PLANS[selectedPlan];
      
      // Chama função de backend para criar checkout session
      const response = await base44.functions.invoke('createStripeCheckout', {
        userId: user.id,
        profileId: profile.id,
        profileType: profileType,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        interval: plan.interval,
        email: user.email
      });

      if (response.data.checkoutUrl) {
        // Redireciona para o checkout da Stripe
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Erro ao processar assinatura');
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) return;

    try {
      setLoading(true);
      
      const response = await base44.functions.invoke('cancelStripeSubscription', {
        subscriptionId: subscription.stripe_subscription_id
      });

      if (response.data.success) {
        toast.success('Assinatura cancelada');
        setSubscription(null);
        refreshSubscription();
        await loadSubscriptionData();
      } else {
        throw new Error(response.data.error || 'Erro ao cancelar assinatura');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // Redireciona para o portal de gerenciamento da Stripe
    if (subscription?.stripe_customer_id) {
      base44.functions.invoke('createStripePortalSession', {
        customerId: subscription.stripe_customer_id
      }).then(response => {
        if (response.data.portalUrl) {
          window.location.href = response.data.portalUrl;
        }
      }).catch(error => {
        console.error('Error creating portal session:', error);
        toast.error('Erro ao abrir portal de gerenciamento');
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Planos e Assinatura</h1>
        <p className="text-lg text-slate-600">
          Escolha o plano perfeito para suas necessidades
        </p>
      </div>

      {/* Current Subscription Status */}
      {isSubscribed && subscription && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Sua assinatura está ativa. {subscription.next_billing_date && `Próximo pagamento em ${new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Selection */}
      {!isSubscribed ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <SubscriptionCard
                key={key}
                plan={plan}
                planKey={key}
                isSelected={selectedPlan === key}
                onSelect={() => setSelectedPlan(key)}
              />
            ))}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4">
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
          <Button
            onClick={handleSubscribe}
            disabled={subscribing}
            size="lg"
            className={`
              w-full px-12 h-14 text-lg
              ${isBrand 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700' 
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'}
              shadow-xl
            `}
          >
            {subscribing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Assinar por R$ {SUBSCRIPTION_PLANS[selectedPlan].price}/{SUBSCRIPTION_PLANS[selectedPlan].interval === 'month' ? 'mês' : 'ano'}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
            <br />Cancele a qualquer momento pelo portal de assinatura.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Seu Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Plano</p>
                  <p className="font-semibold text-slate-900">{subscription.plan_name || subscription.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Preço</p>
                  <p className="font-semibold text-slate-900">R$ {subscription.amount}/{subscription.plan_type?.includes('monthly') ? 'mês' : 'ano'}</p>
                </div>
                {subscription.next_billing_date && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Próximo Pagamento</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-1">Status</p>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manage Subscription */}
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

          {/* Billing History */}
          {subscription.last_billing_date && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">Pagamento Processado</p>
                      <p className="text-sm text-slate-600">
                        {new Date(subscription.last_billing_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">R$ {subscription.amount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancel Subscription */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Cancelar Assinatura</CardTitle>
              <CardDescription>
                Você perderá acesso aos recursos premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCancelSubscription}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Cancelar Assinatura'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}