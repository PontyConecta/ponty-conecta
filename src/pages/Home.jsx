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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
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
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-white/80 backdrop-blur-sm text-indigo-700 border border-indigo-200/50 px-4 py-2 text-sm font-medium mb-8 shadow-lg shadow-indigo-500/10">
                <Zap className="w-4 h-4 mr-2" />
                Mediação Profissional de Última Geração
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight">
                A 
                <span className="relative inline-block mx-3">
                  <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Ponte Profissional
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-purple-600/20 blur-xl" />
                </span>
                <br />
                Entre Marcas e Criadores
              </h1>
              
              <p className="text-lg lg:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                Organize, execute e escale suas relações profissionais com regras automatizadas e entrega garantida.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-lg h-14 lg:h-16 px-8 lg:px-10 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Sou uma Marca
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="rounded-full bg-white hover:bg-slate-50 text-slate-900 text-lg h-14 lg:h-16 px-8 lg:px-10 border-2 border-slate-200 shadow-xl hover:shadow-2xl transition-all"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Sou Criador
                </Button>
              </div>

              {/* Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative mt-16"
              >
                <div className="relative mx-auto max-w-6xl">
                  {/* Browser Frame */}
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Browser Bar */}
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-xs text-slate-500 mx-4">
                        app.pontyconecta.com.br
                      </div>
                    </div>
                    {/* Dashboard Preview */}
                    <div className="bg-gradient-to-br from-slate-50 to-white p-8 aspect-video flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-64 bg-slate-200 rounded-lg mx-auto" />
                          <div className="h-3 w-48 bg-slate-100 rounded-lg mx-auto" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-8">
                          <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm" />
                          <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm" />
                          <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 blur-3xl -z-10" />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-24 lg:mt-32 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all">
                <div className="text-3xl lg:text-5xl font-bold text-slate-900 mb-2 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm lg:text-base text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-24 lg:py-32 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <Badge className="bg-slate-100 text-slate-700 border-0 px-5 py-2 text-sm font-medium mb-6 shadow-sm">
              Por que escolher Ponty
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              A solução certa para cada perfil
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Ferramentas profissionais desenhadas para o sucesso de marcas e criadores
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
            {/* For Brands */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <div className="relative bg-white rounded-3xl p-10 lg:p-12 border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Para Marcas</h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Encontre e gerencie criadores profissionais com total transparência e controle.
                  </p>
                  <div className="space-y-5">
                    {[
                      { icon: CheckCircle2, title: 'Criadores Verificados', desc: 'Perfis com histórico e reputação comprovados' },
                      { icon: FileCheck, title: 'Campanhas Estruturadas', desc: 'Requisitos claros e documentados desde o início' },
                      { icon: Shield, title: 'Gestão Simplificada', desc: 'Acompanhe todas as entregas em um só lugar' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-100 transition-colors">
                          <item.icon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleGetStarted}
                    className="mt-8 w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 h-12 shadow-lg shadow-indigo-500/25"
                  >
                    Começar como Marca
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* For Creators */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <div className="relative bg-white rounded-3xl p-10 lg:p-12 border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300 h-full overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Para Criadores</h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Acesse oportunidades profissionais com expectativas claras e pagamento garantido.
                  </p>
                  <div className="space-y-5">
                    {[
                      { icon: Sparkles, title: 'Oportunidades Profissionais', desc: 'Campanhas com briefing detalhado e objetivo' },
                      { icon: FileCheck, title: 'Requisitos Claros', desc: 'Saiba exatamente o que entregar e quando' },
                      { icon: TrendingUp, title: 'Reputação Garantida', desc: 'Construa seu histórico profissional verificado' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 group/item">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover/item:bg-orange-100 transition-colors">
                          <item.icon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleGetStarted}
                    className="mt-8 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-12 shadow-lg shadow-orange-500/25"
                  >
                    Começar como Criador
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <Badge className="bg-violet-100 text-violet-700 border-0 px-5 py-2 text-sm font-medium mb-6 shadow-sm">
              Como Funciona
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Simples para ambos os lados
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
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
                  className="relative p-8 lg:p-10 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-md hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="text-6xl font-bold text-indigo-50 absolute top-6 right-6 group-hover:text-indigo-100 transition-colors">{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">{item.description}</p>
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
                  className="relative p-8 lg:p-10 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 shadow-md hover:shadow-2xl transition-all duration-300 group"
                >
                  <div className="text-6xl font-bold text-orange-50 absolute top-6 right-6 group-hover:text-orange-100 transition-colors">{item.step}</div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 shadow-xl shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="py-24 lg:py-32 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-20">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 px-5 py-2 text-sm font-medium mb-6 shadow-sm">
              Números que Falam
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Confiado por profissionais
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: '200+', label: 'Campanhas Ativas', icon: Megaphone, gradient: 'from-indigo-500 to-violet-500' },
              { value: '500+', label: 'Criadores Verificados', icon: Users, gradient: 'from-orange-500 to-amber-500' },
              { value: '1.200+', label: 'Entregas Bem-Sucedidas', icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500' },
              { value: '4.8/5', label: 'Satisfação Média', icon: Star, gradient: 'from-amber-500 to-yellow-500' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center p-8 lg:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm lg:text-base text-slate-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Pronto para começar?
            </h2>
            <p className="text-lg lg:text-2xl text-indigo-100 mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              R$ 45/mês para acesso completo. Sem taxas sobre transações.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-10 lg:mb-12">
              {['Campanhas ilimitadas', 'Acesso completo', 'Resolução de disputas', 'Suporte prioritário'].map((item, index) => (
                <Badge key={index} className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2.5 text-sm shadow-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {item}
                </Badge>
              ))}
            </div>

            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="rounded-full bg-white text-indigo-700 hover:bg-indigo-50 text-lg lg:text-xl h-14 lg:h-16 px-10 lg:px-12 shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-white font-bold text-xl">Ponty Conecta</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                A ponte profissional entre marcas e criadores. Organize, execute e escale suas relações profissionais com regras automatizadas.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Para Marcas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Para Criadores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © 2026 Ponty Conecta. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
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