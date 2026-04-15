import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Megaphone, Users, FileCheck, TrendingUp, Plus, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateBrandProfile } from '@/components/utils/profileValidation';

import { useAuth } from '@/components/contexts/AuthContext';
import CampaignMetricsChart from '@/components/charts/CampaignMetricsChart';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import CampaignSlotProgress from '@/components/dashboard/CampaignSlotProgress';
import AttentionBlock from '@/components/dashboard/AttentionBlock';
import { useBrandDashboardData } from '@/components/hooks/useDashboardData';

export default function BrandDashboard() {
  const { user, profile: authProfile } = useAuth();
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

  useEffect(() => {
    if (!brand?.id) return;
    const brandId = brand.id;
    const unsubs = [
      base44.entities.Campaign.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
        }
      }),
      base44.entities.Application.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
        }
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.brand_id === brandId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'brand', brandId] });
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [brand?.id, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-muted animate-pulse h-64" />
          <div className="rounded-2xl bg-muted animate-pulse h-64" />
        </div>
      </div>
    );
  }

  const activeCampaignsCount = campaignCounts.active || 0;
  const pendingAppsCount = appCounts.pending || 0;
  const submittedDelCount = delCounts.submitted || 0;
  const approvedDelCount = delCounts.approved || 0;
  const stats = [
    { label: 'Campanhas Ativas', value: activeCampaignsCount, total: totalCampaigns, icon: Megaphone, color: 'bg-primary', href: createPageUrl('CampaignManager') },
    { label: 'Candidaturas Pendentes', value: pendingAppsCount, total: totalApps, icon: Users, color: 'bg-primary/60', href: createPageUrl('ApplicationsManager') },
    { label: 'Entregas Aguardando', value: submittedDelCount, total: totalDeliveries, icon: FileCheck, color: 'bg-emerald-500', href: createPageUrl('DeliveriesManager') },
    { label: 'Total Aprovadas', value: approvedDelCount, total: totalDeliveries, icon: TrendingUp, color: 'bg-primary/40', href: createPageUrl('DeliveriesManager') },
  ];

  const pendingApplications = recentApplications.filter(a => a.status === 'pending');

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="headline-display text-3xl lg:text-4xl text-foreground">
            Olá, {brand?.company_name?.split(' ')[0] || 'Marca'} 👋
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>
        <Link to={createPageUrl('CampaignManager')}>
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Profile alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert missingFields={profileValidation.missingFields} profileType="brand" />
      )}

      {/* BLOCK 1 — Attention */}
      <AttentionBlock
        deliveries={recentDeliveries}
        applications={recentApplications}
        campaigns={recentCampaigns}
        campaignsMap={campaignsMap}
      />

      {/* BLOCK 2 — Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {stats.map((stat, i) => (
          <motion.div key={i} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
            <StatCard index={i} {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* BLOCK 3 — Split grid */}
      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Campaigns */}
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base lg:text-lg font-semibold">Campanhas Recentes</CardTitle>
            <Link to={createPageUrl('CampaignManager')}>
              <Button variant="ghost" size="sm" className="text-primary min-h-[44px]">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentCampaigns.length > 0 ? (
              recentCampaigns.slice(0, 5).map(c => (
                <Link
                  key={c.id}
                  to={createPageUrl('CampaignManager') + '?campaignId=' + c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group min-h-[56px]"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{c.title}</h4>
                    <CampaignSlotProgress filled={c.slots_filled || 0} total={c.slots_total || 1} />
                  </div>
                  <StatusBadge type="campaign" status={c.status} />
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <Megaphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">Nenhuma campanha criada</p>
                <Link to={createPageUrl('CampaignManager')}>
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" />Criar Primeira Campanha
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base lg:text-lg font-semibold">Candidaturas Pendentes</CardTitle>
            <Link to={createPageUrl('ApplicationsManager')}>
              <Button variant="ghost" size="sm" className="text-primary min-h-[44px]">
                Ver todas <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingApplications.length > 0 ? (
              pendingApplications.slice(0, 5).map(app => {
                const campaign = campaignsMap[app.campaign_id];
                const age = (Date.now() - new Date(app.created_date).getTime()) / (1000 * 60 * 60);
                const isUrgent = age > 48;
                return (
                  <Link
                    key={app.id}
                    to={createPageUrl('ApplicationsManager') + '?applicationId=' + app.id}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group min-h-[56px] ${isUrgent ? 'border-l-2 border-l-amber-400' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {campaign?.title || `Candidatura #${app.id.slice(-6)}`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        há {age < 1 ? 'poucos minutos' : age < 24 ? `${Math.floor(age)}h` : `${Math.floor(age / 24)}d`}
                      </p>
                    </div>
                    <StatusBadge type="application" status={app.status} />
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Nenhuma candidatura pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BLOCK 4 — Metrics */}
      <CampaignMetricsChart campaignCounts={campaignCounts} appCounts={appCounts} totalCampaigns={totalCampaigns} totalApps={totalApps} campaignsByMonth={data?.campaignsByMonth || []} />

      {/* BLOCK 5 — Recent Deliveries */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base lg:text-lg font-semibold">Entregas Recentes</CardTitle>
          <Link to={createPageUrl('DeliveriesManager')}>
            <Button variant="ghost" size="sm" className="text-primary min-h-[44px]">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentDeliveries.length > 0 ? (
            <div className="space-y-2">
              {recentDeliveries.slice(0, 5).map(d => (
                <Link
                  key={d.id}
                  to={createPageUrl('DeliveriesManager') + '?deliveryId=' + d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group min-h-[56px]"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {campaignsMap[d.campaign_id]?.title || `Entrega #${d.id.slice(-6)}`}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {d.submitted_at
                        ? `Enviada em ${new Date(d.submitted_at).toLocaleDateString('pt-BR')}`
                        : `Prazo: ${d.deadline ? new Date(d.deadline).toLocaleDateString('pt-BR') : '-'}`}
                    </p>
                  </div>
                  <StatusBadge type="delivery" status={d.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOCK 6 — Discover Creators teaser */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Descobrir Creators</p>
            <p className="text-xs text-muted-foreground">Encontre os melhores criadores para sua marca</p>
          </div>
          <Link to={createPageUrl('DiscoverCreators')}>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}