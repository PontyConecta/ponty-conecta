import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, Megaphone, FileText, ArrowRight, Crown, Target, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TYPE_COPY } from '@/components/utils/creatorTypeConfig';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateCreatorProfile } from '@/components/utils/profileValidation';
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';
import CreatorMetricsChart from '@/components/charts/CreatorMetricsChart';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import CreatorPipeline from '@/components/dashboard/CreatorPipeline';
import CreatorUrgentActions from '@/components/dashboard/CreatorUrgentActions';
import ProfileStrength from '@/components/dashboard/ProfileStrength';
import CampaignsForYou from '@/components/dashboard/CampaignsForYou';
import { useCreatorDashboardData } from '@/components/hooks/useDashboardData';

export default function CreatorDashboard() {
  const { user, profile: authProfile } = useAuth();
  const queryClient = useQueryClient();
  const creator = authProfile;
  const profileValidation = authProfile ? validateCreatorProfile(authProfile) : { isComplete: true, missingFields: [] };

  const { data, isLoading } = useCreatorDashboardData(creator?.id, user?.id);
  const recentApplications = data?.recentApplications || [];
  const recentDeliveries = data?.recentDeliveries || [];
  const campaignsMap = data?.campaignsMap || {};
  const brandsMap = data?.brandsMap || {};
  const appCounts = data?.appCounts || {};
  const delCounts = data?.delCounts || {};
  const totalApps = data?.totalApps || 0;
  const totalDeliveries = data?.totalDeliveries || 0;

  useEffect(() => {
    if (!creator?.id) return;
    const creatorId = creator.id;
    const userId = user?.id;
    const unsubs = [
      base44.entities.Application.subscribe((event) => {
        if (event.data?.creator_id === creatorId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'creator', creatorId] });
        }
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.creator_id === creatorId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'creator', creatorId] });
        }
      }),
      base44.entities.Reputation.subscribe((event) => {
        if (event.data?.user_id === userId) {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'creator', creatorId] });
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [creator?.id, user?.id, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse h-24" />
          ))}
        </div>
        <div className="rounded-2xl bg-muted animate-pulse h-48" />
      </div>
    );
  }

  const isSubscribed = isProfileSubscribed(creator);

  const stats = [
    { label: 'Total Candidaturas', value: totalApps, icon: Target, color: 'bg-primary', href: createPageUrl('MyApplications') },
    { label: 'Aceitas', value: appCounts.accepted || 0, icon: CheckCircle2, color: 'bg-emerald-500', href: createPageUrl('MyApplications') },
    { label: 'Entregas Enviadas', value: (delCounts.submitted || 0) + (delCounts.approved || 0), icon: FileText, color: 'bg-primary/60', href: createPageUrl('MyDeliveries') },
    { label: 'Aprovadas', value: delCounts.approved || 0, icon: Sparkles, color: 'bg-primary/40', href: createPageUrl('MyDeliveries') },
  ];

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {(() => {
            const copy = TYPE_COPY[creator?.creator_type] ?? TYPE_COPY.default;
            return (
              <>
                <h1 className="headline-display text-3xl lg:text-4xl text-foreground">
                  {copy.title}
                </h1>
                <p className="text-sm mt-1 text-muted-foreground">{copy.sub}</p>
              </>
            );
          })()}
        </div>
        <Link to={createPageUrl(isSubscribed ? 'OpportunityFeed' : 'Subscription')}>
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-sm min-h-[44px]">
            {isSubscribed ? <><Megaphone className="w-4 h-4 mr-2" />Campanhas</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
          </Button>
        </Link>
      </div>

      {/* Profile alert */}
      <ProfileIncompleteAlert missingFields={profileValidation.missingFields} profileType="creator" profile={creator} />

      {/* BLOCK 1 — Pipeline */}
      <CreatorPipeline appCounts={appCounts} delCounts={delCounts} totalApps={totalApps} />

      {/* BLOCK 2 — Urgent actions */}
      <CreatorUrgentActions deliveries={recentDeliveries} applications={recentApplications} campaignsMap={campaignsMap} />

      {/* BLOCK 3 — Stats */}
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

      {/* BLOCK 4 — Profile strength */}
      <ProfileStrength profile={creator} />

      {/* BLOCK 5 — Campaigns for you */}
      {isSubscribed && <CampaignsForYou creatorNiches={creator?.niche || []} />}

      {/* BLOCK 6 — Recent activity */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base lg:text-lg font-semibold">Atividade Recente</CardTitle>
          <Link to={createPageUrl('MyApplications')}>
            <Button variant="ghost" size="sm" className="text-primary min-h-[44px]">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentApplications.length > 0 ? (
            <div className="space-y-2">
              {recentApplications.slice(0, 5).map(app => {
                const age = (Date.now() - new Date(app.created_date).getTime()) / (1000 * 60 * 60);
                return (
                  <Link
                    key={app.id}
                    to={createPageUrl('MyApplications') + '?applicationId=' + app.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group min-h-[56px]"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {campaignsMap[app.campaign_id]?.title || `Campanha #${app.campaign_id?.slice(-6)}`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        há {age < 1 ? 'poucos minutos' : age < 24 ? `${Math.floor(age)}h` : `${Math.floor(age / 24)}d`}
                      </p>
                    </div>
                    <StatusBadge type="application" status={app.status} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">Nenhuma candidatura ainda</p>
              {isSubscribed && (
                <Link to={createPageUrl('OpportunityFeed')}>
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    <Sparkles className="w-4 h-4 mr-2" />Explorar Campanhas
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      <CreatorMetricsChart appCounts={appCounts} delCounts={delCounts} totalApps={totalApps} totalDeliveries={totalDeliveries} onTimeRate={data?.onTimeRate ?? 100} />
    </div>
  );
}