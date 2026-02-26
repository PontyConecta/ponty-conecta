import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Megaphone, 
  Users, 
  FileCheck, 
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
  Crown
} from 'lucide-react';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateBrandProfile } from '@/components/utils/profileValidation';
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';
import CampaignMetricsChart from '@/components/charts/CampaignMetricsChart';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardMissions from '@/components/dashboard/DashboardMissions';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/common/StatusBadge';


export default function BrandDashboard() {
  const { user, profile: authProfile, profileType } = useAuth();
  const [brand, setBrand] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });
  const [campaignsMap, setCampaignsMap] = useState({});

  useEffect(() => {
    if (authProfile && profileType === 'brand') {
      setBrand(authProfile);
      setProfileValidation(validateBrandProfile(authProfile));
      loadPageData(authProfile);
    }
  }, [authProfile, profileType]);

  useEffect(() => {
    if (!brand?.id) return;
    const unsubs = [
      base44.entities.Campaign.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadPageData(brand);
      }),
      base44.entities.Application.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadPageData(brand);
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.brand_id === brand.id || event.type === 'delete') loadPageData(brand);
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [brand?.id]);

  const loadPageData = async (brandProfile) => {
    try {
      const [campaignsData, allApplicationsData, allDeliveriesData] = await Promise.all([
        base44.entities.Campaign.filter({ brand_id: brandProfile.id }, '-created_date'),
        base44.entities.Application.filter({ brand_id: brandProfile.id }, '-created_date'),
        base44.entities.Delivery.filter({ brand_id: brandProfile.id }, '-created_date')
      ]);
      setCampaigns(campaignsData);
      setApplications(allApplicationsData);
      setDeliveries(allDeliveriesData);
      const cMap = {};
      campaignsData.forEach(c => { cMap[c.id] = c; });
      setCampaignsMap(cMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const isSubscribed = isProfileSubscribed(brand);
  const isNewUser = campaigns.length === 0 && pendingApplications.length === 0;

  return (
    <div className="space-y-5 lg:space-y-6">
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
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Olá, {brand?.company_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm mt-1 text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
          <Link to={createPageUrl(isSubscribed ? 'CampaignManager' : 'Subscription')}>
            <Button className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm">
              {isSubscribed ? <><Plus className="w-4 h-4 mr-2" />Nova Campanha</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="brand"
        />
      )}

      {/* Onboarding Missions */}
      <DashboardMissions userId={user?.id} profileType="brand" />

      {/* Quick Actions */}
      <QuickActions profileType="brand" isSubscribed={isSubscribed} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} index={index} {...stat} />
        ))}
      </div>

      {/* Gráficos de Métricas */}
      <CampaignMetricsChart campaigns={campaigns} applications={applications} />

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Campaigns */}
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Campanhas Recentes</CardTitle>
            <Link to={createPageUrl('CampaignManager')}>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length > 0 ? (
              campaigns.slice(0, 5).map((campaign) => (
                <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-xl transition-colors bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{campaign.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas preenchidas
                    </p>
                  </div>
                  <StatusBadge type="campaign" status={campaign.status} />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma campanha criada</p>
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
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Candidaturas Pendentes</CardTitle>
            <Link to={createPageUrl('ApplicationsManager')}>
                  <Button variant="ghost" size="sm" className="text-primary">
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
                    className="flex items-center justify-between p-3 rounded-xl transition-colors bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {campaign?.title || `Candidatura #${app.id.slice(-6)}`}
                      </h4>
                      <p className="text-sm truncate text-muted-foreground">
                        {app.message?.slice(0, 50) || 'Sem mensagem'}
                      </p>
                    </div>
                    <StatusBadge type="application" status={app.status} />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma candidatura pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Entregas de Criadores</CardTitle>
          <Link to={createPageUrl('DeliveriesManager')}>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.slice(0, 5).map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-colors bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {campaignsMap[delivery.campaign_id]?.title || `Entrega #${delivery.id.slice(-6)}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {delivery.submitted_at 
                        ? `Enviada em ${new Date(delivery.submitted_at).toLocaleDateString('pt-BR')}`
                        : `Prazo: ${delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}`
                      }
                    </p>
                  </div>
                  <StatusBadge type="delivery" status={delivery.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}