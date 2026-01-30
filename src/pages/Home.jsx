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
                A Ponte Profissional
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Entre Marcas e Criadores
                </span>
              </h1>
              
              <p className="text-base lg:text-xl text-slate-600 mb-6 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                Organize, execute e escale suas relações profissionais com regras automatizadas e entrega garantida.
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

      {/* Dual Value Proposition */}
      <section className="py-12 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="bg-slate-100 text-slate-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Por que escolher Ponty
            </Badge>
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">
              A solução certa para cada perfil
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Brands */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-8 lg:p-10 border-2 border-indigo-100 h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/25">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Para Marcas</h3>
                <p className="text-slate-600 mb-6 lg:mb-8">
                  Encontre e gerencie criadores profissionais com total transparência e controle.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: CheckCircle2, title: 'Criadores Verificados', desc: 'Perfis com histórico e reputação' },
                    { icon: FileCheck, title: 'Campanhas Estruturadas', desc: 'Requisitos claros e documentados' },
                    { icon: Shield, title: 'Gestão Simplificada', desc: 'Acompanhe tudo em um só lugar' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* For Creators */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 lg:p-10 border-2 border-orange-100 h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-xl shadow-orange-500/25">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Para Criadores</h3>
                <p className="text-slate-600 mb-6 lg:mb-8">
                  Acesse oportunidades profissionais com expectativas claras e pagamento garantido.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Sparkles, title: 'Oportunidades Profissionais', desc: 'Campanhas com briefing detalhado' },
                    { icon: FileCheck, title: 'Requisitos Claros', desc: 'Saiba exatamente o que entregar' },
                    { icon: TrendingUp, title: 'Reputação Garantida', desc: 'Construa seu histórico profissional' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 lg:py-20 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="bg-violet-100 text-violet-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Como Funciona
            </Badge>
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">
              Simples para ambos os lados
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Processo transparente e estruturado do início ao fim
            </p>
          </div>

          {/* For Brands Flow */}
          <div className="mb-12 lg:mb-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Para Marcas</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { 
                  step: '01', 
                  title: 'Crie',
                  description: 'Defina sua campanha com requisitos detalhados e orçamento',
                  icon: Megaphone
                },
                { 
                  step: '02', 
                  title: 'Selecione',
                  description: 'Analise candidaturas e escolha os criadores ideais',
                  icon: Users
                },
                { 
                  step: '03', 
                  title: 'Aprove',
                  description: 'Revise entregas e aprove baseado nos critérios definidos',
                  icon: CheckCircle2
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative p-6 lg:p-8 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <div className="text-5xl font-bold text-indigo-100 absolute top-4 right-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* For Creators Flow */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Para Criadores</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {[
                { 
                  step: '01', 
                  title: 'Navegue',
                  description: 'Explore oportunidades que combinam com seu perfil',
                  icon: Sparkles
                },
                { 
                  step: '02', 
                  title: 'Execute',
                  description: 'Produza conteúdo seguindo os requisitos da campanha',
                  icon: FileCheck
                },
                { 
                  step: '03', 
                  title: 'Seja Reconhecido',
                  description: 'Construa sua reputação e atraia mais oportunidades',
                  icon: TrendingUp
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative p-6 lg:p-8 rounded-2xl bg-white border-2 border-slate-100 hover:border-orange-200 hover:shadow-lg transition-all"
                >
                  <div className="text-5xl font-bold text-orange-100 absolute top-4 right-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="py-12 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Números que Falam
            </Badge>
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900">
              Confiado por profissionais
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: '200+', label: 'Campanhas Ativas', icon: Megaphone, color: 'indigo' },
              { value: '500+', label: 'Criadores Verificados', icon: Users, color: 'orange' },
              { value: '1.200+', label: 'Entregas Bem-Sucedidas', icon: CheckCircle2, color: 'emerald' },
              { value: '4.8/5', label: 'Satisfação Média', icon: Star, color: 'amber' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`text-center p-6 lg:p-8 rounded-2xl bg-${stat.color}-50 border border-${stat.color}-100`}
              >
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
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