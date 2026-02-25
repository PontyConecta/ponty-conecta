import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, Users, TrendingUp, Activity, RefreshCw, Repeat, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

import DashboardMetricCard from '../components/admin/DashboardMetricCard';
import DashboardProfileFilter from '../components/admin/DashboardProfileFilter';
import DashboardUserStats from '../components/admin/DashboardUserStats';
import DashboardRevenueChart from '../components/admin/DashboardRevenueChart';
import DashboardEngagementChart from '../components/admin/DashboardEngagementChart';
import DashboardMarketplace from '../components/admin/DashboardMarketplace';
import DashboardPipeline from '../components/admin/DashboardPipeline';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [profileFilter, setProfileFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, dateRange, profileFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminAnalytics', { dateRange, profileTypeFilter: profileFilter });
      if (response.data.error) throw new Error(response.data.error);
      setAnalytics(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Acesso Negado</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Você não tem permissão para acessar este painel.</p>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard Admin</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardProfileFilter value={profileFilter} onChange={setProfileFilter} />
          <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'day', label: 'Hoje' },
          { key: 'week', label: '7 dias' },
          { key: 'month', label: '30 dias' },
          { key: 'year', label: '12 meses' },
        ].map(range => (
          <Button
            key={range.key}
            variant={dateRange === range.key ? 'default' : 'outline'}
            onClick={() => setDateRange(range.key)}
            size="sm"
            className={dateRange === range.key ? 'bg-[#9038fa] hover:bg-[#7a2de0] text-white' : ''}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {analytics && (
        <>
          {/* Primary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashboardMetricCard
              label="MRR"
              value={`R$ ${(analytics.mrr || 0).toLocaleString('pt-BR')}`}
              subtitle={profileFilter === 'all' ? `Marcas R$${analytics.brandMRR || 0} · Creators R$${analytics.creatorMRR || 0}` : undefined}
              icon={DollarSign}
              iconColor="text-green-600"
            />
            <DashboardMetricCard
              label="ARR"
              value={`R$ ${(analytics.arr || 0).toLocaleString('pt-BR')}`}
              subtitle={`ARPU R$ ${(analytics.arpu || 0).toFixed(2)}`}
              icon={TrendingUp}
              iconColor="text-blue-600"
            />
            <DashboardMetricCard
              label="LTV Estimado"
              value={`R$ ${(analytics.ltv || 0).toLocaleString('pt-BR')}`}
              subtitle={`Retenção ${analytics.retentionRate || 0}%`}
              icon={Target}
              iconColor="text-purple-600"
            />
            <DashboardMetricCard
              label="Churn Rate"
              value={`${analytics.churnRate || 0}%`}
              subtitle={`${analytics.activeSubscribers || 0} assinantes ativos`}
              icon={Repeat}
              iconColor="text-orange-600"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashboardMetricCard
              label="Total Usuários"
              value={analytics.totalUsers || 0}
              subtitle={`${analytics.totalBrands || 0} marcas · ${analytics.totalCreators || 0} criadores`}
              icon={Users}
              iconColor="text-indigo-600"
            />
            <DashboardMetricCard
              label="Novos no Período"
              value={analytics.newUsers || 0}
              previousValue={analytics.previousNewUsers}
              subtitle={`Crescimento ${analytics.growthRate || 0}%`}
              icon={TrendingUp}
              iconColor="text-emerald-600"
            />
            <DashboardMetricCard
              label="Conversão"
              value={`${analytics.conversionRate || 0}%`}
              subtitle={`${analytics.acceptedApplications || 0} de ${analytics.totalApplications || 0} aceitas`}
              icon={Activity}
              iconColor="text-cyan-600"
            />
            <DashboardMetricCard
              label="Taxa de Sucesso"
              value={`${analytics.successRate || 0}%`}
              subtitle={`${analytics.completedDeliveries || 0} entregas aprovadas`}
              icon={Shield}
              iconColor="text-green-600"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 p-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Usuários</TabsTrigger>
              <TabsTrigger value="engagement" className="text-xs">Engajamento</TabsTrigger>
              <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
              <TabsTrigger value="marketplace" className="text-xs">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardRevenueChart data={analytics.revenueChart} profileFilter={profileFilter} />
              <DashboardPipeline pipeline={analytics.pipeline} funnelData={analytics.funnelData} />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <DashboardUserStats analytics={analytics} />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DashboardMetricCard label="Campanhas Ativas" value={analytics.activeCampaigns || 0} />
                <DashboardMetricCard label="Total Candidaturas" value={analytics.totalApplications || 0} />
                <DashboardMetricCard label="Novas Candidaturas" value={analytics.newApplications || 0} previousValue={analytics.previousNewUsers} />
                <DashboardMetricCard label="Cumprimento" value={`${analytics.fulfillmentRate || 0}%`} />
              </div>
              <DashboardEngagementChart data={analytics.engagementChart} />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6">
              <DashboardPipeline pipeline={analytics.pipeline} funnelData={analytics.funnelData} />
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-6">
              <DashboardMarketplace analytics={analytics} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}