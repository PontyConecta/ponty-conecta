import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Target, Repeat, Users, CreditCard, Building2, Star, EyeOff } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardMetricCard from './DashboardMetricCard';
import DashboardProfileFilter from './DashboardProfileFilter';
import DashboardRevenueChart from './DashboardRevenueChart';

export default function DashboardFinancials() {
  const [stripeData, setStripeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileFilter, setProfileFilter] = useState('all');

  useEffect(() => {
    loadStripeData();
  }, []);

  const loadStripeData = async () => {
    setLoading(true);
    const response = await base44.functions.invoke('adminStripeMetrics', {});
    setStripeData(response.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!stripeData) return null;

  const filter = profileFilter;
  const mrr = filter === 'brand' ? stripeData.brandMRR : filter === 'creator' ? stripeData.creatorMRR : stripeData.mrr;
  const arr = mrr * 12;
  const subscribers = filter === 'brand' ? stripeData.brandSubscribers : filter === 'creator' ? stripeData.creatorSubscribers : stripeData.totalActiveSubscribers;
  const arpu = subscribers > 0 ? mrr / subscribers : 0;

  return (
    <div className="space-y-6">
      {/* Filter + Info */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DashboardProfileFilter value={profileFilter} onChange={setProfileFilter} />
        {stripeData.excludedCount > 0 && (
          <Badge variant="outline" className="gap-1 text-xs" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            <EyeOff className="w-3 h-3" />
            {stripeData.excludedCount} usuário(s) excluído(s) dos cálculos
          </Badge>
        )}
      </div>

      {/* Primary Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardMetricCard
          label="MRR"
          value={`R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={filter === 'all' ? `Marcas R$${stripeData.brandMRR} · Creators R$${stripeData.creatorMRR}` : undefined}
          icon={DollarSign}
          iconColor="text-green-600"
          tooltip="Monthly Recurring Revenue — receita recorrente mensal das assinaturas ativas no Stripe."
        />
        <DashboardMetricCard
          label="ARR"
          value={`R$ ${arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`ARPU R$ ${arpu.toFixed(2)}`}
          icon={TrendingUp}
          iconColor="text-blue-600"
          tooltip="Annual Recurring Revenue — projeção anual da receita (MRR × 12). ARPU é a receita média por assinante."
        />
        <DashboardMetricCard
          label="LTV Estimado"
          value={`R$ ${stripeData.ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`Retenção ${stripeData.retentionRate}%`}
          icon={Target}
          iconColor="text-purple-600"
          tooltip="Lifetime Value — valor estimado que cada assinante gera durante o tempo de vida na plataforma."
        />
        <DashboardMetricCard
          label="Churn Rate"
          value={`${stripeData.churnRate}%`}
          subtitle={`${subscribers} assinantes ativos`}
          icon={Repeat}
          iconColor="text-orange-600"
          tooltip="Taxa de cancelamento mensal — percentual de assinantes que cancelaram nos últimos 30 dias."
        />
      </div>

      {/* Secondary Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardMetricCard
          label="Assinantes Ativos"
          value={stripeData.totalActiveSubscribers}
          subtitle={`${stripeData.brandSubscribers} marcas · ${stripeData.creatorSubscribers} creators`}
          icon={Users}
          iconColor="text-indigo-600"
          tooltip="Número total de assinaturas ativas (pagas) no Stripe."
        />
        <DashboardMetricCard
          label="Receita Este Mês"
          value={`R$ ${stripeData.thisMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          previousValue={stripeData.lastMonthRevenue}
          icon={CreditCard}
          iconColor="text-emerald-600"
          tooltip="Receita faturada neste mês (invoices pagas no Stripe)."
        />
        <DashboardMetricCard
          label="Planos Mensais"
          value={stripeData.monthlySubscribers}
          subtitle={`${stripeData.annualSubscribers} anuais`}
          icon={CreditCard}
          iconColor="text-cyan-600"
          tooltip="Distribuição dos assinantes entre planos mensais e anuais."
        />
        <DashboardMetricCard
          label="Cancelados (30d)"
          value={stripeData.recentlyCancelledCount}
          subtitle={`${stripeData.pastDueSubscribers} vencidas`}
          icon={Repeat}
          iconColor="text-red-600"
          tooltip="Assinaturas canceladas nos últimos 30 dias e assinaturas com pagamento vencido."
        />
      </div>

      {/* Revenue Chart from Stripe */}
      <DashboardRevenueChart data={stripeData.revenueChart} profileFilter={profileFilter} />

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stripeData.subDistribution?.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Status das Assinaturas</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stripeData.subDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {stripeData.subDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {stripeData.subDistribution.map((p) => (
                  <span key={p.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name} ({p.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stripeData.planTypeDistribution?.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tipo de Plano</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stripeData.planTypeDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {stripeData.planTypeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {stripeData.planTypeDistribution.map((p) => (
                  <span key={p.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name} ({p.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}