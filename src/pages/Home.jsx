import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await base44.auth.isAuthenticated();
    setIsAuth(authenticated);
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (isAuth) {
      window.location.href = createPageUrl('SelectProfile');
    } else {
      base44.auth.redirectToLogin(createPageUrl('SelectProfile'));
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Mediação Profissional',
      description: 'Não somos rede social. Somos o árbitro imparcial entre marcas e criadores.',
      color: 'from-indigo-500 to-violet-500'
    },
    {
      icon: FileCheck,
      title: 'Regras Claras',
      description: 'Critérios de entrega definidos antes do início. Sem subjetividade na aprovação.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Scale,
      title: 'Resolução de Conflitos',
      description: 'Disputas resolvidas pela plataforma baseadas em provas e critérios objetivos.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Lock,
      title: 'Histórico Imutável',
      description: 'Entregas aprovadas são congeladas. Segurança jurídica para ambos os lados.',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  const stats = [
    { value: '500+', label: 'Marcas Ativas' },
    { value: '2.500+', label: 'Criadores' },
    { value: '98%', label: 'Satisfação' },
    { value: '24h', label: 'Tempo Médio de Resolução' }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-semibold text-slate-900">Ponty</span>
              <Badge variant="outline" className="ml-2 text-xs font-normal">Conecta</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              {!loading && (
                isAuth ? (
                  <Button onClick={handleGetStarted} className="bg-indigo-600 hover:bg-indigo-700">
                    Acessar Plataforma
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => base44.auth.redirectToLogin()}>
                      Entrar
                    </Button>
                    <Button onClick={handleGetStarted} className="bg-indigo-600 hover:bg-indigo-700">
                      Começar Agora
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-indigo-100 text-indigo-700 border-0 px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Plataforma de Mediação Profissional
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                Conexões que
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  geram resultados
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                A única plataforma que garante regras claras, prazos cumpridos e resolução justa de conflitos entre marcas e criadores de conteúdo.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-lg h-14 px-8 shadow-xl shadow-indigo-500/25"
                >
                  <Megaphone className="w-5 h-5 mr-2" />
                  Sou uma Marca
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleGetStarted}
                  className="text-lg h-14 px-8 border-2"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Sou Criador
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Como Funciona
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Mediação profissional em cada etapa
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Da criação da campanha até a aprovação da entrega, cada passo é governado por regras claras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: '01', 
                title: 'Marca Define Campanha',
                description: 'O quê, onde, quando, como provar e qual a remuneração. Tudo documentado antes de começar.',
                icon: FileCheck
              },
              { 
                step: '02', 
                title: 'Criador Executa',
                description: 'Com regras claras, o criador produz e entrega com provas dentro do prazo acordado.',
                icon: Users
              },
              { 
                step: '03', 
                title: 'Plataforma Valida',
                description: 'Aprovação baseada em critérios objetivos. Contestações são resolvidas imparcialmente.',
                icon: Shield
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all group"
              >
                <div className="text-6xl font-bold text-slate-200 absolute top-4 right-6">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-orange-100 text-orange-700 border-0 px-4 py-1.5 text-sm font-medium mb-4">
              Por que Ponty?
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Governança que protege todos
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Assinatura única para acesso completo
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            R$ 45/mês para marcas ou criadores. Sem taxas sobre transações.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {['Campanhas ilimitadas', 'Acesso a todos criadores', 'Resolução de disputas', 'Suporte prioritário'].map((item, index) => (
              <Badge key={index} className="bg-white/20 text-white border-0 px-4 py-2">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {item}
              </Badge>
            ))}
          </div>

          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg h-14 px-10 shadow-xl"
          >
            Começar Teste Gratuito
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-white font-semibold">Ponty Conecta</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <div className="text-sm">
              © 2024 Ponty. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}