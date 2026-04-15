import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Users, TrendingUp, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/contexts/AuthContext';

function Logo({ size = 'lg' }) {
  const isLg = size === 'lg';
  return (
    <div className="flex items-center gap-2">
      <div className={`${isLg ? 'w-12 h-12 lg:w-14 lg:h-14 rounded-2xl text-xl lg:text-2xl' : 'w-9 h-9 rounded-xl text-base'} flex items-center justify-center bg-primary shadow-lg shadow-primary/20`}>
        <span className="text-primary-foreground font-bold">P</span>
      </div>
      <div className="flex flex-col">
        <span className={`${isLg ? 'text-xl lg:text-2xl' : 'text-lg'} font-bold leading-tight text-primary`}>Ponty</span>
        <span className={`${isLg ? 'text-xs lg:text-sm' : 'text-[11px]'} font-medium text-muted-foreground leading-tight`}>Health Club</span>
      </div>
    </div>
  );
}

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
      navigate(createPageUrl(profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard'));
    }
    if (!loading && user && !profileType) {
      navigate(createPageUrl('SelectProfile'));
    }
  }, [user, profileType, loading, navigate]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 lg:h-16">
          <Logo size="sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => scrollTo('por-que-ponty')} className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Como funciona</button>
            <button onClick={() => base44.auth.redirectToLogin()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Entrar</button>
            <Button size="sm" onClick={() => scrollTo('cta-final')} className="bg-primary text-primary-foreground hover:bg-primary/80">Começar</Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-4 sm:py-12 lg:py-16 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 lg:mb-10">
            <Logo size="lg" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-8 lg:mb-16">
            {/* Left */}
            <div className="flex flex-col gap-4 sm:gap-5 lg:gap-7">
              <div className="hidden lg:inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-3 rounded-full w-fit text-sm font-semibold shadow-sm">
                <Users className="w-4 h-4 animate-pulse" />
                <span>Curadoria entre marcas e criadores</span>
              </div>

              <h1 className="headline-display text-3xl sm:text-4xl lg:text-6xl">
                O clube entre marcas e <span className="text-primary">criadores de verdade</span>.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
                Conexões reais entre marcas com algo a dizer e criadores com autoridade pra dizer. Sem ruído, sem vaidade, sem enrolação.
              </p>

              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2.5 rounded-lg w-fit text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Gratuito pra marcas • Sem cartão de crédito</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 w-full sm:w-auto shadow-lg shadow-primary/25 h-11 sm:h-12"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}
                >
                  Entrar como marca
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  className="w-full sm:w-auto border-2 border-primary text-primary bg-background hover:bg-primary/5 h-11 sm:h-12"
                  onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}
                >
                  Entrar como criador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Right — floating cards */}
            <div className="relative hidden lg:flex min-h-[420px] items-center justify-center">
              <div className="absolute inset-0 rounded-3xl overflow-hidden bg-primary/5" />
              <div className="relative z-10 grid grid-cols-2 gap-3 p-6 w-full max-w-lg">
                {[
                  { emoji: '🎯', title: 'Criadores certos', desc: 'Curadoria por nicho' },
                  { emoji: '🤝', title: 'Confiança real', desc: 'Autoridade antes de alcance' },
                  { emoji: '✅', title: 'Entrega provada', desc: 'Histórico visível' },
                  { emoji: '📈', title: 'Reputação que cresce', desc: 'Proof, não promessa' },
                ].map((c, i) => (
                  <Card
                    key={i}
                    className="bg-card/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all border-0"
                    style={{ animation: 'float 4s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{c.emoji}</div>
                      <h4 className="font-bold text-xs mb-1 text-foreground">{c.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-tight">{c.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POR QUE PONTY (Tabs) ── */}
      <section id="por-que-ponty" className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="headline-display text-2xl sm:text-3xl lg:text-5xl mb-3">Nem tudo que tem audiência tem autoridade.</h2>
            <p className="text-lg text-muted-foreground">O clube onde marcas encontram quem tem voz real no nicho.</p>
          </div>

          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 sm:mb-10">
              <TabsTrigger value="brands" className="text-base"><span className="mr-2">🏢</span>Pra marcas</TabsTrigger>
              <TabsTrigger value="creators" className="text-base"><span className="mr-2">✨</span>Pra criadores</TabsTrigger>
            </TabsList>

            <TabsContent value="brands" className="mt-8">
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
                  <div className="space-y-6 max-w-md w-full">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-2xl shadow-lg mb-3">
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black leading-tight mb-2">O clube trabalha pra sua marca, não contra ela.</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { Icon: Users, t: 'Criadores por nicho', d: 'Estética, fitness, nutrição, longevidade, performance — autoridade organizada' },
                        { Icon: TrendingUp, t: 'Entrada gratuita', d: 'Crie conta, lance campanhas, receba candidaturas. Sem cartão.' },
                        { Icon: Shield, t: 'Sem intermediário oculto', d: 'Você fala direto com o criador. Acompanha a entrega na plataforma.' },
                      ].map((f, i) => (
                        <div key={i} className="flex gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg">
                          <div className="flex-shrink-0 w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                            <f.Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{f.t}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground w-full" onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}>
                      Entrar como marca <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creators" className="mt-8">
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-accent/5" />
                <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
                  <div className="space-y-6 max-w-md w-full">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-2xl shadow-lg mb-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black leading-tight mb-2">Onde autoridade vira oportunidade.</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { Icon: Sparkles, t: 'Marcas alinhadas ao seu nicho', d: 'Oportunidades filtradas pelo que você realmente faz' },
                        { Icon: CheckCircle, t: 'Controle total', d: 'Aceita o que combina com você. Ignora o resto.' },
                        { Icon: TrendingUp, t: 'Reputação que abre portas', d: 'Histórico de entregas visível. Quem entrega bem é chamado de novo.' },
                      ].map((f, i) => (
                        <div key={i} className="flex gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg">
                          <div className="flex-shrink-0 w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                            <f.Icon className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{f.t}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="lg" className="bg-accent hover:bg-accent/80 text-accent-foreground w-full" onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}>
                      Entrar como criador <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="headline-display text-2xl sm:text-3xl lg:text-5xl mb-3">Simples como tem que ser.</h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Do primeiro briefing à entrega aprovada — tudo dentro do clube.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 relative z-10">
            {[
              { n: '01', t: 'Entrar', d: 'Marcas criam conta grátis. Criadores montam perfil com nicho e autoridade.' },
              { n: '02', t: 'Alinhar', d: 'Marca publica campanha com briefing. Criadores candidatam. Filtro por nicho e histórico.' },
              { n: '03', t: 'Entregar', d: 'Criador produz o conteúdo com prova de entrega. Marca aprova direto na plataforma.' },
              { n: '04', t: 'Crescer', d: 'Reputação vira moeda. Quem entrega bem é convidado de novo. O clube aperta o laço.' },
            ].map((s, i) => (
              <Card key={i} className="bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-4 sm:pt-6 lg:pt-8">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 sm:mb-4 text-primary">{s.n}</div>
                  <h3 className="text-sm sm:text-base lg:text-xl font-bold mb-1.5 sm:mb-3">{s.t}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRA QUEM É ── */}
      <section className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-4xl text-center mb-10 sm:mb-14">Pra quem o clube foi feito.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <Card className="border bg-card">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-3 text-foreground">Marcas</h3>
                <p className="text-muted-foreground leading-relaxed">Marcas que preferem ser escolhidas a gritar. Que entendem que confiança vale mais que publicidade, e que um criador certo supera dez errados.</p>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-3 text-foreground">Criadores</h3>
                <p className="text-muted-foreground leading-relaxed">Criadores que construíram autoridade em um nicho específico e querem monetizar sem virar outdoor ambulante.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta-final" className="py-10 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-5xl mb-4">Entre no clube.</h2>
          <p className="text-sm sm:text-lg mb-8 opacity-95">Gratuito pra marcas. Direto pra criadores. Pro quem leva o que faz a sério.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-background text-primary hover:bg-secondary h-12" onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}>
              Entrar como marca <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" className="bg-background text-primary hover:bg-secondary h-12" onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}>
              Entrar como criador <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-card border-t px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <Logo size="sm" />
          <p className="text-muted-foreground text-sm">O clube entre marcas e criadores.</p>
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/pontycreators/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition text-sm font-medium">Instagram</a>
            <span className="text-border">•</span>
            <a href="https://wa.me/5561998591499?text=Olá%2C%20entrei%20em%20contato%20por%20meio%20da%20página." target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition text-sm font-medium">Contato</a>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t border-border pt-6 w-full">
            <p>&copy; 2026 Ponty Health Club. Todos os direitos reservados.</p>
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