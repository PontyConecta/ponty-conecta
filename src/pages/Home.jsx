import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Check, Search, FileText, UserCheck, Eye, Send, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/contexts/AuthContext';

export default function Home() {
  const { user, profileType, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user && profileType) {
      const dashboardPage = profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard';
      navigate(createPageUrl(dashboardPage));
    }
    if (!loading && user && !profileType) {
      navigate(createPageUrl('SelectProfile'));
    }
  }, [user, profileType, loading, navigate]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">

      {/* ── SEÇÃO 1 — NAV ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14 lg:h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-bold text-primary">Ponty</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => scrollTo('como-funciona')} className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Como funciona
            </button>
            <button onClick={() => base44.auth.redirectToLogin()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </button>
            <Button size="sm" onClick={() => scrollTo('cta-final')} className="bg-primary text-primary-foreground hover:bg-primary/80">
              Começar
            </Button>
          </div>
        </div>
      </nav>

      {/* ── SEÇÃO 2 — HERO ── */}
      <section className="px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="headline-display text-4xl sm:text-5xl lg:text-6xl mb-5">
            O clube entre marcas e criadores.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Conexões reais entre marcas que têm algo a dizer e criadores com autoridade pra dizer. Sem ruído, sem vaidade, sem enrolação.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <HeroCard
              title="Pra marcas"
              bullets={[
                'Entrada gratuita, sem contrato longo',
                'Acesse criadores por nicho e autoridade',
                'Pague só o que combinar com cada criador',
              ]}
              cta="Entrar como marca"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}
            />
            <HeroCard
              title="Pra criadores"
              bullets={[
                'Oportunidades de marcas alinhadas ao seu nicho',
                'Controle total sobre o que aceita',
                'Pagamento direto, sem intermediário escondido',
              ]}
              cta="Entrar como criador"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}
            />
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3 — POR QUE PONTY ── */}
      <section id="por-que-ponty" className="px-4 sm:px-6 py-12 sm:py-16 lg:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-4xl mb-3">
            Nem tudo que tem audiência tem autoridade.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ponty é o clube onde marcas encontram criadores com voz real no nicho deles. Curadoria antes de volume.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <ValueCard
            icon={<Search className="w-6 h-6 text-primary" />}
            title="Curadoria por nicho"
            description="Criadores organizados por universo: estética, fitness, nutrição, longevidade, performance. Você encontra quem fala com seu público."
          />
          <ValueCard
            icon={<Send className="w-6 h-6 text-primary" />}
            title="Conexão direta"
            description="Sem intermediário cobrando %. Marca e criador conversam, alinham e fecham dentro da plataforma."
          />
          <ValueCard
            icon={<BadgeCheck className="w-6 h-6 text-primary" />}
            title="Proof, não promessa"
            description="Histórico de entregas, reputação visível, disputas resolvidas com transparência. Decisão baseada em dado."
          />
        </div>
      </section>

      {/* ── SEÇÃO 4 — COMO FUNCIONA ── */}
      <section id="como-funciona" className="px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-4xl text-center mb-10 sm:mb-14">
            Simples como tem que ser.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <StepsColumn
              title="Fluxo da Marca"
              steps={[
                'Crie sua conta — gratuita, sem cartão.',
                'Publique uma campanha — descreva o que precisa.',
                'Aprove os criadores certos e acompanhe as entregas.',
              ]}
            />
            <StepsColumn
              title="Fluxo do Criador"
              steps={[
                'Crie seu perfil — mostre seu nicho e autoridade.',
                'Veja oportunidades — só das marcas alinhadas ao que você faz.',
                'Candidate-se, entregue, receba.',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 5 — PRA QUEM É ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 lg:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-4xl text-center mb-10 sm:mb-14">
            Pra quem o clube foi feito.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <Card className="border bg-card">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-3 text-foreground">Marcas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Marcas que preferem ser escolhidas a gritar. Que entendem que confiança vale mais que publicidade, e que um criador certo supera dez creators errados.
                </p>
              </CardContent>
            </Card>
            <Card className="border bg-card">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-3 text-foreground">Criadores</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Criadores que construíram autoridade em um nicho específico e querem monetizar sem virar outdoor ambulante.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 6 — CTA FINAL ── */}
      <section id="cta-final" className="px-4 sm:px-6 py-14 sm:py-20 lg:py-28 bg-primary">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground">
          <h2 className="headline-display text-2xl sm:text-3xl lg:text-5xl mb-4">
            Entre no clube.
          </h2>
          <p className="text-base sm:text-lg mb-8 opacity-90">
            Gratuito pra marcas. Direto pra criadores. Pronto pra quem leva o que faz a sério.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-secondary h-12"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingBrand'))}
            >
              Entrar como marca
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              className="bg-background text-primary hover:bg-secondary h-12"
              onClick={() => base44.auth.redirectToLogin(createPageUrl('OnboardingCreator'))}
            >
              Entrar como criador
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 7 — FOOTER ── */}
      <footer className="bg-card border-t px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="text-base font-bold text-primary">Ponty</span>
          </div>
          <p className="text-sm text-muted-foreground">O clube entre marcas e criadores.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Termos</span>
            <span className="text-border">·</span>
            <span>Privacidade</span>
            <span className="text-border">·</span>
            <a href="https://wa.me/5561998591499?text=Olá%2C%20entrei%20em%20contato%20por%20meio%20da%20página." target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Contato
            </a>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 Ponty. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function HeroCard({ title, bullets, cta, onClick }) {
  return (
    <Card className="border bg-card text-left">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4 text-foreground">{title}</h3>
        <ul className="space-y-2.5 mb-6">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/80 h-11" onClick={onClick}>
          {cta}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ValueCard({ icon, title, description }) {
  return (
    <Card className="border bg-card">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 mb-4">
          {icon}
        </div>
        <h3 className="text-base font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepsColumn({ title, steps }) {
  return (
    <div>
      <h3 className="text-base font-bold mb-5 text-foreground">{title}</h3>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-muted-foreground pt-1 leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}