import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

import DashboardUserStats from '../components/admin/DashboardUserStats';
import DashboardRevenueChart from '../components/admin/DashboardRevenueChart';
import DashboardEngagementChart from '../components/admin/DashboardEngagementChart';
import DashboardMarketplace from '../components/admin/DashboardMarketplace';
import DashboardPipeline from '../components/admin/DashboardPipeline';
import DashboardFinancials from '../components/admin/DashboardFinancials';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminAnalytics', { dateRange });
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {[
              { key: 'day', label: 'Hoje' },
              { key: 'week', label: '7d' },
              { key: 'month', label: '30d' },
              { key: 'year', label: '12m' },
            ].map(range => (
              <button
                key={range.key}
                onClick={() => setDateRange(range.key)}
                className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${
                  dateRange === range.key ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                style={dateRange === range.key 
                  ? { backgroundColor: 'var(--bg-secondary)', color: '#9038fa' } 
                  : { color: 'var(--text-secondary)' }}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button onClick={loadAnalytics} variant="ghost" size="icon" disabled={loading} className="h-8 w-8">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <span className="text-[10px] hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
            {lastRefresh.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Metrics - compact row */}
          <div className="grid grid-cols-4 gap-3">
            <MiniStat label="Usuários" value={analytics.totalUsers || 0} detail={`${analytics.totalBrands || 0}M · ${analytics.totalCreators || 0}C`} />
            <MiniStat label="Novos" value={analytics.newUsers || 0} detail={`${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate || 0}%`} highlight={analytics.growthRate > 0} />
            <MiniStat label="Conversão" value={`${analytics.conversionRate || 0}%`} detail={`${analytics.acceptedApplications || 0}/${analytics.totalApplications || 0}`} />
            <MiniStat label="Sucesso" value={`${analytics.successRate || 0}%`} detail={`${analytics.completedDeliveries || 0} entregas`} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 p-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
              <TabsTrigger value="financials" className="text-xs">Financeiro</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Usuários</TabsTrigger>
              <TabsTrigger value="engagement" className="text-xs">Engajamento</TabsTrigger>
              <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
              <TabsTrigger value="marketplace" className="text-xs">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardPipeline pipeline={analytics.pipeline} funnelData={analytics.funnelData} />
              <DashboardEngagementChart data={analytics.engagementChart} />
            </TabsContent>

            <TabsContent value="financials" className="space-y-6">
              <DashboardFinancials />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <DashboardUserStats analytics={analytics} />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DashboardMetricCard label="Campanhas Ativas" value={analytics.activeCampaigns || 0} tooltip="Campanhas com status 'ativa' atualmente." />
                <DashboardMetricCard label="Total Candidaturas" value={analytics.totalApplications || 0} tooltip="Número total de candidaturas de creators a campanhas." />
                <DashboardMetricCard label="Novas Candidaturas" value={analytics.newApplications || 0} previousValue={analytics.previousNewUsers} tooltip="Candidaturas recebidas no período selecionado." />
                <DashboardMetricCard label="Cumprimento" value={`${analytics.fulfillmentRate || 0}%`} tooltip="Percentual de entregas feitas sobre candidaturas aceitas." />
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

function MiniStat({ label, value, detail, highlight }) {
  return (
    <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {detail && (
        <p className={`text-[10px] mt-0.5 ${highlight ? 'text-emerald-600 font-semibold' : ''}`} style={!highlight ? { color: 'var(--text-secondary)' } : {}}>
          {detail}
        </p>
      )}
    </div>
  );
}