import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Target, Repeat, Users, CreditCard, EyeOff, RefreshCw } from 'lucide-react';
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
    if (response.data?.error) {
      console.error('Stripe metrics error:', response.data.error);
      setStripeData(null);
    } else {
      setStripeData(response.data);
    }
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

  if (!stripeData) return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Não foi possível carregar as métricas financeiras do Stripe.</p>
        <Button onClick={loadStripeData} variant="outline" size="sm" className="mt-3">Tentar novamente</Button>
      </CardContent>
    </Card>
  );

  const f = profileFilter;
  const d = stripeData;

  // All metrics now respect the filter with real per-segment backend data
  const mrr = f === 'brand' ? d.brandMRR : f === 'creator' ? d.creatorMRR : d.mrr;
  const arr = mrr * 12;
  const subscribers = f === 'brand' ? d.brandSubscribers : f === 'creator' ? d.creatorSubscribers : d.totalActiveSubscribers;
  const arpu = f === 'brand' ? d.brandArpu : f === 'creator' ? d.creatorArpu : d.arpu;
  const ltv = f === 'brand' ? d.brandLtv : f === 'creator' ? d.creatorLtv : d.ltv;
  const churnRate = f === 'brand' ? d.brandChurnRate : f === 'creator' ? d.creatorChurnRate : d.churnRate;
  const retentionRate = f === 'brand' ? d.brandRetentionRate : f === 'creator' ? d.creatorRetentionRate : d.retentionRate;
  const thisMonthRevenue = f === 'brand' ? d.thisMonthBrandRevenue : f === 'creator' ? d.thisMonthCreatorRevenue : d.thisMonthRevenue;
  const lastMonthRevenue = f === 'brand' ? d.lastMonthBrandRevenue : f === 'creator' ? d.lastMonthCreatorRevenue : d.lastMonthRevenue;
  const cancelledCount = f === 'brand' ? d.brandRecentlyCancelledCount : f === 'creator' ? d.creatorRecentlyCancelledCount : d.recentlyCancelledCount;

  return (
    <div className="space-y-6">
      {/* Filter + Info + Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardProfileFilter value={profileFilter} onChange={setProfileFilter} />
          {d.excludedCount > 0 && (
            <Badge variant="outline" className="gap-1 text-xs" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
              <EyeOff className="w-3 h-3" />
              {d.excludedCount} excluído(s){d.excludedPremiumCount > 0 ? ` (${d.excludedPremiumCount} premium)` : ''}
            </Badge>
          )}
        </div>
        <Button onClick={loadStripeData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Stripe
        </Button>
      </div>

      {/* Primary Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardMetricCard
          label="MRR"
          value={`R$ ${mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={f === 'all' ? `Marcas R$${d.brandMRR.toFixed(2)} · Creators R$${d.creatorMRR.toFixed(2)}` : `ARPU R$ ${arpu.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-green-600"
          tooltip="Monthly Recurring Revenue — receita recorrente mensal das assinaturas ativas no Stripe."
        />
        <DashboardMetricCard
          label="ARR"
          value={`R$ ${arr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={f === 'all' ? `ARPU R$ ${arpu.toFixed(2)}` : undefined}
          icon={TrendingUp}
          iconColor="text-blue-600"
          tooltip="Annual Recurring Revenue — projeção anual da receita (MRR × 12). ARPU é a receita média por assinante."
        />
        <DashboardMetricCard
          label="LTV Estimado"
          value={`R$ ${ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`Retenção ${retentionRate}%`}
          icon={Target}
          iconColor="text-purple-600"
          tooltip="Lifetime Value — valor estimado que cada assinante gera durante o tempo de vida na plataforma."
        />
        <DashboardMetricCard
          label="Churn Rate"
          value={`${churnRate}%`}
          subtitle={`${subscribers} assinante(s) ativo(s)`}
          icon={Repeat}
          iconColor="text-orange-600"
          tooltip="Taxa de cancelamento mensal — percentual de assinantes que cancelaram nos últimos 30 dias."
        />
      </div>

      {/* Secondary Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardMetricCard
          label="Assinantes Ativos"
          value={subscribers}
          subtitle={f === 'all' ? `${d.brandSubscribers} marcas · ${d.creatorSubscribers} creators` : undefined}
          icon={Users}
          iconColor="text-indigo-600"
          tooltip="Número total de assinaturas ativas (pagas) no Stripe."
        />
        <DashboardMetricCard
          label="Receita Este Mês"
          value={`R$ ${thisMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          previousValue={lastMonthRevenue}
          icon={CreditCard}
          iconColor="text-emerald-600"
          tooltip="Receita faturada neste mês (invoices pagas no Stripe) vs mês anterior."
        />
        <DashboardMetricCard
          label="Planos Mensais"
          value={d.monthlySubscribers}
          subtitle={`${d.annualSubscribers} anuais`}
          icon={CreditCard}
          iconColor="text-cyan-600"
          tooltip="Distribuição dos assinantes entre planos mensais e anuais."
        />
        <DashboardMetricCard
          label="Cancelados (30d)"
          value={cancelledCount}
          subtitle={f === 'all' ? `${d.pastDueSubscribers} vencida(s)` : undefined}
          icon={Repeat}
          iconColor="text-red-600"
          tooltip="Assinaturas canceladas nos últimos 30 dias."
        />
      </div>

      {/* Revenue Chart from Stripe */}
      <DashboardRevenueChart data={d.revenueChart} profileFilter={profileFilter} />

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {d.subDistribution?.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Status das Assinaturas</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.subDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {d.subDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {d.subDistribution.map((p) => (
                  <span key={p.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name} ({p.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {d.planTypeDistribution?.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tipo de Plano</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.planTypeDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {d.planTypeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {d.planTypeDistribution.map((p) => (
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