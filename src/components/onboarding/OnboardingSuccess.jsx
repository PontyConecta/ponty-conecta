import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

export default function OnboardingSuccess({ profileType, onContinue }) {
  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, []);

  const isBrand = profileType === 'brand';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 px-6"
    >
      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isBrand ? 'bg-indigo-100' : 'bg-orange-100'}`}>
        <CheckCircle2 className={`w-10 h-10 ${isBrand ? 'text-indigo-600' : 'text-orange-500'}`} />
      </div>

      <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Perfil Criado com Sucesso!
      </h2>
      <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
        {isBrand 
          ? 'Sua marca está pronta! Agora você pode criar campanhas e encontrar os melhores criadores.'
          : 'Seu perfil está pronto! Agora você pode explorar oportunidades e se candidatar a campanhas.'}
      </p>

      <div className="space-y-3 max-w-sm mx-auto">
        <Button
          onClick={onContinue}
          className={`w-full h-12 text-base gap-2 ${isBrand ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          <Sparkles className="w-5 h-5" />
          Ir para o Dashboard
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}