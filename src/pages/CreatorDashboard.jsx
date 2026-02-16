import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  FileText, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Crown,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateCreatorProfile } from '@/components/utils/profileValidation';
import CreatorMetricsChart from '@/components/charts/CreatorMetricsChart';
import CreatorReputationSection from '@/components/creator/CreatorReputationSection';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardMissions from '@/components/dashboard/DashboardMissions';

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        setCreator(creators[0]);
        
        // Validar completude do perfil
        const validation = validateCreatorProfile(creators[0]);
        setProfileValidation(validation);
        
        const [applicationsData, deliveriesData, reputationData] = await Promise.all([
          base44.entities.Application.filter({ creator_id: creators[0].id }, '-created_date', 10),
          base44.entities.Delivery.filter({ creator_id: creators[0].id }, '-created_date', 10),
          base44.entities.Reputation.filter({ user_id: userData.id, profile_type: 'creator' })
        ]);
        
        setApplications(applicationsData);
        setDeliveries(deliveriesData);
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

  const stats = [
    { 
      label: 'Candidaturas Ativas', 
      value: applications.filter(a => a.status === 'pending' || a.status === 'accepted').length,
      icon: Target,
      color: 'bg-orange-500'
    },
    { 
      label: 'Trabalhos em Andamento', 
      value: deliveries.filter(d => d.status === 'pending' || d.status === 'submitted').length,
      icon: FileText,
      color: 'bg-violet-500'
    }
  ];

  const isSubscribed = creator?.subscription_status === 'premium' || creator?.subscription_status === 'legacy';
  const isNewUser = applications.length === 0 && deliveries.length === 0;

  const getStatusBadge = (status) => {
    const styles = {
      pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
      accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
      withdrawn: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700' },
      completed: { label: 'Concluída', color: 'bg-blue-100 text-blue-700' }
    };
    const style = styles[status] || styles.pending;
    return <Badge className={`${style.color} border-0`}>{style.label}</Badge>;
  };

  return (
    <div className="space-y-6">
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
            <Button className={isSubscribed ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gradient-to-r from-orange-500 to-amber-500'}>
              {isSubscribed ? <><Sparkles className="w-4 h-4 mr-2" />Oportunidades</> : <><Crown className="w-4 h-4 mr-2" />Assinar</>}
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
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reputation Section */}
      <CreatorReputationSection reputation={reputation} deliveries={deliveries} />

      {/* My Applications */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
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
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Campanha #{app.campaign_id?.slice(-6)}</h4>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                      {app.message?.slice(0, 50) || 'Sem mensagem'}...
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
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
                    Explorar Oportunidades
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Deliveries */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
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
                    className="flex items-center justify-between p-4 rounded-xl hover:opacity-80 transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Entrega #{delivery.id.slice(-6)}</h4>
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
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--border-color)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}