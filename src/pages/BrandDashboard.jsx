// v3: clean module resolution
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
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
import { useBrandDashboardData } from '@/components/hooks/useDashboardData';

export default function BrandDashboard() {
  const { user, profile: authProfile, profileType } = useAuth();
  const queryClient = useQueryClient();
  const brand = authProfile;
  const profileValidation = authProfile ? validateBrandProfile(authProfile) : { isComplete: true, missingFields: [] };

  const { data, isLoading } = useBrandDashboardData(brand?.id);
  const recentCampaigns = data?.recentCampaigns || [];
  const recentApplications = data?.recentApplications || [];
  const recentDeliveries = data?.recentDeliveries || [];
  const campaignsMap = data?.campaignsMap || {};
  const campaignCounts = data?.campaignCounts || {};
  const appCounts = data?.appCounts || {};
  const delCounts = data?.delCounts || {};
  const totalCampaigns = data?.totalCampaigns || 0;
  const totalApps = data?.totalApps || 0;
  const totalDeliveries = data?.totalDeliveries || 0;

  // Realtime: invalidate scoped keys only
  useEffect(() => {
    if (!brand?.id) return;
    const brandId = brand.id;
    const unsubs = [
      base44.entities.Campaign.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
          queryClient.invalidateQueries({ queryKey: ['deliveries', 'brand', brandId] });
        }
      }),
      base44.entities.Application.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
          queryClient.invalidateQueries({ queryKey: ['applications', 'brand', brandId] });
        }
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
          queryClient.invalidateQueries({ queryKey: ['deliveries', 'brand', brandId] });
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [brand?.id, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCampaignsCount = campaignCounts.active || 0;
  const pendingAppsCount = appCounts.pending || 0;
  const submittedDelCount = delCounts.submitted || 0;
  const approvedDelCount = delCounts.approved || 0;

  const stats = [
    { 
      label: 'Campanhas Ativas', 
      value: activeCampaignsCount,
      total: totalCampaigns,
      icon: Megaphone,
      color: 'bg-[#9038fa]'
    },
    { 
      label: 'Candidaturas Pendentes', 
      value: pendingAppsCount,
      total: totalApps,
      icon: Users,
      color: 'bg-[#b77aff]'
    },
    { 
      label: 'Entregas Aguardando', 
      value: submittedDelCount,
      total: totalDeliveries,
      icon: FileCheck,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Total Concluídas', 
      value: approvedDelCount,
      total: totalDeliveries,
      icon: TrendingUp,
      color: 'bg-[#7a2de0]'
    }
  ];

  const isSubscribed = isProfileSubscribed(brand);
  const isNewUser = totalCampaigns === 0 && pendingAppsCount === 0;

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
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
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
      <CampaignMetricsChart campaignCounts={campaignCounts} appCounts={appCounts} totalCampaigns={totalCampaigns} totalApps={totalApps} campaignsByMonth={data?.campaignsByMonth || []} />

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
            {recentCampaigns.length > 0 ? (
              recentCampaigns.slice(0, 5).map((campaign) => (
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
            {recentApplications.filter(a => a.status === 'pending').length > 0 ? (
              recentApplications.filter(a => a.status === 'pending').slice(0, 5).map((app) => {
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
          {recentDeliveries.length > 0 ? (
            <div className="space-y-3">
              {recentDeliveries.slice(0, 5).map((delivery) => (
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