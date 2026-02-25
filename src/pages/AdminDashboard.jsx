import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, Users, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

import DashboardMetricCard from '../components/admin/DashboardMetricCard';
import DashboardUserStats from '../components/admin/DashboardUserStats';
import DashboardRevenueChart from '../components/admin/DashboardRevenueChart';
import DashboardEngagementChart from '../components/admin/DashboardEngagementChart';
import DashboardMarketplace from '../components/admin/DashboardMarketplace';

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
      const interval = setInterval(loadAnalytics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('adminAnalytics', { dateRange });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setAnalytics(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'day', label: 'Diário' },
          { key: 'week', label: 'Semana' },
          { key: 'month', label: 'Mês' },
          { key: 'year', label: 'Ano' },
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
          {/* Main Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardMetricCard
              label="MRR"
              value={`R$ ${(analytics.mrr || 0).toLocaleString('pt-BR')}`}
              icon={DollarSign}
              iconColor="text-green-600"
            />
            <DashboardMetricCard
              label="Total Usuários"
              value={analytics.totalUsers || 0}
              subtitle={`${analytics.activeUsers || 0} ativos`}
              icon={Users}
              iconColor="text-blue-600"
            />
            <DashboardMetricCard
              label="Taxa de Sucesso"
              value={`${analytics.successRate || 0}%`}
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
            <DashboardMetricCard
              label="ARPU"
              value={`R$ ${(analytics.arpu || 0).toFixed(2)}`}
              icon={Activity}
              iconColor="text-orange-600"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="engagement">Engajamento</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardRevenueChart data={analytics.revenueChart} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardMetricCard label="Assinantes Ativos" value={analytics.activeSubscribers || 0} />
                <DashboardMetricCard label="Novos Usuários" value={analytics.newUsers || 0} />
                <DashboardMetricCard label="Churn Rate" value={`${analytics.churnRate || 0}%`} />
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <DashboardUserStats analytics={analytics} />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardMetricCard label="Campanhas Ativas" value={analytics.activeCampaigns || 0} />
                <DashboardMetricCard label="Aplicações" value={analytics.totalApplications || 0} />
                <DashboardMetricCard label="Taxa de Conversão" value={`${analytics.conversionRate || 0}%`} />
              </div>
              <DashboardEngagementChart data={analytics.engagementChart} />
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