import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
            {/* Hero Text */}
            <div className="flex flex-col gap-6 lg:gap-8">
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
                <Link to={createPageUrl('OnboardingBrand')}>
                  <Button size="lg" className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto sm:bg-white sm:text-purple-600 sm:border-2 sm:border-purple-600 sm:hover:bg-purple-50">
                    Sou uma Marca
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to={createPageUrl('OnboardingCreator')}>
                  <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-600 w-full sm:w-auto sm:bg-white sm:text-orange-500 sm:border-2 sm:border-orange-500 sm:hover:bg-orange-50">
                    Sou Criador
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual with Benefits */}
            <div className="relative min-h-[500px] flex items-center justify-center">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-indigo-50 to-orange-50 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-indigo-500/20 rounded-full blur-3xl animate-pulse"
                  style={{
                    transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.2}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                ></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-orange-400/30 to-amber-500/20 rounded-full blur-3xl animate-pulse"
                  style={{
                    transform: `translate(-${scrollY * 0.15}px, -${scrollY * 0.1}px)`,
                    transition: 'transform 0.1s ease-out',
                    animationDelay: '1s'
                  }}
                ></div>
              </div>

              {/* Benefits Cards Centered */}
              <div className="relative z-10 grid grid-cols-2 gap-4 p-6">
                {[
                  { icon: '🤝', title: 'Conexões Estratégicas', description: 'Conectamos você às parcerias ideais' },
                  { icon: '📊', title: 'Gestão Descomplicada', description: 'Organize campanhas de forma simples' },
                  { icon: '✅', title: 'Resultados Garantidos', description: 'Transparência e segurança em cada projeto' },
                  { icon: '📈', title: 'Crescimento Sustentável', description: 'Construa reputação e explore oportunidades' }
                ].map((benefit, idx) => (
                  <Card
                    key={idx}
                    className="bg-white shadow-lg hover:shadow-xl transition-shadow"
                    style={{
                      animation: `float 3s ease-in-out infinite`,
                      animationDelay: `${idx * 0.3}s`
                    }}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl mb-3">{benefit.icon}</div>
                      <h4 className="font-bold text-sm mb-2">{benefit.title}</h4>
                      <p className="text-xs text-gray-600">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="por-que-ponty" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white">
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
              <div className="relative h-[600px] rounded-3xl overflow-hidden lg:h-auto">
                  {/* Abstract gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-indigo-50 to-purple-50"></div>

                  {/* Floating shapes */}
                  <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-12 left-12 w-40 h-40 bg-gradient-to-tl from-purple-500/15 to-violet-400/15 rounded-full blur-2xl"></div>

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-center p-10 lg:p-16">
                    <div className="space-y-8 max-w-md">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
                          <Shield className="w-10 h-10 text-purple-600" />
                        </div>
                        <h3 className="text-2xl font-black leading-tight mb-2">
                          Ferramentas profissionais para marcas
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            icon: Users,
                            title: 'Criadores Verificados',
                            description: 'Perfis com histórico comprovado'
                          },
                          {
                            icon: TrendingUp,
                            title: 'Campanhas Estruturadas',
                            description: 'Requisitos claros desde o início'
                          },
                          {
                            icon: Shield,
                            title: 'Gestão Simplificada',
                            description: 'Acompanhe entregas em um só lugar'
                          }
                        ].map((feature, idx) => (
                          <div key={idx} className="flex gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <feature.icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Link to={createPageUrl('OnboardingBrand')} className="block w-full">
                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                          Começar como Marca
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="mt-12">
              <div className="relative h-[600px] rounded-3xl overflow-hidden lg:h-auto">
                  {/* Abstract gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50"></div>

                  {/* Floating shapes */}
                  <div className="absolute top-8 left-8 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-12 right-12 w-40 h-40 bg-gradient-to-tl from-orange-500/15 to-yellow-400/15 rounded-full blur-2xl"></div>

                  {/* Content */}
                  <div className="relative h-full flex items-center justify-center p-10 lg:p-16">
                    <div className="space-y-8 max-w-md">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
                          <Sparkles className="w-10 h-10 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-black leading-tight mb-2">
                          Oportunidades profissionais para criadores
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            icon: Sparkles,
                            title: 'Campanhas Profissionais',
                            description: 'Briefings detalhados e objetivos'
                          },
                          {
                            icon: CheckCircle,
                            title: 'Requisitos Claros',
                            description: 'Saiba o que entregar e quando'
                          },
                          {
                            icon: TrendingUp,
                            title: 'Reputação Verificada',
                            description: 'Construa histórico profissional'
                          }
                        ].map((feature, idx) => (
                          <div key={idx} className="flex gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <feature.icon className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Link to={createPageUrl('OnboardingCreator')} className="block w-full">
                        <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white w-full">
                          Começar como Criador
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
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

          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-100"
            onClick={() => {
              document.getElementById('por-que-ponty').scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h3 className="font-bold text-xl mb-2">Ponty</h3>
              <p className="text-gray-400 text-sm">A ponte profissional entre marcas e criadores</p>
            </div>

            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/pontycreators/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm font-medium">
                Instagram
              </a>
              <span className="text-gray-700">•</span>
              <a href="https://wa.me/5555619985914?text=Olá%2C%20entrei%20em%20contato%20por%20meio%20da%20página%2C%20gostaria%20de%20mais%20informações." target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition text-sm font-medium">
                Contato Suporte
              </a>
            </div>

            <div className="text-center text-xs text-gray-500 border-t border-gray-800 pt-6 w-full">
              <p>&copy; 2024 Ponty Conecta. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
    </div>
  );
}