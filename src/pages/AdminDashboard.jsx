import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Users, TrendingUp, Activity, RefreshCw, Shield, UserX, Ghost, Crown, Scale, Megaphone, Clock, CheckCircle, BarChart3, FolderOpen, FolderCheck } from 'lucide-react';
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

  // Map v1 dateRange keys to v2 range values
  const rangeMap = { day: '7d', week: '7d', month: '30d', year: '90d' };

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setAnalyticsError(false);
      const v2Range = typeof dateRange === 'string' ? (rangeMap[dateRange] || '30d') : '30d';
      const response = await base44.functions.invoke('adminAnalyticsV2', { mode: 'summary', range: v2Range });
      if (response.data?.error) throw new Error(response.data.error);
      setAnalytics(response.data);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error loading v2 analytics, falling back to v1:', error);
      try {
        const fallback = await base44.functions.invoke('adminAnalytics', { dateRange });
        if (fallback.data?.error) throw new Error(fallback.data.error);
        setAnalytics(fallback.data);
        setLastRefresh(new Date());

        toast.warning('Usando dados do analytics v1 (fallback)');
      } catch (err2) {
        console.error('V1 fallback also failed:', err2);
        setAnalyticsError(true);
        toast.error('Erro ao carregar analytics');
      }
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
    <div className="space-y-6">
      {/* Admin Navigation Header */}
      <AdminHeader currentPageName="AdminDashboard" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Dashboards</h1>
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

        <TabsContent value="overview" className="space-y-4">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
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
              {/* ── Saúde da Plataforma ── */}
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Saúde da Plataforma</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <DashboardMetricCard
                    label="Usuários Inativos"
                    value={analytics.users?.dormant ?? 0}
                    icon={UserX}
                    iconColor="text-orange-500"
                    tooltip="Usuários inativos há mais de 30 dias."
                    secondaryLabel={`de ${analytics.totalUsers || 0} total`}
                  />
                  <DashboardMetricCard
                    label="Nunca Ativos"
                    value={analytics.users?.never_active ?? 0}
                    icon={Ghost}
                    iconColor="text-zinc-400"
                    tooltip="Usuários que nunca registraram atividade."
                    secondaryLabel={analytics.totalUsers ? `${Math.round(((analytics.users?.never_active ?? 0) / analytics.totalUsers) * 100)}% da base` : undefined}
                  />
                  <DashboardMetricCard
                    label="Premium Inativos"
                    value={analytics.alerts?.dormant_premium_users ?? 0}
                    icon={Crown}
                    iconColor="text-amber-500"
                    tooltip="Usuários premium inativos há mais de 30 dias."
                  />
                  <DashboardMetricCard
                    label="Disputas Abertas"
                    value={analytics.alerts?.open_disputes ?? 0}
                    icon={Scale}
                    iconColor="text-red-500"
                    tooltip="Disputas abertas ou em análise."
                  />
                </div>
              </div>

              {/* ── Operações do Marketplace ── */}
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Operações do Marketplace</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <DashboardMetricCard
                    label="Campanhas Ativas"
                    value={analytics.marketplace?.active_campaigns ?? analytics.activeCampaigns ?? 0}
                    icon={Megaphone}
                    iconColor="text-blue-500"
                    tooltip="Campanhas com status 'ativa' atualmente."
                    secondaryLabel={`Total: ${analytics.marketplace?.total_campaigns ?? 0}`}
                  />
                  <DashboardMetricCard
                    label="Total de Campanhas"
                    value={analytics.marketplace?.total_campaigns ?? 0}
                    icon={FolderOpen}
                    iconColor="text-indigo-500"
                    tooltip="Total de campanhas criadas na plataforma."
                  />
                  <DashboardMetricCard
                    label="Campanhas Concluídas"
                    value={analytics.pipeline?.completed ?? 0}
                    icon={FolderCheck}
                    iconColor="text-emerald-500"
                    tooltip="Campanhas finalizadas com sucesso."
                    secondaryLabel={(analytics.marketplace?.total_campaigns ?? 0) > 0 ? `${Math.round(((analytics.pipeline?.completed ?? 0) / (analytics.marketplace?.total_campaigns ?? 1)) * 100)}% do total` : undefined}
                  />
                </div>
              </div>

              <DashboardPipeline pipeline={analytics.pipeline} funnelData={analytics.funnelData} />

              {/* ── Alertas do Marketplace ── */}
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Alertas do Marketplace</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <DashboardMetricCard
                    label="Sem Candidaturas"
                    value={analytics.alerts?.campaigns_zero_apps ?? 0}
                    icon={AlertCircle}
                    iconColor="text-yellow-500"
                    tooltip="Campanhas ativas sem nenhuma candidatura."
                    secondaryLabel={`de ${analytics.marketplace?.active_campaigns ?? 0} ativas`}
                  />
                  <DashboardMetricCard
                    label="Candidaturas Pendentes"
                    value={analytics.alerts?.pending_applications ?? 0}
                    icon={Clock}
                    iconColor="text-orange-500"
                    tooltip="Candidaturas aguardando resposta da marca."
                    secondaryLabel={analytics.totalApplications ? `Taxa aprovação: ${analytics.conversionRate || 0}%` : undefined}
                  />
                  <DashboardMetricCard
                    label="Entregas Aguardando"
                    value={analytics.alerts?.submitted_deliveries_awaiting_review ?? 0}
                    icon={CheckCircle}
                    iconColor="text-cyan-500"
                    tooltip="Entregas submetidas aguardando aprovação."
                    secondaryLabel={analytics.completedDeliveries ? `${analytics.completedDeliveries} já aprovadas` : undefined}
                  />
                </div>
              </div>

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