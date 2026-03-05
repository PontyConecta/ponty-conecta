import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { base44 } from '@/api/base44Client';
import BetaFeedbackForm from './BetaFeedbackForm';

export default function BetaFeedbackNudge() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isEligible = user &&
    ['eligible', 'invited'].includes(user.feedback_status) &&
    user.feedback_status !== 'submitted';

  useEffect(() => {
    if (!isEligible) return;

    // Check snooze
    const snoozedUntil = user.feedback_snoozed_until;
    if (snoozedUntil && new Date(snoozedUntil) > new Date()) {
      setShowBanner(true);
      return;
    }

    // Session flag — only show modal once per session
    const sessionKey = `ponty_fb_nudge_${user.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setShowBanner(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowModal(true);
      setShowBanner(true);
      sessionStorage.setItem(sessionKey, '1');
    }, 3000);

    return () => clearTimeout(timer);
  }, [isEligible, user?.id]);

  if (!isEligible || dismissed) return null;

  const handleSnooze = async () => {
    setShowModal(false);
    const snoozeDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.auth.updateMe({ feedback_snoozed_until: snoozeDate });
  };

  const handleComplete = () => {
    setShowModal(false);
    setShowBanner(false);
    setDismissed(true);
  };

  return (
    <>
      {/* ── Banner ── */}
      {showBanner && !showModal && (
        <div className="fixed top-14 lg:top-16 left-0 right-0 z-40 border-b border-border bg-card px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">Pesquisa beta pendente</span>
                <span className="text-muted-foreground ml-1">(2 min)</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" className="h-7 text-xs" onClick={() => setShowModal(true)}>
                Abrir
              </Button>
              <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleSnooze(); }}>
        <DialogContent className="max-w-md bg-card border border-border shadow-xl rounded-2xl p-0 sm:p-0 gap-0">
          <DialogTitle className="sr-only">Pesquisa Beta</DialogTitle>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4.5 h-4.5 text-foreground" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-base font-semibold text-foreground">Seu feedback melhora a Ponty</h2>
                <p className="text-xs text-muted-foreground">6 perguntas objetivas · Menos de 2 minutos</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            <BetaFeedbackForm channel="modal" onComplete={handleComplete} onClose={handleSnooze} />
          </div>

          {/* Footer microcopy */}
          <div className="px-6 pb-4 pt-0">
            <p className="text-[10px] text-muted-foreground text-center">
              Você pode responder em qualquer momento pelo menu Feedback.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}