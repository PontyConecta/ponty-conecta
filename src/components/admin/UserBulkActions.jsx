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

export default function UserBulkActions({ selectedIds, users, brands, creators, onClear, onComplete }) {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkTag, setBulkTag] = useState('');

  if (selectedIds.length === 0) return null;

  const needsTag = action === 'add_tag' || action === 'remove_tag';

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

    for (const userId of selectedIds) {
      try {
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
          default:
            continue;
        }

        await base44.functions.invoke('adminManageUser', { userId, action: actionName, data: { ...data, auditNote: `Ação em massa: ${action}` } });
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Error on user ${userId}:`, err);
      }
    }

    setLoading(false);
    
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

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border flex-wrap" style={{ backgroundColor: 'rgba(144, 56, 250, 0.05)', borderColor: 'rgba(144, 56, 250, 0.2)' }}>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" style={{ color: '#9038fa' }} />
        <Badge className="bg-[#9038fa] text-white border-0">{selectedIds.length} selecionado(s)</Badge>
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
          <SelectItem value="set_ready">Marcar conta como Pronta</SelectItem>
          <SelectItem value="exclude_financials">Excluir dos Financeiros</SelectItem>
          <SelectItem value="include_financials">Incluir nos Financeiros</SelectItem>
          <SelectItem value="add_tag">Adicionar Tag</SelectItem>
          <SelectItem value="remove_tag">Remover Tag</SelectItem>
        </SelectContent>
      </Select>

      {needsTag && (
        <div className="flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          <Input
            placeholder="Nome da tag..."
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
            className="w-36 h-8 text-sm"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
          />
        </div>
      )}

      <Button 
        onClick={handleExecute} 
        disabled={loading || !action || (needsTag && !bulkTag.trim())}
        className="bg-[#9038fa] hover:bg-[#7a2de0] text-white"
        size="sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
        Executar
      </Button>

      <Button variant="ghost" size="sm" onClick={onClear}>
        <X className="w-4 h-4 mr-1" /> Limpar
      </Button>
    </div>
  );
}