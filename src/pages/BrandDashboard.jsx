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
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateBrandProfile } from '@/components/utils/profileValidation';
import CampaignMetricsChart from '@/components/charts/CampaignMetricsChart';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardMissions from '@/components/dashboard/DashboardMissions';


export default function BrandDashboard() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });
  const [campaignsMap, setCampaignsMap] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!brand?.id) return;
    const unsubs = [
      base44.entities.Campaign.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadData();
      }),
      base44.entities.Application.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadData();
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadData();
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [brand?.id]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        setBrand(brands[0]);
        
        // Validar completude do perfil
        const validation = validateBrandProfile(brands[0]);
        setProfileValidation(validation);
        
        // Load ALL data for accurate metrics
        const [campaignsData, allApplicationsData, allDeliveriesData] = await Promise.all([
          base44.entities.Campaign.filter({ brand_id: brands[0].id }, '-created_date'),
          base44.entities.Application.filter({ brand_id: brands[0].id }, '-created_date'),
          base44.entities.Delivery.filter({ brand_id: brands[0].id }, '-created_date')
        ]);
        
        setCampaigns(campaignsData);
        setApplications(allApplicationsData);
        setDeliveries(allDeliveriesData);

        // Build campaigns map for deliveries
        const cMap = {};
        campaignsData.forEach(c => { cMap[c.id] = c; });
        setCampaignsMap(cMap);
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.status === 'pending');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const submittedDeliveries = deliveries.filter(d => d.status === 'submitted');
  const approvedDeliveries = deliveries.filter(d => d.status === 'approved');

  const stats = [
    { 
      label: 'Campanhas Ativas', 
      value: activeCampaigns.length,
      total: campaigns.length,
      icon: Megaphone,
      color: 'bg-[#9038fa]'
    },
    { 
      label: 'Candidaturas Pendentes', 
      value: pendingApplications.length,
      total: applications.length,
      icon: Users,
      color: 'bg-[#b77aff]'
    },
    { 
      label: 'Entregas Aguardando', 
      value: submittedDeliveries.length,
      total: deliveries.length,
      icon: FileCheck,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Total Concluídas', 
      value: approvedDeliveries.length,
      total: deliveries.length,
      icon: TrendingUp,
      color: 'bg-[#7a2de0]'
    }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
      under_review: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Pausada', color: 'bg-purple-100 text-purple-700' },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700' }
    };
    const style = styles[status] || styles.draft;
    return <Badge className={`${style.color} border-0`}>{style.label}</Badge>;
  };

  const isSubscribed = brand?.subscription_status === 'premium' || brand?.subscription_status === 'legacy' || (brand?.subscription_status === 'trial' && brand?.trial_end_date && new Date(brand.trial_end_date) > new Date());
  const isNewUser = campaigns.length === 0 && pendingApplications.length === 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Banner for new users */}
      {isNewUser ? (
        <WelcomeBanner 
          profileType="brand" 
          name={brand?.company_name?.split(' ')[0] || 'Marca'} 
          isSubscribed={isSubscribed} 
        />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Olá, {brand?.company_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
          <Link to={createPageUrl(isSubscribed ? 'CampaignManager' : 'Subscription')}>
            <Button className={isSubscribed ? 'bg-[#9038fa] hover:bg-[#7a2de0]' : 'bg-gradient-to-r from-[#9038fa] to-[#b77aff]'}>
              {isSubscribed ? <><Plus className="w-4 h-4 mr-2" />Nova Campanha</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions profileType="brand" isSubscribed={isSubscribed} />

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="brand"
        />
      )}

      {/* Onboarding Missions */}
      <DashboardMissions userId={user?.id} profileType="brand" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <CardContent className="p-4 lg:p-6">
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                  <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                  {stat.total > 0 && stat.total !== stat.value && (
                    <div className="text-[10px] lg:text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>de {stat.total} no total</div>
                  )}
                </CardContent>
              </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráficos de Métricas */}
      <CampaignMetricsChart campaigns={campaigns} applications={applications} />

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Campaigns */}
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Campanhas Recentes</CardTitle>
            <Link to={createPageUrl('CampaignManager')}>
              <Button variant="ghost" size="sm" style={{ color: 'var(--accent-primary)' }}>
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length > 0 ? (
              campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{campaign.title}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas preenchidas
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma campanha criada</p>
                {isSubscribed && (
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
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Candidaturas Pendentes</CardTitle>
            <Link to={createPageUrl('ApplicationsManager')}>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--accent-primary)' }}>
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApplications.length > 0 ? (
              pendingApplications.slice(0, 5).map((app) => {
                const campaign = campaignsMap[app.campaign_id];
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {campaign?.title || `Candidatura #${app.id.slice(-6)}`}
                      </h4>
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {app.message?.slice(0, 50) || 'Sem mensagem'}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma candidatura pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Entregas Recentes</CardTitle>
          <Link to={createPageUrl('DeliveriesManager')}>
            <Button variant="ghost" size="sm" style={{ color: 'var(--accent-primary)' }}>
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
                    className="flex items-center justify-between p-4 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {campaignsMap[delivery.campaign_id]?.title || `Entrega #${delivery.id.slice(-6)}`}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              <FileCheck className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}