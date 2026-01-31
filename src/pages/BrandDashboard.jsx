import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Megaphone, 
  Users, 
  FileCheck, 
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrandDashboard() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        setBrand(brands[0]);
        
        const [campaignsData, applicationsData, deliveriesData] = await Promise.all([
          base44.entities.Campaign.filter({ brand_id: brands[0].id }, '-created_date', 10),
          base44.entities.Application.filter({ brand_id: brands[0].id, status: 'pending' }, '-created_date', 10),
          base44.entities.Delivery.filter({ brand_id: brands[0].id }, '-created_date', 10)
        ]);
        
        setCampaigns(campaignsData);
        setApplications(applicationsData);
        setDeliveries(deliveriesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const stats = [
    { 
      label: 'Campanhas Ativas', 
      value: campaigns.filter(c => c.status === 'active').length,
      icon: Megaphone,
      color: 'bg-indigo-500'
    },
    { 
      label: 'Candidaturas Pendentes', 
      value: applications.length,
      icon: Users,
      color: 'bg-amber-500'
    },
    { 
      label: 'Entregas Aguardando', 
      value: deliveries.filter(d => d.status === 'submitted').length,
      icon: FileCheck,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Total Concluídas', 
      value: deliveries.filter(d => d.status === 'approved').length,
      icon: TrendingUp,
      color: 'bg-violet-500'
    }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
      under_review: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Pausada', color: 'bg-orange-100 text-orange-700' },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700' }
    };
    const style = styles[status] || styles.draft;
    return <Badge className={`${style.color} border-0`}>{style.label}</Badge>;
  };

  const isExploring = brand?.subscription_status !== 'active';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bem-vindo, {brand?.company_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-600 mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {isExploring 
              ? 'Você está no modo exploração. Assine para criar campanhas.'
              : 'Gerencie suas campanhas e conexões'}
          </p>
        </div>
        
        {isExploring ? (
          <Link to={createPageUrl('Subscription')}>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Agora
            </Button>
          </Link>
        ) : (
          <Link to={createPageUrl('CampaignManager')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </Link>
        )}
      </div>

      {/* Exploring Mode Alert */}
      {isExploring && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Modo Exploração</h3>
                <p className="text-sm text-slate-600">
                  Você pode navegar pela plataforma, mas precisa assinar para criar campanhas e contratar criadores.
                </p>
              </div>
              <Link to={createPageUrl('Subscription')}>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  Ver Planos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Campanhas Recentes</CardTitle>
            <Link to={createPageUrl('CampaignManager')}>
              <Button variant="ghost" size="sm" className="text-indigo-600">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length > 0 ? (
              campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{campaign.title}</h4>
                    <p className="text-sm text-slate-500">
                      {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas preenchidas
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma campanha criada</p>
                {!isExploring && (
                  <Link to={createPageUrl('CampaignManager')}>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Campanha
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Candidaturas Pendentes</CardTitle>
            <Link to={createPageUrl('ApplicationsManager')}>
              <Button variant="ghost" size="sm" className="text-indigo-600">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.length > 0 ? (
              applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">Candidatura #{app.id.slice(-6)}</h4>
                    <p className="text-sm text-slate-500 truncate">
                      {app.message?.slice(0, 50) || 'Sem mensagem'}...
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma candidatura pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Entregas Recentes</CardTitle>
          <Link to={createPageUrl('DeliveriesManager')}>
            <Button variant="ghost" size="sm" className="text-indigo-600">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.slice(0, 5).map((delivery) => {
                const statusConfig = {
                  pending: { label: 'Aguardando', color: 'bg-slate-100 text-slate-700', icon: Clock },
                  submitted: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Eye },
                  approved: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
                  contested: { label: 'Contestada', color: 'bg-red-100 text-red-700', icon: AlertCircle }
                };
                const config = statusConfig[delivery.status] || statusConfig.pending;
                
                return (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900">Entrega #{delivery.id.slice(-6)}</h4>
                      <p className="text-sm text-slate-500">
                        {delivery.submitted_at 
                          ? `Enviada em ${new Date(delivery.submitted_at).toLocaleDateString('pt-BR')}`
                          : `Prazo: ${delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}`
                        }
                      </p>
                    </div>
                    <Badge className={`${config.color} border-0`}>
                      <config.icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}