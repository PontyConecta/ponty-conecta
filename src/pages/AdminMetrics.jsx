import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

import AdminHeader from '../components/admin/AdminHeader';
import MetricsCards from '../components/admin/MetricsCards';
import FunnelChart from '../components/admin/FunnelChart';
import OperationalLists from '../components/admin/OperationalLists';

export default function AdminMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, funnelRes] = await Promise.all([
        base44.functions.invoke('adminMetrics', { query_type: 'metric_cards', days: parseInt(days) }),
        base44.functions.invoke('adminMetrics', { query_type: 'funnel', days: parseInt(days) }),
      ]);
      setMetrics(metricsRes.data);
      setFunnel(funnelRes.data?.funnel);
    } catch (e) {
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader currentPageName="AdminMetrics" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Métricas & Eventos</h1>
          <p className="text-xs text-muted-foreground mt-1">Métricas baseadas em eventos do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 p-1 bg-muted">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Funil
          </TabsTrigger>
          <TabsTrigger value="operational" className="text-xs">
            <List className="w-3.5 h-3.5 mr-1" />
            Operacional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : (
            <MetricsCards data={metrics} />
          )}
        </TabsContent>

        <TabsContent value="funnel">
          {loading ? (
            <Skeleton className="h-72" />
          ) : (
            <FunnelChart funnel={funnel} />
          )}
        </TabsContent>

        <TabsContent value="operational">
          <OperationalLists />
        </TabsContent>
      </Tabs>
    </div>
  );
}