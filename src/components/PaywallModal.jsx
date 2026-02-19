import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  title = "Recurso Premium",
  description = "Esta funcionalidade requer uma assinatura ativa.",
  feature = null,
  isAuthenticated = false
}) {
  const features = [
    'Campanhas e candidaturas ilimitadas',
    'Acesso a todos os perfis completos',
    'Contato direto com marcas/criadores',
    'Sistema de entregas com provas',
    'Proteção em disputas',
    'Suporte prioritário'
  ];

  const handleAction = async () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(createPageUrl('Subscription'));
    } else {
      // Redirect to Subscription page which will handle Stripe checkout
      window.location.href = createPageUrl('Subscription');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9038fa] to-[#b77aff] flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl" style={{ color: 'var(--text-primary)' }}>{title}</DialogTitle>
          <DialogDescription className="text-base" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </DialogDescription>
        </DialogHeader>

        {feature && (
          <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#9038fa]" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{feature}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Com a assinatura você tem:</p>
          <div className="grid grid-cols-1 gap-2">
            {features.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-purple-100 text-purple-700 border-0 mb-1">
                Oferta Especial
              </Badge>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Apenas</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>R$ 45</span>
              <span style={{ color: 'var(--text-secondary)' }}>/mês</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAction}
            className="w-full h-12 text-base text-white"
            style={{ backgroundColor: '#9038fa' }}
          >
            <Crown className="w-5 h-5 mr-2" />
            {isAuthenticated ? 'Assinar Agora' : 'Criar Conta e Assinar'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Continuar explorando
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Pagamento seguro
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Cancele quando quiser
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}