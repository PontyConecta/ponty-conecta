import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Users, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function UserBulkActions({ selectedIds, users, brands, creators, onClear, onComplete, selectionScope }) {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkTag, setBulkTag] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  if (selectedIds.length === 0) return null;

  const needsTag = action === 'add_tag' || action === 'remove_tag';
  const needsTrialDays = action === 'set_trial_custom';

  const handleExecute = async () => {
    if (!action) {
      toast.error('Selecione uma ação');
      return;
    }
    if (needsTag && !bulkTag.trim()) {
      toast.error('Digite o nome da tag');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const total = selectedIds.length;
    setProgress({ done: 0, total });

    // Process in batches of 5 for better UX feedback
    const BATCH = 5;
    for (let i = 0; i < selectedIds.length; i += BATCH) {
      const batch = selectedIds.slice(i, i + BATCH);
      const results = await Promise.allSettled(batch.map(async (userId) => {
        let actionName = '';
        let data = {};

        switch (action) {
          case 'verify':
            actionName = 'toggle_verified';
            break;
          case 'set_premium':
            actionName = 'set_subscription_status';
            data = { subscription_status: 'premium' };
            break;
          case 'set_starter':
            actionName = 'set_subscription_status';
            data = { subscription_status: 'starter' };
            break;
          case 'set_trial_30':
            actionName = 'set_subscription_status';
            data = { subscription_status: 'trial', trial_days: 30 };
            break;
          case 'set_trial_365':
            actionName = 'set_subscription_status';
            data = { subscription_status: 'trial', trial_days: 365 };
            break;
          case 'set_trial_custom':
            actionName = 'set_subscription_status';
            data = { subscription_status: 'trial', trial_days: parseInt(bulkTag) || 365 };
            break;
          case 'set_ready':
            actionName = 'set_account_state';
            data = { account_state: 'ready' };
            break;
          case 'exclude_financials':
            actionName = 'bulk_set_exclude_financials';
            data = { exclude_from_financials: true };
            break;
          case 'include_financials':
            actionName = 'bulk_set_exclude_financials';
            data = { exclude_from_financials: false };
            break;
          case 'add_tag':
            actionName = 'bulk_add_tag';
            data = { tag: bulkTag.trim() };
            break;
          case 'remove_tag':
            actionName = 'bulk_remove_tag';
            data = { tag: bulkTag.trim() };
            break;
          case 'feedback_invite':
            actionName = 'set_feedback_beta';
            data = { feedback_status: 'invited' };
            break;
          case 'feedback_remove':
            actionName = 'set_feedback_beta';
            data = { feedback_status: 'none', feedback_tags: [] };
            break;
          default:
            throw new Error('Unknown action');
        }

        return base44.functions.invoke('adminManageUser', { userId, action: actionName, data: { ...data, auditNote: `Ação em massa: ${action} (${total} usuários)` } });
      }));

      for (const r of results) {
        if (r.status === 'fulfilled') successCount++;
        else { errorCount++; console.error('Bulk error:', r.reason); }
      }
      setProgress({ done: Math.min(i + BATCH, total), total });
    }

    setLoading(false);
    setProgress({ done: 0, total: 0 });
    
    if (successCount > 0) {
      toast.success(`${successCount} usuário(s) atualizado(s) com sucesso`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erro(s) durante a execução`);
    }
    
    setAction('');
    setBulkTag('');
    onClear();
    onComplete();
  };

  const scopeLabel = selectionScope === 'filtered' ? 'todos filtrados' : 'da página';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 rounded-xl border flex-wrap" style={{ backgroundColor: 'rgba(125, 176, 75, 0.05)', borderColor: 'rgba(125, 176, 75, 0.2)' }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: '#7DB04B' }} />
          <Badge className="bg-primary text-primary-foreground border-0">
            {selectedIds.length} selecionado(s)
          </Badge>
          <span className="text-[10px] text-muted-foreground">({scopeLabel})</span>
        </div>
        
        <Select value={action} onValueChange={(v) => { setAction(v); setBulkTag(''); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Ação em massa..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="verify">Verificar perfis</SelectItem>
            <SelectItem value="set_premium">Definir como Premium</SelectItem>
            <SelectItem value="set_starter">Definir como Starter</SelectItem>
            <SelectItem value="set_trial_30">Conceder Trial 30 dias</SelectItem>
            <SelectItem value="set_trial_365">Conceder Trial 1 ano</SelectItem>
            <SelectItem value="set_trial_custom">Conceder Trial (dias customizado)</SelectItem>
            <SelectItem value="set_ready">Marcar conta como Pronta</SelectItem>
            <SelectItem value="exclude_financials">Excluir dos Financeiros</SelectItem>
            <SelectItem value="include_financials">Incluir nos Financeiros</SelectItem>
            <SelectItem value="add_tag">Adicionar Tag</SelectItem>
            <SelectItem value="remove_tag">Remover Tag</SelectItem>
            <SelectItem value="feedback_invite">Convidar p/ Feedback Beta</SelectItem>
            <SelectItem value="feedback_remove">Remover do Feedback Beta</SelectItem>
          </SelectContent>
        </Select>

        {(needsTag || needsTrialDays) && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={needsTrialDays ? "Nº de dias (ex: 365)..." : "Nome da tag..."}
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              type={needsTrialDays ? 'number' : 'text'}
              className="w-40 h-8 text-sm"
            />
          </div>
        )}

        <Button 
          onClick={handleExecute} 
          disabled={loading || !action || ((needsTag || needsTrialDays) && !bulkTag.trim())}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Executar
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      </div>

      {/* Progress bar during execution */}
      {loading && progress.total > 0 && (
        <div className="px-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {progress.done}/{progress.total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}