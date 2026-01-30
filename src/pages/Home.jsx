import React, { useState } from 'react';
import { ArrowRight, Zap, Users, TrendingUp, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Home Page - Ponty Conecta
 * Design: Premium, Inovador, Confiável
 * Stack: React + Tailwind CSS + Shadcn UI
 */

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-gradient-to-br from-white via-purple-50 to-orange-50 overflow-hidden">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Hero Text */}
            <div className="flex flex-col gap-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full w-fit text-sm font-semibold">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Mediação Profissional de Última Geração</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                A <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Ponte Profissional</span> Entre Marcas e Criadores
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-md">
                Organize, execute e escale suas relações profissionais com regras automatizadas e entrega garantida.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50">
                  Sou uma Marca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50">
                  Sou Criador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative h-96 sm:h-[500px] lg:h-[600px] flex items-center justify-center">
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-orange-500 p-12 flex items-center justify-center"
                style={{
                  transform: `translateY(${scrollY * 0.3}px)`,
                  transition: 'transform 0.1s ease-out'
                }}>
                <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                  {/* Brand Side */}
                  <div className="space-y-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <Shield className="w-12 h-12 mb-3" />
                      <div className="text-sm font-semibold">Brands</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white/80 text-xs">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </div>
                  
                  {/* Connection */}
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white/80 text-xs">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white">
                      <Users className="w-12 h-12 mb-3" />
                      <div className="text-sm font-semibold">Creators</div>
                    </div>
                  </div>
                </div>
                
                {/* Center Connection */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-full p-6 shadow-2xl">
                    <Zap className="w-12 h-12 text-purple-600 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Stats Cards */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-4 sm:gap-6 z-10">
            {[
              { number: '500+', label: 'Marcas Ativas' },
              { number: '2.500+', label: 'Criadores' },
              { number: '98%', label: 'Satisfação' }
            ].map((stat, idx) => (
              <Card
                key={idx}
                className="bg-white shadow-lg hover:shadow-xl transition-shadow"
                style={{
                  animation: `float 3s ease-in-out infinite`,
                  animationDelay: `${idx * 0.5}s`
                }}
              >
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tight">
              Por que escolher Ponty
            </h2>
            <p className="text-lg text-gray-600">A solução certa para cada perfil</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="brands" className="text-base">
                <span className="mr-2">🏢</span>
                Para Marcas
              </TabsTrigger>
              <TabsTrigger value="creators" className="text-base">
                <span className="mr-2">✨</span>
                Para Criadores
              </TabsTrigger>
            </TabsList>

            {/* Brands Tab */}
            <TabsContent value="brands" className="mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl group bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-12">
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
                        <Shield className="w-16 h-16 text-white" />
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-3/4">
                          <div className="h-3 bg-white/30 rounded"></div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-full">
                          <div className="h-3 bg-white/30 rounded"></div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 w-2/3">
                          <div className="h-3 bg-white/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1">
                        <TrendingUp className="w-6 h-6 text-white/80" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1">
                        <Users className="w-6 h-6 text-white/80" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex-1">
                        <CheckCircle className="w-6 h-6 text-white/80" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                    Ferramentas profissionais desenhadas para o sucesso de marcas
                  </h3>

                  <div className="space-y-6">
                    {[
                      {
                        icon: Users,
                        title: 'Criadores Verificados',
                        description: 'Perfis com histórico e reputação comprovados'
                      },
                      {
                        icon: TrendingUp,
                        title: 'Campanhas Estruturadas',
                        description: 'Requisitos claros e documentados desde o início'
                      },
                      {
                        icon: Shield,
                        title: 'Gestão Simplificada',
                        description: 'Acompanhe todas as entregas em um só lugar'
                      }
                    ].map((feature, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{feature.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                    Começar como Marca
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="mt-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl group bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 p-12">
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
                        <Sparkles className="w-16 h-16 text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white mb-1">2.5K+</div>
                          <div className="text-xs text-white/70">Criadores</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white mb-1">500+</div>
                          <div className="text-xs text-white/70">Campanhas</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
                        <div className="text-xs text-white/80">Verificado</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
                        <div className="text-xs text-white/80">Crescendo</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                        <Sparkles className="w-8 h-8 text-white mx-auto mb-2" />
                        <div className="text-xs text-white/80">Premium</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                    Oportunidades profissionais com expectativas claras
                  </h3>

                  <div className="space-y-6">
                    {[
                      {
                        icon: Sparkles,
                        title: 'Oportunidades Profissionais',
                        description: 'Campanhas com briefing detalhado e objetivo'
                      },
                      {
                        icon: CheckCircle,
                        title: 'Requisitos Claros',
                        description: 'Saiba exatamente o que entregar e quando'
                      },
                      {
                        icon: TrendingUp,
                        title: 'Reputação Garantida',
                        description: 'Construa seu histórico profissional verificado'
                      }
                    ].map((feature, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{feature.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
                    Começar como Criador
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-orange-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tight">
              Simples para ambos os lados
            </h2>
            <p className="text-lg text-gray-600">Processo transparente e estruturado do início ao fim</p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              {
                number: '01',
                title: 'Conectar',
                description: 'Marcas encontram criadores verificados e criadores descobrem oportunidades profissionais'
              },
              {
                number: '02',
                title: 'Estruturar',
                description: 'Defina requisitos, prazos e expectativas de forma clara e automatizada'
              },
              {
                number: '03',
                title: 'Executar',
                description: 'Criadores entregam conteúdo com prova de entrega e marcas aprovam ou rejeitam'
              },
              {
                number: '04',
                title: 'Escalar',
                description: 'Relacionamentos bem-sucedidos geram histórico e abrem portas para novas oportunidades'
              }
            ].map((step, idx) => (
              <Card key={idx} className="bg-white hover:shadow-lg transition-all hover:-translate-y-2">
                <CardContent className="pt-8">
                  <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pattern Background */}
          <div className="absolute bottom-0 right-0 w-96 h-96 opacity-20 -z-0">
            <img src="/images/success-pattern.png" alt="Pattern" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-orange-500">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-6 tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-lg sm:text-xl mb-12 opacity-95">
            Junte-se a centenas de marcas e criadores que já estão transformando suas relações profissionais
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">Ponty</h3>
              <p className="text-gray-400 text-sm">A ponte profissional entre marcas e criadores</p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Para Marcas</a></li>
                <li><a href="#" className="hover:text-white transition">Para Criadores</a></li>
                <li><a href="#" className="hover:text-white transition">Preços</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">Suporte</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Redes Sociais</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Ponty Conecta. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}