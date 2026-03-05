import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, EyeOff, RotateCcw, AlertTriangle, MessageSquarePlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function UserRowActions({ user, profile, onView, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const isHidden = user.visibility_status === 'hidden';
  const feedbackStatus = user.feedback_status || 'none';

  const handleFeedbackInvite = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('adminManageUser', {
        userId: user.id,
        action: 'set_feedback_beta',
        data: { feedback_status: 'invited', auditNote: 'Convite rápido via tabela' }
      });
      toast.success('Convite de feedback enviado');
      onActionComplete?.();
    } catch (err) {
      toast.error('Erro ao enviar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackRemove = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('adminManageUser', {
        userId: user.id,
        action: 'set_feedback_beta',
        data: { feedback_status: 'none', feedback_tags: [], auditNote: 'Removido via ação rápida' }
      });
      toast.success('Removido do feedback beta');
      onActionComplete?.();
    } catch (err) {
      toast.error('Erro ao remover');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    setLoading(true);
    try {
      const newStatus = isHidden ? 'visible' : 'hidden';
      await base44.functions.invoke('adminManageUser', {
        userId: user.id,
        action: 'set_visibility_status',
        data: { visibility_status: newStatus, auditNote: `Alterado via ação rápida na tabela` }
      });
      toast.success(isHidden ? 'Usuário reativado' : 'Usuário ocultado');
      onActionComplete?.();
    } catch (err) {
      console.error('Visibility toggle error:', err);
      toast.error('Erro ao alterar visibilidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={loading}>
          <MoreVertical className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onView} className="text-xs gap-2">
          <Eye className="w-3.5 h-3.5" />
          Ver usuário
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isHidden ? (
          <DropdownMenuItem onClick={handleToggleVisibility} className="text-xs gap-2 text-emerald-600">
            <RotateCcw className="w-3.5 h-3.5" />
            Reativar usuário
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleToggleVisibility} className="text-xs gap-2 text-red-600">
            <EyeOff className="w-3.5 h-3.5" />
            Ocultar usuário
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {feedbackStatus === 'none' || feedbackStatus === 'eligible' ? (
          <DropdownMenuItem onClick={handleFeedbackInvite} className="text-xs gap-2 text-purple-600">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Convidar p/ Feedback
          </DropdownMenuItem>
        ) : feedbackStatus !== 'none' ? (
          <DropdownMenuItem onClick={handleFeedbackRemove} className="text-xs gap-2 text-red-600">
            <UserMinus className="w-3.5 h-3.5" />
            Remover do Feedback
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { setFlagged(!flagged); toast.info(flagged ? 'Marcação removida' : 'Marcado como suspeito (visual)'); }}
          className={`text-xs gap-2 ${flagged ? 'text-amber-600' : ''}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {flagged ? 'Remover suspeita' : 'Marcar como suspeito'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}