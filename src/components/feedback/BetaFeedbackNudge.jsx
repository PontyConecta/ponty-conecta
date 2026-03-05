import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageSquarePlus, X } from 'lucide-react';
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
      setShowBanner(true); // Still show banner, just no modal
      return;
    }

    // Check session flag
    const sessionKey = `ponty_fb_nudge_${user.id}`;
    if (sessionStorage.getItem(sessionKey)) {
      setShowBanner(true);
      return;
    }

    // Show modal after 3 seconds
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
      {/* Banner fixo no topo */}
      {showBanner && !showModal && (
        <div className="fixed top-14 lg:top-16 left-0 right-0 z-40 bg-primary/10 border-b border-primary/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquarePlus className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-foreground truncate">
                <strong>Queremos sua opinião!</strong> Leva menos de 2 minutos.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setShowModal(true)}>
                Responder
              </Button>
              <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleSnooze(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-card p-0 sm:p-0">
          <div className="px-6 pt-6 pb-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Feedback Beta 💜</h2>
                <p className="text-xs text-muted-foreground">Leva menos de 2 minutos</p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            <BetaFeedbackForm channel="modal" onComplete={handleComplete} onClose={() => handleSnooze()} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}