import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { Lock, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import BetaFeedbackForm from '../components/feedback/BetaFeedbackForm';

export default function Feedback() {
  const { user, loading } = useAuth();
  const [completed, setCompleted] = useState(false);

  const feedbackStatus = user?.feedback_status || 'none';
  const isAllowed = ['eligible', 'invited', 'submitted'].includes(feedbackStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso não habilitado</h2>
        <p className="text-sm text-muted-foreground mb-6">
          O programa de feedback beta ainda não está disponível para sua conta.
        </p>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Pesquisa Beta</h1>
          <p className="text-xs text-muted-foreground">Você está ajudando a construir a Ponty 💜</p>
        </div>
      </div>

      <BetaFeedbackForm
        channel="link"
        onComplete={() => setCompleted(true)}
        onClose={() => window.history.back()}
      />
    </div>
  );
}