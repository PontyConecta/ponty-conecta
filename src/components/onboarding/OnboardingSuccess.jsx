import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Rocket, Target, Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';
import { useAuth } from '@/components/contexts/AuthContext';

const SUCCESS_COPY = {
  healthcare: {
    title: 'Bem-vinda à plataforma',
    sub: 'Marcas de saúde e bem-estar já podem encontrar seu perfil. Explore as parcerias disponíveis.',
    icon: Trophy,
  },
  athlete: {
    title: 'Seu perfil está ativo',
    sub: 'Marcas de esporte e lifestyle já podem ver quem você é. Explore contratos e endorsements.',
    icon: Trophy,
  },
  entrepreneur: {
    title: 'Acesso liberado',
    sub: 'Sua presença digital agora conecta com marcas que buscam resultado. Veja as oportunidades.',
    icon: Target,
  },
  expert: {
    title: 'Perfil de especialista criado',
    sub: 'Marcas buscam sua autoridade. Explore colaborações no seu nicho.',
    icon: Trophy,
  },
  default: {
    title: 'Você está no mapa',
    sub: 'Marcas já podem encontrar seu perfil. Sua primeira parceria começa agora.',
    icon: Rocket,
  },
};

export default function OnboardingSuccess({ profileType, onContinue }) {
  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, []);

  const { profile } = useAuth();
  const isBrand = profileType === 'brand';

  const copy = isBrand ? null : (SUCCESS_COPY[profile?.creator_type] ?? SUCCESS_COPY.default);
  const IconComponent = copy?.icon || Rocket;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-6"
    >
      {isBrand ? (
        <>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-primary/10">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-foreground">Perfil Criado com Sucesso!</h2>
          <p className="text-lg mb-8 max-w-md mx-auto text-muted-foreground">
            Sua marca está pronta! Agora você pode criar campanhas e encontrar os melhores criadores.
          </p>
        </>
      ) : (
        <>
          <IconComponent className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="headline-display text-2xl text-foreground text-center mb-3">{copy.title}</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs mx-auto mb-8">{copy.sub}</p>
        </>
      )}

      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          onClick={onContinue}
          className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/80 text-primary-foreground"
        >
          Ir para o Dashboard
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}