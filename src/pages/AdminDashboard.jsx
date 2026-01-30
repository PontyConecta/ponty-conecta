import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Megaphone, 
  FileText, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Building2,
  Star,
  CheckCircle2,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data } = await base44.functions.invoke('adminAnalytics', {});
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Erro ao carregar analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Command Center</h1>
        <p className="text-slate-600">Visão geral da plataforma e métricas em tempo real</p>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Receita Recorrente
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-6">
                <div className="text-sm text-emerald-700 mb-2">MRR (Receita Mensal)</div>
                <div className="text-3xl font-bold text-slate-900">
                  R$ {analytics.revenue.mrr.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {analytics.revenue.activeSubscriptions} assinaturas ativas
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-2">Receita Total Projetada</div>
                <div className="text-3xl font-bold text-slate-900">
                  R$ {analytics.revenue.totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-2">Baseado em assinaturas ativas</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-600 mb-2">ARPU (Receita Média)</div>
                <div className="text-3xl font-bold text-slate-900">
                  R$ {analytics.revenue.arpu}
                </div>
                <div className="text-xs text-slate-500 mt-2">Por usuário ativo</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Atividade de Usuários
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  {analytics.engagement.recentlyActiveUsers}
                </Badge>
              </div>
              <div className="text-sm text-slate-600">Recentemente Ativos</div>
              <div className="text-xs text-slate-500 mt-1">Últimos 30 minutos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <Badge variant="outline">{analytics.engagement.dailyActiveUsers}</Badge>
              </div>
              <div className="text-sm text-slate-600">DAU</div>
              <div className="text-xs text-slate-500 mt-1">Ativos hoje</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-violet-600" />
                <Badge variant="outline">{analytics.engagement.monthlyActiveUsers}</Badge>
              </div>
              <div className="text-sm text-slate-600">MAU</div>
              <div className="text-xs text-slate-500 mt-1">Ativos este mês</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <Badge variant="outline">
                  {analytics.engagement.monthlyActiveUsers > 0 
                    ? ((analytics.engagement.dailyActiveUsers / analytics.engagement.monthlyActiveUsers) * 100).toFixed(0)
                    : 0}%
                </Badge>
              </div>
              <div className="text-sm text-slate-600">DAU/MAU</div>
              <div className="text-xs text-slate-500 mt-1">Índice de engajamento</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Marketplace Health */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Saúde do Marketplace
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-2">Fill Rate</div>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.marketplace.fillRate}%
              </div>
              <div className="text-xs text-slate-500 mt-2">Campanhas com candidaturas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-2">Time to Hire</div>
              <div className="text-3xl font-bold text-slate-900 flex items-baseline gap-1">
                {analytics.marketplace.timeToHireDays}
                <span className="text-base text-slate-500">dias</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Média para aceitar</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-2">Campaign Density</div>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.engagement.campaignDensity}
              </div>
              <div className="text-xs text-slate-500 mt-2">Campanhas por marca ativa</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-slate-600 mb-2">Application Velocity</div>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.engagement.applicationVelocity}
              </div>
              <div className="text-xs text-slate-500 mt-2">Candidaturas por criador</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Growth Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Crescimento
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-600">Marcas</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.today.brands}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-slate-600">Criadores</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.today.creators}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-600">Marcas</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.week.brands}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-slate-600">Criadores</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.week.creators}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-600">Marcas</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.month.brands}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-slate-600">Criadores</span>
                </div>
                <span className="text-2xl font-bold">{analytics.growth.month.creators}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement & Activity */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-violet-600" />
          Engajamento da Plataforma
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Megaphone className="w-5 h-5 text-violet-600" />
                <Badge variant="outline">{analytics.engagement.activeCampaigns}</Badge>
              </div>
              <div className="text-sm text-slate-600">Campanhas Ativas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <Badge variant="outline">{analytics.engagement.totalApplications}</Badge>
              </div>
              <div className="text-sm text-slate-600">Total de Candidaturas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <Badge variant="outline">{analytics.engagement.approvedDeliveries}</Badge>
              </div>
              <div className="text-sm text-slate-600">Entregas Aprovadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {analytics.engagement.disputedDeliveries}
                </Badge>
              </div>
              <div className="text-sm text-slate-600">Em Disputa</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Taxa de Sucesso</div>
                  <div className="text-3xl font-bold text-emerald-600">{analytics.engagement.successRate}%</div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-500 mt-2">Entregas aprovadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Taxa de Disputas</div>
                  <div className="text-3xl font-bold text-red-600">{analytics.engagement.disputeRate}%</div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-xs text-slate-500 mt-2">Entregas em disputa</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Distribution */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          Distribuição de Usuários
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Marcas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total</span>
                  <span className="text-2xl font-bold">{analytics.users.brands.total}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Ativas (Assinantes)</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {analytics.users.brands.active}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Explorando</span>
                  <Badge variant="outline">{analytics.users.brands.exploring}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-600" />
                Criadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total</span>
                  <span className="text-2xl font-bold">{analytics.users.creators.total}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Ativos (Assinantes)</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {analytics.users.creators.active}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Explorando</span>
                  <Badge variant="outline">{analytics.users.creators.exploring}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link to={createPageUrl('AdminUsers')}>
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Gerenciar Usuários
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link to={createPageUrl('AdminCampaigns')}>
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Ver Campanhas
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link to={createPageUrl('AdminDisputes')}>
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Resolver Disputas
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link to={createPageUrl('AdminAuditLogs')}>
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Logs de Auditoria
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}