import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  Megaphone,
  FileText, 
  ArrowRight,
  Loader2,
  Crown,
  Target
} from 'lucide-react';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateCreatorProfile } from '@/components/utils/profileValidation';
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';
import CreatorMetricsChart from '@/components/charts/CreatorMetricsChart';
import CreatorReputationSection from '@/components/creator/CreatorReputationSection';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardMissions from '@/components/dashboard/DashboardMissions';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import { useCreatorDashboardQuery } from '@/components/hooks/useEntityQuery';

export default function CreatorDashboard() {
  const { user, profile: authProfile, profileType } = useAuth();
  const queryClient = useQueryClient();
  const creator = authProfile;
  const profileValidation = authProfile ? validateCreatorProfile(authProfile) : { isComplete: true, missingFields: [] };

  const { data, isLoading } = useCreatorDashboardQuery(creator?.id, user?.id);
  const applications = data?.applications || [];
  const deliveries = data?.deliveries || [];
  const campaignsMap = data?.campaignsMap || {};
  const brandsMap = data?.brandsMap || {};
  const reputation = data?.reputation || null;

  // Realtime: invalidate scoped keys only
  useEffect(() => {
    if (!creator?.id) return;
    const creatorId = creator.id;
    const userId = user?.id;
    const unsubs = [
      base44.entities.Application.subscribe((event) => {
        if (event.data?.creator_id === creatorId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'creator', creatorId] });
          queryClient.invalidateQueries({ queryKey: ['applications', 'creator', creatorId] });
        }
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.creator_id === creatorId || event.type === 'delete') {
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'creator', creatorId] });
          queryClient.invalidateQueries({ queryKey: ['deliveries', 'creator', creatorId] });
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeApplications = applications.filter(a => a.status === 'pending' || a.status === 'accepted');
  const activeDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'submitted');

  const stats = [
    { 
      label: 'Candidaturas Ativas', 
      value: activeApplications.length,
      total: applications.length,
      icon: Target,
      color: 'bg-[#9038fa]'
    },
    { 
      label: 'Trabalhos em Andamento', 
      value: activeDeliveries.length,
      total: deliveries.length,
      icon: FileText,
      color: 'bg-[#b77aff]'
    }
  ];

  const isSubscribed = isProfileSubscribed(creator);
  const isNewUser = activeApplications.length === 0 && deliveries.length === 0;

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Welcome Banner for new users */}
      {isNewUser ? (
        <WelcomeBanner 
          profileType="creator" 
          name={creator?.display_name?.split(' ')[0] || 'Criador'} 
          isSubscribed={isSubscribed} 
        />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Olá, {creator?.display_name?.split(' ')[0]} ✨
            </h1>
            <p className="text-sm mt-1 text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
          <Link to={createPageUrl(isSubscribed ? 'OpportunityFeed' : 'Subscription')}>
            <Button className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm">
              {isSubscribed ? <><Megaphone className="w-4 h-4 mr-2" />Campanhas</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="creator"
        />
      )}

      {/* Onboarding Missions */}
      <DashboardMissions userId={user?.id} profileType="creator" />

      {/* Quick Actions */}
      <QuickActions profileType="creator" isSubscribed={isSubscribed} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} index={index} {...stat} />
        ))}
      </div>

      {/* Metrics Charts */}
      <CreatorMetricsChart applications={applications} deliveries={deliveries} />

      {/* Reputation Section */}
      <CreatorReputationSection reputation={reputation} deliveries={deliveries} />

      {/* My Applications */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Minhas Candidaturas</CardTitle>
          <Link to={createPageUrl('MyApplications')}>
            <Button variant="ghost" size="sm" className="text-primary">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {campaignsMap[app.campaign_id]?.title || `Campanha #${app.campaign_id?.slice(-6)}`}
                    </h4>
                    <p className="text-sm truncate text-muted-foreground">
                      {app.message?.slice(0, 50) || 'Sem mensagem'}
                    </p>
                  </div>
                  <StatusBadge type="application" status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="mb-3 text-muted-foreground">Você ainda não se candidatou a nenhuma campanha</p>
              {isSubscribed && (
                <Link to={createPageUrl('OpportunityFeed')}>
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explorar Campanhas
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Deliveries */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Minhas Entregas</CardTitle>
          <Link to={createPageUrl('MyDeliveries')}>
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
                  className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {campaignsMap[delivery.campaign_id]?.title || `Entrega #${delivery.id.slice(-6)}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {brandsMap[delivery.brand_id]?.company_name || ''}
                      {delivery.submitted_at 
                        ? ` · Enviada em ${new Date(delivery.submitted_at).toLocaleDateString('pt-BR')}`
                        : ` · Prazo: ${delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}`
                      }
                    </p>
                  </div>
                  <StatusBadge type="delivery" status={delivery.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}