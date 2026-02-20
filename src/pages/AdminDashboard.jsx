import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Users, DollarSign, Activity, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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

      const response = await base44.functions.invoke('adminAnalytics', {
        dateRange
      });

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
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard de Admin</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
            Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={loadAnalytics}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 flex-wrap">
        {['day', 'week', 'month', 'year', 'custom'].map(range => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            onClick={() => setDateRange(range)}
            size="sm"
          >
            {range === 'day' ? 'Diário' : range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : range === 'year' ? 'Ano' : 'Personalizado'}
          </Button>
        ))}
      </div>

      {/* Main Metrics */}
      {analytics && (
        <>
          <div className="grid md:grid-cols-4 gap-6">
            <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>MRR</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      R$ {analytics.mrr?.toLocaleString('pt-BR') || '0'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Usuários</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.totalUsers || 0}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {analytics.activeUsers || 0} ativos
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Taxa de Sucesso</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.successRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>ARPU</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      R$ {analytics.arpu?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="engagement">Engajamento</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.revenueChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Receita (R$)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Assinantes Ativos</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.activeSubscribers || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Novos Usuários</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.newUsers || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Churn Rate</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analytics.churnRate || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Total de Usuários</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.totalUsers || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Marcas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.totalBrands || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Criadores</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.totalCreators || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.userGrowthChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="brands" fill="#3b82f6" name="Marcas" />
                      <Bar dataKey="creators" fill="#8b5cf6" name="Criadores" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Campanhas Ativas</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.activeCampaigns || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Aplicações</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.totalApplications || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Taxa de Conversão</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.conversionRate || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Engajamento por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.engagementChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="applications" stroke="#3b82f6" name="Candidaturas" />
                      <Line type="monotone" dataKey="deliveries" stroke="#10b981" name="Entregas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Entregas Completas</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.completedDeliveries || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Disputas Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.pendingDisputes || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Valor Total Transacionado</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      R$ {analytics.totalTransactionValue?.toLocaleString('pt-BR') || '0'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(analytics.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}