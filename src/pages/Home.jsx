import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Zap, Users, TrendingUp, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/contexts/AuthContext';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const { user, profileType, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (!loading && user && profileType) {
      const dashboardPage = profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard';
      navigate(createPageUrl(dashboardPage));
    }
  }, [user, profileType, loading, navigate]);

  const scrollToSection = () => {
    const element = document.getElementById('por-que-ponty');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-4 sm:py-12 lg:py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 lg:mb-10">
            <div className="flex items-center gap-2 lg:gap-3 group">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-[#9038fa] to-[#b77aff] flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl lg:text-2xl">P</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#9038fa] to-[#b77aff] bg-clip-text text-transparent leading-tight">Ponty</span>
                <span className="text-xs lg:text-sm font-medium text-gray-500 leading-tight">Conecta</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-8 lg:mb-16">
            <div className="flex flex-col gap-4 sm:gap-5 lg:gap-7">
              <div className="hidden lg:inline-flex items-center gap-2 bg-[#9038fa]/10 text-[#9038fa] px-5 py-3 rounded-full w-fit text-sm font-semibold shadow-sm">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Mediação Profissional de Última Geração</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                A <span className="bg-gradient-to-r from-[#9038fa] to-[#b77aff] bg-clip-text text-transparent">Ponte Profissional</span> Entre Marcas e Criadores
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-md">
                Organize, execute e escale suas relações profissionais com regras automatizadas e entrega garantida.
              </p>

              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg w-fit text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Explore gratuitamente • Sem cartão de crédito</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-[#9038fa] text-white hover:bg-[#7a2de0] w-full sm:w-auto shadow-lg shadow-[#9038fa]/25 h-11 sm:h-12"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}
                >
                  Sou uma Marca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto border-2 border-[#9038fa] text-[#9038fa] bg-white hover:bg-[#9038fa]/5 h-11 sm:h-12"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}
                >
                  Sou Criador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:flex min-h-[420px] items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9038fa]/8 via-[#b77aff]/5 to-[#9038fa]/8 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-[#9038fa]/20 to-[#b77aff]/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[#b77aff]/20 to-[#9038fa]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 p-6 w-full max-w-lg">
                {[
                  { icon: '🤝', title: 'Conexões Estratégicas', description: 'Parcerias ideais' },
                  { icon: '📊', title: 'Gestão Simples', description: 'Campanhas organizadas' },
                  { icon: '✅', title: 'Resultados Garantidos', description: 'Transparência total' },
                  { icon: '📈', title: 'Crescimento', description: 'Reputação sólida' }
                ].map((benefit, idx) => (
                  <Card
                    key={idx}
                    className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all border-0"
                    style={{
                      animation: `float 4s ease-in-out infinite`,
                      animationDelay: `${idx * 0.4}s`
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{benefit.icon}</div>
                      <h4 className="font-bold text-xs mb-1 text-gray-900">{benefit.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-tight">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="por-que-ponty" className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-3 tracking-tight">
              Por que escolher Ponty
            </h2>
            <p className="text-lg text-gray-600">A solução certa para cada perfil</p>
          </div>

          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 sm:mb-10">
              <TabsTrigger value="brands" className="text-base">
                <span className="mr-2">🏢</span>
                Para Marcas
              </TabsTrigger>
              <TabsTrigger value="creators" className="text-base">
                <span className="mr-2">✨</span>
                Para Criadores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brands" className="mt-8">
              <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#9038fa]/10 via-purple-50 to-[#b77aff]/10"></div>

                  <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-[#9038fa]/20 to-[#b77aff]/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-12 left-12 w-40 h-40 bg-gradient-to-tl from-[#9038fa]/15 to-[#b77aff]/15 rounded-full blur-2xl"></div>

                  <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
                    <div className="space-y-6 max-w-md w-full">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-3">
                          <Shield className="w-8 h-8 text-[#9038fa]" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black leading-tight mb-2">
                          Ferramentas profissionais para marcas
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {[
                          { icon: Users, title: 'Criadores Verificados', description: 'Perfis com histórico comprovado' },
                          { icon: TrendingUp, title: 'Campanhas Estruturadas', description: 'Requisitos claros desde o início' },
                          { icon: Shield, title: 'Gestão Simplificada', description: 'Acompanhe entregas em um só lugar' }
                        ].map((feature, idx) => (
                          <div key={idx} className="flex gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                            <div className="flex-shrink-0 w-9 h-9 bg-[#9038fa]/10 rounded-lg flex items-center justify-center">
                             <feature.icon className="w-4 h-4 text-[#9038fa]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        size="lg" 
                        className="bg-[#9038fa] hover:bg-[#7a2de0] text-white w-full"
                        onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}
                      >
                        Começar como Marca
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
            </TabsContent>

            <TabsContent value="creators" className="mt-8">
              <div className="relative rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#b77aff]/10 via-purple-50 to-[#9038fa]/10"></div>

                  <div className="absolute top-8 left-8 w-32 h-32 bg-gradient-to-br from-[#b77aff]/20 to-[#9038fa]/20 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-12 right-12 w-40 h-40 bg-gradient-to-tl from-[#b77aff]/15 to-[#9038fa]/15 rounded-full blur-2xl"></div>

                  <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
                    <div className="space-y-6 max-w-md w-full">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-3">
                          <Sparkles className="w-8 h-8 text-[#b77aff]" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black leading-tight mb-2">
                          Oportunidades profissionais para criadores
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {[
                          { icon: Sparkles, title: 'Campanhas Profissionais', description: 'Briefings detalhados e objetivos' },
                          { icon: CheckCircle, title: 'Requisitos Claros', description: 'Saiba o que entregar e quando' },
                          { icon: TrendingUp, title: 'Reputação Verificada', description: 'Construa histórico profissional' }
                        ].map((feature, idx) => (
                          <div key={idx} className="flex gap-3 bg-white/50 backdrop-blur-sm p-3 rounded-lg">
                            <div className="flex-shrink-0 w-9 h-9 bg-[#b77aff]/10 rounded-lg flex items-center justify-center">
                              <feature.icon className="w-4 h-4 text-[#b77aff]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{feature.title}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        size="lg" 
                        className="bg-[#b77aff] hover:bg-[#a055ff] text-white w-full"
                        onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}
                      >
                        Começar como Criador
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#9038fa]/4 via-white to-[#b77aff]/4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-3 tracking-tight">
              Simples para ambos os lados
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Processo transparente e estruturado do início ao fim</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 relative z-10">
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
              <Card key={idx} className="bg-white hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-4 sm:pt-6 lg:pt-8">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-[#9038fa] to-[#b77aff] bg-clip-text text-transparent mb-2 sm:mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold mb-1.5 sm:mb-3">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#9038fa] to-[#b77aff]">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black mb-4 tracking-tight">
            Pronto para começar?
          </h2>
          <p className="text-sm sm:text-lg mb-8 opacity-95">
            Junte-se a centenas de marcas e criadores que já estão transformando suas relações profissionais
          </p>

          <Button 
            size="lg" 
            className="bg-white text-[#9038fa] hover:bg-gray-100"
            onClick={scrollToSection}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

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

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
    </div>
  );
}