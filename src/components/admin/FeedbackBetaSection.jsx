import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquarePlus, Loader2, X, Send, UserMinus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  none: { label: 'Não participante', cls: 'bg-muted text-muted-foreground' },
  eligible: { label: 'Elegível', cls: 'bg-blue-100 text-blue-700' },
  invited: { label: 'Convidado', cls: 'bg-purple-100 text-purple-700' },
  submitted: { label: 'Enviou feedback', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function FeedbackBetaSection({ user, onActionComplete, handleAction, actionLoading }) {
  const [tagInput, setTagInput] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const status = user?.feedback_status || 'none';
  const tags = user?.feedback_tags || [];
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.none;

  const setFeedbackStatus = async (newStatus) => {
    const data = { feedback_status: newStatus };
    if (tags.length > 0) data.feedback_tags = tags;
    await handleAction('set_feedback_beta', data);
  };

  const handleRemove = async () => {
    await handleAction('set_feedback_beta', { feedback_status: 'none', feedback_tags: [] });
    setShowRemoveConfirm(false);
  };

  const addTag = async () => {
    if (!tagInput.trim()) return;
    const newTags = [...new Set([...tags, tagInput.trim()])];
    await handleAction('set_feedback_beta', {
      feedback_status: status === 'none' ? 'eligible' : status,
      feedback_tags: newTags,
    });
    setTagInput('');
  };

  const removeTag = async (tag) => {
    const newTags = tags.filter(t => t !== tag);
    await handleAction('set_feedback_beta', {
      feedback_status: status,
      feedback_tags: newTags,
    });
  };

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-background/50">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="w-4 h-4 text-primary" />
        <Label className="font-semibold text-foreground">Pesquisa de Experiência</Label>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge className={`${cfg.cls} border-0 text-xs`}>{cfg.label}</Badge>
        </div>
        {user?.feedback_invited_at && (
          <span className="text-[10px] text-muted-foreground">
            Convidado: {new Date(user.feedback_invited_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {status === 'none' && (
          <Button size="sm" variant="outline" onClick={() => setFeedbackStatus('eligible')} disabled={actionLoading}>
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Tornar elegível
          </Button>
        )}
        {(status === 'none' || status === 'eligible') && (
          <Button size="sm" onClick={() => setFeedbackStatus('invited')} disabled={actionLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
            Enviar convite
          </Button>
        )}
        {status !== 'none' && (
          <Button size="sm" variant="outline" onClick={() => setShowRemoveConfirm(true)} disabled={actionLoading}
            className="text-red-600 border-red-200 hover:bg-red-50">
            <UserMinus className="w-3.5 h-3.5 mr-1" /> Remover da pesquisa
          </Button>
        )}
      </div>

      {/* Feedback tags */}
      {status !== 'none' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tags de feedback</Label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] gap-1 pr-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ex: power_user"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" variant="outline" onClick={addTag} disabled={!tagInput.trim() || actionLoading}
              className="h-7 text-xs px-2">
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Submitted info */}
      {status === 'submitted' && user?.feedback_submitted_at && (
        <p className="text-[10px] text-emerald-600">
          Feedback enviado em: {new Date(user.feedback_submitted_at).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Confirm remove */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da pesquisa de experiência?</AlertDialogTitle>
            <AlertDialogDescription>
              O status será resetado para "não participante" e os dados de convite serão limpos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700 text-white">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}