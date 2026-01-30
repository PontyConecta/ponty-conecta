import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Shield, TrendingUp, Users, Sparkles, CheckCircle, Building2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('brands');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <section className="relative px-4 lg:px-8 py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Text */}
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 px-4 py-2 text-sm font-medium shadow-lg shadow-indigo-500/20">
                <Zap className="w-4 h-4 mr-2" />
                Mediação Profissional de Última Geração
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                A <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">Ponte Profissional</span> Entre Marcas e Criadores
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600">
                Organize, execute e escale suas relações profissionais com regras automatizadas e entrega garantida.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 h-12 px-8">
                  Sou uma Marca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-indigo-200 hover:bg-indigo-50 h-12 px-8">
                  Sou Criador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div 
                className="relative z-10 rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  transform: `translateY(${scrollY * 0.3}px)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <img 
                  src="/images/hero-innovation.png" 
                  alt="Conexão entre Marcas e Criadores"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">500+</div>
              <div className="text-slate-600 font-medium mt-2">Marcas Ativas</div>
            </Card>
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">2.500+</div>
              <div className="text-slate-600 font-medium mt-2">Criadores</div>
            </Card>
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">98%</div>
              <div className="text-slate-600 font-medium mt-2">Satisfação</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Ponty Section */}
      <section className="px-4 lg:px-8 py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Por que escolher Ponty</h2>
            <p className="text-lg text-slate-600">A solução certa para cada perfil</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-4 mb-12">
            <Button 
              variant={activeTab === 'brands' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setActiveTab('brands')}
              className={activeTab === 'brands' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20' 
                : 'border-2 hover:bg-slate-50'
              }
            >
              <Building2 className="w-5 h-5 mr-2" />
              Para Marcas
            </Button>
            <Button 
              variant={activeTab === 'creators' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setActiveTab('creators')}
              className={activeTab === 'creators' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20' 
                : 'border-2 hover:bg-slate-50'
              }
            >
              <Star className="w-5 h-5 mr-2" />
              Para Criadores
            </Button>
          </div>

          {/* Tab Content - Brands */}
          {activeTab === 'brands' && (
            <div className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in duration-500">
              <div className="order-2 lg:order-1">
                <img 
                  src="/images/brands-section.png" 
                  alt="Para Marcas" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              
              <div className="order-1 lg:order-2 space-y-8">
                <h3 className="text-2xl lg:text-3xl font-bold">Ferramentas profissionais desenhadas para o sucesso de marcas</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Criadores Verificados</h4>
                      <p className="text-slate-600">Perfis com histórico e reputação comprovados</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Campanhas Estruturadas</h4>
                      <p className="text-slate-600">Requisitos claros e documentados desde o início</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Gestão Simplificada</h4>
                      <p className="text-slate-600">Acompanhe todas as entregas em um só lugar</p>
                    </div>
                  </div>
                </div>

                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 h-12 px-8">
                  Começar como Marca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Tab Content - Creators */}
          {activeTab === 'creators' && (
            <div className="grid lg:grid-cols-2 gap-12 items-center animate-in fade-in duration-500">
              <div className="order-2 lg:order-1">
                <img 
                  src="/images/creators-section.png" 
                  alt="Para Criadores" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              
              <div className="order-1 lg:order-2 space-y-8">
                <h3 className="text-2xl lg:text-3xl font-bold">Oportunidades profissionais com expectativas claras</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Oportunidades Profissionais</h4>
                      <p className="text-slate-600">Campanhas com briefing detalhado e objetivo</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Requisitos Claros</h4>
                      <p className="text-slate-600">Saiba exatamente o que entregar e quando</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Reputação Garantida</h4>
                      <p className="text-slate-600">Construa seu histórico profissional verificado</p>
                    </div>
                  </div>
                </div>

                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 h-12 px-8">
                  Começar como Criador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-4 lg:px-8 py-16 lg:py-24 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Simples para ambos os lados</h2>
            <p className="text-lg text-slate-600">Processo transparente e estruturado do início ao fim</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="text-6xl font-bold bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">01</div>
              <h4 className="text-xl font-bold mb-2">Conectar</h4>
              <p className="text-slate-600">Marcas encontram criadores verificados e criadores descobrem oportunidades profissionais</p>
            </Card>

            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="text-6xl font-bold bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">02</div>
              <h4 className="text-xl font-bold mb-2">Estruturar</h4>
              <p className="text-slate-600">Defina requisitos, prazos e expectativas de forma clara e automatizada</p>
            </Card>

            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="text-6xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">03</div>
              <h4 className="text-xl font-bold mb-2">Executar</h4>
              <p className="text-slate-600">Criadores entregam conteúdo com prova de entrega e marcas aprovam ou rejeitam</p>
            </Card>

            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-pink-100 hover:border-pink-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <div className="text-6xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">04</div>
              <h4 className="text-xl font-bold mb-2">Escalar</h4>
              <p className="text-slate-600">Relacionamentos bem-sucedidos geram histórico e abrem portas para novas oportunidades</p>
            </Card>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <img src="/images/success-pattern.png" alt="" className="w-full h-full object-cover" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 lg:px-8 py-16 lg:py-24 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white">Pronto para começar?</h2>
          <p className="text-lg lg:text-xl text-indigo-100">
            Junte-se a centenas de marcas e criadores que já estão transformando suas relações profissionais
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white hover:bg-slate-50 text-indigo-600 shadow-xl h-12 px-8">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-12 px-8">
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 px-4 lg:px-8 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Ponty</h4>
              <p className="text-sm">A ponte profissional entre marcas e criadores</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#para-marcas" className="hover:text-white transition-colors">Para Marcas</a></li>
                <li><a href="#para-criadores" className="hover:text-white transition-colors">Para Criadores</a></li>
                <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#termos" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#privacidade" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#suporte" className="hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#linkedin" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#instagram" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#twitter" className="hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            <p>&copy; 2024 Ponty Conecta. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}