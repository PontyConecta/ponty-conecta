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
import MissionTracker from '@/components/MissionTracker';
import RecentAchievements from '@/components/RecentAchievements';
import CreatorReputationSection from '@/components/creator/CreatorReputationSection';

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [applications, setApplications] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
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
        
        const [applicationsData, deliveriesData, reputationData, missionsData, achievementsData] = await Promise.all([
          base44.entities.Application.filter({ creator_id: creators[0].id }, '-created_date', 10),
          base44.entities.Delivery.filter({ creator_id: creators[0].id }, '-created_date', 10),
          base44.entities.Reputation.filter({ user_id: userData.id, profile_type: 'creator' }),
          base44.entities.Mission.filter({ user_id: userData.id }, '-order', 10),
          base44.entities.Achievement.filter({ user_id: userData.id }, '-unlocked_at')
        ]);
        
        setApplications(applicationsData);
        setDeliveries(deliveriesData);
        if (reputationData.length > 0) {
          setReputation(reputationData[0]);
        }
        setMissions(missionsData);
        setAchievements(achievementsData);
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
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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
      color: 'bg-blue-500'
    },
    { 
      label: 'Entregas Aprovadas', 
      value: deliveries.filter(d => d.status === 'approved').length,
      icon: CheckCircle2,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Pontuação', 
      value: reputation?.total_score || 100,
      icon: Award,
      color: 'bg-violet-500',
      suffix: '/100'
    }
  ];

  const isExploring = creator?.subscription_status !== 'active';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bem-vindo, {creator?.display_name?.split(' ')[0]} ✨
          </h1>
          <p className="text-slate-600 mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {isExploring 
              ? 'Você está no modo exploração. Assine para se candidatar.'
              : 'Confira novas oportunidades e suas entregas'}
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
          <Link to={createPageUrl('OpportunityFeed')}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Ver Oportunidades
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="creator"
        />
      )}

      {/* Exploring Mode Alert */}
      {isExploring && profileValidation.isComplete && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Modo Exploração</h3>
                <p className="text-sm text-slate-600">
                  Você pode ver oportunidades, mas precisa assinar para se candidatar e executar trabalhos.
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

      {/* Missões */}
      <MissionTracker missions={missions} />

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
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráficos de Métricas */}
      <CreatorMetricsChart deliveries={deliveries} />

      {/* Reputation Section */}
      <CreatorReputationSection reputation={reputation} deliveries={deliveries} />

      {/* Achievements & Upcoming Deadlines */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentAchievements achievements={achievements} limit={3} />

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries.filter(d => d.status === 'pending' && d.deadline).length > 0 ? (
              <div className="space-y-3">
                {deliveries
                  .filter(d => d.status === 'pending' && d.deadline)
                  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                  .slice(0, 4)
                  .map((delivery) => {
                    const daysLeft = Math.ceil((new Date(delivery.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 3;
                    
                    return (
                      <div
                        key={delivery.id}
                        className={`flex items-center justify-between p-3 rounded-xl ${isUrgent ? 'bg-red-50' : 'bg-slate-50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">
                            Entrega #{delivery.id.slice(-6)}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {new Date(delivery.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge className={`${isUrgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'} border-0`}>
                          {daysLeft <= 0 ? 'Vencido!' : `${daysLeft} dias`}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum prazo pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Minhas Candidaturas</CardTitle>
          <Link to={createPageUrl('MyApplications')}>
            <Button variant="ghost" size="sm" className="text-orange-600">
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
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">Campanha #{app.campaign_id?.slice(-6)}</h4>
                    <p className="text-sm text-slate-500 truncate">
                      {app.message?.slice(0, 50) || 'Sem mensagem'}...
                    </p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-3">Você ainda não se candidatou a nenhuma campanha</p>
              {!isExploring && (
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Minhas Entregas</CardTitle>
          <Link to={createPageUrl('MyDeliveries')}>
            <Button variant="ghost" size="sm" className="text-orange-600">
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
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma entrega registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}