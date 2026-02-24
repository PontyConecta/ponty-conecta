import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
import CreatorMetricsChart from '@/components/charts/CreatorMetricsChart';
import CreatorReputationSection from '@/components/creator/CreatorReputationSection';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardMissions from '@/components/dashboard/DashboardMissions';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/common/StatusBadge';

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });
  const [campaignsMap, setCampaignsMap] = useState({});
  const [brandsMap, setBrandsMap] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!creator?.id) return;
    const unsubs = [
      base44.entities.Application.subscribe((event) => {
        if (event.data?.creator_id === creator.id || event.type === 'delete') loadData();
      }),
      base44.entities.Delivery.subscribe((event) => {
        if (event.data?.creator_id === creator.id || event.type === 'delete') loadData();
      }),
      base44.entities.Reputation.subscribe((event) => {
        if (event.data?.user_id === user?.id) loadData();
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [creator?.id, user?.id]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        setCreator(creators[0]);
        
        const validation = validateCreatorProfile(creators[0]);
        setProfileValidation(validation);
        
        const [applicationsData, deliveriesData, reputationData] = await Promise.all([
          base44.entities.Application.filter({ creator_id: creators[0].id }, '-created_date'),
          base44.entities.Delivery.filter({ creator_id: creators[0].id }, '-created_date'),
          base44.entities.Reputation.filter({ user_id: userData.id, profile_type: 'creator' })
        ]);
        
        setApplications(applicationsData);
        setDeliveries(deliveriesData);

        // Load campaigns and brands for deliveries and applications
        const campaignIds = [...new Set(deliveriesData.map(d => d.campaign_id).filter(Boolean))];
        const brandIds = [...new Set(deliveriesData.map(d => d.brand_id).filter(Boolean))];
        const appCampaignIds = [...new Set(applicationsData.map(a => a.campaign_id).filter(Boolean))];
        const allCampaignIds = [...new Set([...campaignIds, ...appCampaignIds])];

        const [campaignsData, brandsData] = await Promise.all([
          allCampaignIds.length > 0 ? Promise.all(allCampaignIds.map(id => base44.entities.Campaign.filter({ id }))) : Promise.resolve([]),
          brandIds.length > 0 ? Promise.all(brandIds.map(id => base44.entities.Brand.filter({ id }))) : Promise.resolve([])
        ]);
        const cMap = {};
        campaignsData.flat().forEach(c => { cMap[c.id] = c; });
        setCampaignsMap(cMap);
        const bMap = {};
        brandsData.flat().forEach(b => { bMap[b.id] = b; });
        setBrandsMap(bMap);

        if (reputationData.length > 0) {
          setReputation(reputationData[0]);
        }
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

  const isSubscribed = creator?.subscription_status === 'premium' || creator?.subscription_status === 'legacy' || (creator?.subscription_status === 'trial' && creator?.trial_end_date && new Date(creator.trial_end_date) > new Date());
  const isNewUser = activeApplications.length === 0 && deliveries.length === 0;

  return (
    <div className="space-y-4 lg:space-y-6">
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
            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Olá, {creator?.display_name?.split(' ')[0]} ✨
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>
          </div>
          <Link to={createPageUrl(isSubscribed ? 'OpportunityFeed' : 'Subscription')}>
            <Button className={isSubscribed ? 'bg-[#9038fa] hover:bg-[#7a2de0]' : 'bg-gradient-to-r from-[#9038fa] to-[#b77aff]'}>
              {isSubscribed ? <><Megaphone className="w-4 h-4 mr-2" />Campanhas</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions profileType="creator" isSubscribed={isSubscribed} />

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="creator"
        />
      )}

      {/* Onboarding Missions */}
      <DashboardMissions userId={user?.id} profileType="creator" />

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
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Minhas Candidaturas</CardTitle>
          <Link to={createPageUrl('MyApplications')}>
            <Button variant="ghost" size="sm" style={{ color: 'var(--accent-primary)' }}>
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
                  className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {campaignsMap[app.campaign_id]?.title || `Campanha #${app.campaign_id?.slice(-6)}`}
                    </h4>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {app.message?.slice(0, 50) || 'Sem mensagem'}
                    </p>
                  </div>
                  <StatusBadge type="application" status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Você ainda não se candidatou a nenhuma campanha</p>
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
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Minhas Entregas</CardTitle>
          <Link to={createPageUrl('MyDeliveries')}>
            <Button variant="ghost" size="sm" style={{ color: 'var(--accent-primary)' }}>
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
                  className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {campaignsMap[delivery.campaign_id]?.title || `Entrega #${delivery.id.slice(-6)}`}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}