import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Users, TrendingUp, Activity, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

import AdminHeader from '../components/admin/AdminHeader';
import DashboardMetricCard from '../components/admin/DashboardMetricCard';
import DashboardDateFilter from '../components/admin/DashboardDateFilter';
import DashboardUserStats from '../components/admin/DashboardUserStats';
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
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = user?.role === 'admin';

  const [analyticsError, setAnalyticsError] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setAnalyticsError(false);
      const response = await base44.functions.invoke('adminAnalytics', { dateRange });
      if (response.data?.error) throw new Error(response.data.error);
      setAnalytics(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsError(true);
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, loadAnalytics]);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar este painel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Navigation Header */}
      <AdminHeader currentPageName="AdminDashboard" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-xs mt-1 text-muted-foreground">
            Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs - always visible so Financeiro works even if analytics fails */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financeiro</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Usuários</TabsTrigger>
          <TabsTrigger value="engagement" className="text-xs">Engajamento</TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading && !analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="h-80" />
            </div>
          ) : analyticsError && !analytics ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm mb-3 text-muted-foreground">Erro ao carregar dados gerais.</p>
              <Button onClick={loadAnalytics} variant="outline" size="sm">Tentar novamente</Button>
            </div>
          ) : analytics ? (
            <>
              <DashboardDateFilter value={dateRange} onChange={setDateRange} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <DashboardMetricCard
                  label="Total Usuários"
                  value={analytics.totalUsers || 0}
                  subtitle={`${analytics.totalBrands || 0} marcas · ${analytics.totalCreators || 0} criadores`}
                  icon={Users}
                  iconColor="text-indigo-600"
                  tooltip="Número total de usuários cadastrados na plataforma."
                />
                <DashboardMetricCard
                  label="Novos no Período"
                  value={analytics.newUsers || 0}
                  previousValue={analytics.previousNewUsers}
                  subtitle={`Crescimento ${analytics.growthRate || 0}%`}
                  icon={TrendingUp}
                  iconColor="text-emerald-600"
                  tooltip="Novos cadastros no período selecionado, comparado com o período anterior."
                />
                <DashboardMetricCard
                  label="Conversão"
                  value={`${analytics.conversionRate || 0}%`}
                  subtitle={`${analytics.acceptedApplications || 0} de ${analytics.totalApplications || 0} aceitas`}
                  icon={Activity}
                  iconColor="text-cyan-600"
                  tooltip="Taxa de candidaturas aceitas sobre o total de candidaturas recebidas."
                />
                <DashboardMetricCard
                  label="Taxa de Sucesso"
                  value={`${analytics.successRate || 0}%`}
                  subtitle={`${analytics.completedDeliveries || 0} entregas aprovadas`}
                  icon={Shield}
                  iconColor="text-green-600"
                  tooltip="Percentual de entregas aprovadas sobre o total de entregas finalizadas."
                />
              </div>
              <DashboardPipeline pipeline={analytics.pipeline} funnelData={analytics.funnelData} />
              <DashboardEngagementChart data={analytics.engagementChart} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          {activeTab === 'financials' && <DashboardFinancials />}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {analytics ? (
            <DashboardUserStats analytics={analytics} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Carregando dados de usuários...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {analytics ? (
            <>
              <DashboardDateFilter value={dateRange} onChange={setDateRange} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DashboardMetricCard label="Campanhas Ativas" value={analytics.activeCampaigns || 0} tooltip="Campanhas com status 'ativa' atualmente." />
                <DashboardMetricCard label="Total Candidaturas" value={analytics.totalApplications || 0} tooltip="Número total de candidaturas de creators a campanhas." />
                <DashboardMetricCard label="Novas Candidaturas" value={analytics.newApplications || 0} previousValue={analytics.previousNewUsers} tooltip="Candidaturas recebidas no período selecionado." />
                <DashboardMetricCard label="Cumprimento" value={`${analytics.fulfillmentRate || 0}%`} tooltip="Percentual de entregas feitas sobre candidaturas aceitas." />
              </div>
              <DashboardEngagementChart data={analytics.engagementChart} />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Carregando dados de engajamento...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          {analytics ? (
            <DashboardMarketplace analytics={analytics} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Carregando dados do marketplace...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}