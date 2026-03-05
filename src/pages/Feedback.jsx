import React from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { Lock, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import BetaFeedbackForm from '../components/feedback/BetaFeedbackForm';

export default function Feedback() {
  const { user, loading } = useAuth();

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
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Acesso não habilitado</h2>
        <p className="text-sm text-muted-foreground mb-6">
          O programa de feedback beta ainda não está disponível para sua conta.
        </p>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Pesquisa Beta</h1>
          <p className="text-xs text-muted-foreground">6 perguntas · Menos de 2 minutos</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <BetaFeedbackForm
          channel="link"
          onComplete={() => {}}
          onClose={() => window.history.back()}
        />
      </div>
    </div>
  );
}