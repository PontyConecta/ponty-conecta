import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CreatorCard from '@/components/CreatorCard';
import PaywallModal from '@/components/PaywallModal';
import { 
  ArrowRight, 
  Shield, 
  FileCheck, 
  Scale, 
  Users, 
  Megaphone,
  CheckCircle2,
  Star,
  Zap,
  Lock,
  TrendingUp,
  Sparkles,
  Building2,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuth(authenticated);

      // Load sample public data for guest experience
      const [campaigns, creators] = await Promise.all([
        base44.entities.Campaign.filter({ status: 'active' }, '-created_date', 3),
        base44.entities.Creator.filter({ account_state: 'active' }, '-created_date', 4)
      ]);
      
      setFeaturedCampaigns(campaigns);
      setFeaturedCreators(creators);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (isAuth) {
      window.location.href = createPageUrl('SelectProfile');
    } else {
      base44.auth.redirectToLogin(createPageUrl('SelectProfile'));
    }
  };

  const handleProtectedAction = (feature) => {
    setPaywallFeature(feature);
    setShowPaywall(true);
  };

  const stats = [
    { value: '500+', label: 'Marcas Ativas' },
    { value: '2.500+', label: 'Criadores' },
    { value: '98%', label: 'Satisfação' },
    { value: '24h', label: 'Tempo de Resolução' }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold text-lg lg:text-xl">P</span>
              </div>
              <span className="text-xl lg:text-2xl font-semibold text-slate-900">Ponty</span>
              <Badge variant="outline" className="ml-2 text-xs font-normal hidden sm:inline-flex">Conecta</Badge>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              {!loading && (
                isAuth ? (
                  <Button onClick={handleGetStarted} className="bg-indigo-600 hover:bg-indigo-700 h-9 lg:h-10 text-sm lg:text-base">
                    Acessar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => base44.auth.redirectToLogin()} className="h-9 text-sm">
                      Entrar
                    </Button>
                    <Button onClick={handleGetStarted} className="bg-indigo-600 hover:bg-indigo-700 h-9 lg:h-10 text-sm lg:text-base">
                      <span className="hidden sm:inline">Começar</span>
                      <span className="sm:hidden">Criar</span>
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-12 lg:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-indigo-100 text-indigo-700 border-0 px-3 lg:px-4 py-1 lg:py-1.5 text-xs lg:text-sm font-medium mb-4 lg:mb-6">
                <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Mediação Profissional
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight mb-4 lg:mb-6">
                Conexões que
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  geram resultados
                </span>
              </h1>
              
              <p className="text-base lg:text-xl text-slate-600 mb-6 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                A plataforma que garante regras claras, prazos cumpridos e resolução justa entre marcas e criadores.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center px-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-base lg:text-lg h-12 lg:h-14 px-6 lg:px-8 shadow-xl shadow-indigo-500/25"
                >
                  <Megaphone className="w-5 h-5 mr-2" />
                  Sou uma Marca
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleGetStarted}
                  className="text-base lg:text-lg h-12 lg:h-14 px-6 lg:px-8 border-2"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Sou Criador
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats - Mobile Optimized */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/50 rounded-2xl">
                <div className="text-2xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-1 lg:mb-2">{stat.value}</div>
                <div className="text-xs lg:text-base text-slate-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Campaigns Preview */}
      {featuredCampaigns.length > 0 && (
        <section className="py-12 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-2">Em Destaque</Badge>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Campanhas Ativas</h2>
              </div>
              <Link to={createPageUrl('ExploreCampaigns')}>
                <Button variant="ghost" className="text-indigo-600">
                  Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {featuredCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleProtectedAction('Ver detalhes da campanha')}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {campaign.remuneration_type === 'cash' ? '💵 Pago' : campaign.remuneration_type === 'barter' ? '🎁 Permuta' : '📦 Misto'}
                        </Badge>
                        <Lock className="w-4 h-4 text-slate-300" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {campaign.description?.slice(0, 80)}...
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas
                        </span>
                        <Button size="sm" variant="ghost" className="text-indigo-600 h-8">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Creators Preview */}
      {featuredCreators.length > 0 && (
        <section className="py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <Badge className="bg-orange-100 text-orange-700 border-0 mb-2">Criadores</Badge>
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Talentos em Destaque</h2>
              </div>
              <Link to={createPageUrl('ExploreCreators')}>
                <Button variant="ghost" className="text-indigo-600">
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {featuredCreators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <CreatorCard 
                    creator={creator}
                    isSubscribed={false}
                    compact={true}
                    onViewProfile={() => handleProtectedAction('Ver perfil completo do criador')}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className="py-12 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 lg:mb-16">
            <Badge className="bg-violet-100 text-violet-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Como Funciona
            </Badge>
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">
              Mediação profissional em cada etapa
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                step: '01', 
                title: 'Marca Define',
                description: 'O quê, onde, quando, como provar. Tudo documentado.',
                icon: FileCheck
              },
              { 
                step: '02', 
                title: 'Criador Executa',
                description: 'Com regras claras, produz e entrega com provas.',
                icon: Users
              },
              { 
                step: '03', 
                title: 'Plataforma Valida',
                description: 'Aprovação baseada em critérios objetivos.',
                icon: Shield
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <div className="text-4xl lg:text-6xl font-bold text-slate-200 absolute top-4 right-4 lg:right-6">{item.step}</div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 lg:mb-6 shadow-lg shadow-indigo-500/20">
                  <item.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2 lg:mb-3">{item.title}</h3>
                <p className="text-sm lg:text-base text-slate-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-base lg:text-xl text-indigo-100 mb-6 lg:mb-10 max-w-2xl mx-auto">
            R$ 45/mês para acesso completo. Sem taxas sobre transações.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-6 lg:mb-10">
            {['Campanhas ilimitadas', 'Acesso completo', 'Resolução de disputas', 'Suporte prioritário'].map((item, index) => (
              <Badge key={index} className="bg-white/20 text-white border-0 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm">
                <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                {item}
              </Badge>
            ))}
          </div>

          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-indigo-700 hover:bg-indigo-50 text-base lg:text-lg h-12 lg:h-14 px-8 lg:px-10 shadow-xl"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-white font-semibold">Ponty Conecta</span>
            </div>
            <div className="flex items-center gap-6 lg:gap-8 text-xs lg:text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <div className="text-xs lg:text-sm">
              © 2024 Ponty
            </div>
          </div>
        </div>
      </footer>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Acesso Premium"
        description="Esta funcionalidade requer uma conta ativa."
        feature={paywallFeature}
        isAuthenticated={isAuth}
      />
    </div>
  );
}