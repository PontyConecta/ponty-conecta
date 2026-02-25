import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, Building2, Star, Shield, CheckCircle2, Crown, 
  Gift, AlertTriangle, Eye, Calendar, Mail, Globe, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import UserTagManager from './UserTagManager';
import { UserTagBadges } from './UserTagManager';

export default function UserManageDialog({ open, onOpenChange, user, profile, profileType, onActionComplete }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [newSubscriptionStatus, setNewSubscriptionStatus] = useState(profile?.subscription_status || 'starter');
  const [newAccountState, setNewAccountState] = useState(profile?.account_state || 'incomplete');
  const [newVerified, setNewVerified] = useState(profile?.is_verified || false);
  const [auditNote, setAuditNote] = useState('');
  const [trialDays, setTrialDays] = useState(30);
  const [newRole, setNewRole] = useState(user?.role || 'user');
  const [excludeFromFinancials, setExcludeFromFinancials] = useState(user?.exclude_from_financials || false);

  // Reset state when user/profile changes
  React.useEffect(() => {
    if (user && profile) {
      setNewSubscriptionStatus(profile.subscription_status || 'starter');
      setNewAccountState(profile.account_state || 'incomplete');
      setNewVerified(profile.is_verified || false);
      setNewRole(user.role || 'user');
      setExcludeFromFinancials(user.exclude_from_financials || false);
      setAuditNote('');
      setTrialDays(30);
    }
  }, [user?.id, profile?.id]);

  if (!user || !profile) return null;

  const handleAction = async (action, data = {}) => {
    setActionLoading(true);
    try {
      await base44.functions.invoke('adminManageUser', { 
        userId: user.id, 
        action, 
        data: { ...data, auditNote } 
      });
      toast.success('Alteração realizada com sucesso!');
      setAuditNote('');
      onActionComplete?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao realizar ação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSubscription = () => {
    const data = { subscription_status: newSubscriptionStatus };
    if (newSubscriptionStatus === 'trial') {
      data.trial_days = trialDays;
    }
    handleAction('set_subscription_status', data);
  };

  const handleSaveAccountState = () => {
    handleAction('set_account_state', { account_state: newAccountState });
  };

  const handleToggleVerified = () => {
    handleAction('toggle_verified');
  };

  const handleSaveRole = () => {
    handleAction('set_user_role', { role: newRole });
  };

  const subscriptionBadge = (status) => {
    const configs = {
      starter: { label: 'Starter', className: 'bg-slate-100 text-slate-700' },
      premium: { label: 'Premium', className: 'bg-emerald-100 text-emerald-700' },
      trial: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
      legacy: { label: 'Legacy', className: 'bg-amber-100 text-amber-700' },
      pending: { label: 'Pendente', className: 'bg-red-100 text-red-700' },
    };
    const c = configs[status] || configs.starter;
    return <Badge className={`${c.className} border-0`}>{c.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-5 h-5" style={{ color: '#9038fa' }} />
            Gerenciar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* User Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
              <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: 'rgba(144, 56, 250, 0.1)', color: '#9038fa' }}>
                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {profileType === 'brand' ? profile.company_name : profile.display_name || user.full_name || 'Sem nome'}
              </h3>
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={profileType === 'brand' ? 'bg-indigo-100 text-indigo-700 border-0' : 'bg-orange-100 text-orange-700 border-0'}>
                  {profileType === 'brand' ? <><Building2 className="w-3 h-3 mr-1" /> Marca</> : <><Star className="w-3 h-3 mr-1" /> Criador</>}
                </Badge>
                {user.role === 'admin' && (
                  <Badge className="bg-red-100 text-red-700 border-0">
                    <Shield className="w-3 h-3 mr-1" /> Admin
                  </Badge>
                )}
                {subscriptionBadge(profile.subscription_status)}
                {profile.is_verified && (
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verificado
                  </Badge>
                )}
                {user.exclude_from_financials && (
                  <Badge className="bg-orange-100 text-orange-700 border-0">
                    <EyeOff className="w-3 h-3 mr-1" /> Excl. Financeiro
                  </Badge>
                )}
              </div>
              {/* Tags display */}
              {user.tags && user.tags.length > 0 && (
                <div className="mt-2">
                  <UserTagBadges tags={user.tags} maxShow={6} />
                </div>
              )}
            </div>
          </div>

          {/* Role Management */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#9038fa' }} />
              <Label className="font-semibold" style={{ color: 'var(--text-primary)' }}>Papel do Usuário</Label>
            </div>
            <div className="flex items-center gap-3">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário (padrão)</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSaveRole} 
                disabled={actionLoading || newRole === user.role}
                className="bg-[#9038fa] hover:bg-[#7a2de0] text-white"
                size="sm"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Administradores têm acesso ao painel admin, gerenciamento de usuários e moderação.
            </p>
          </div>

          {/* Current Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Estado da Conta</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {profile.account_state === 'ready' ? '✅ Pronta' : '⏳ Incompleta'}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Onboarding</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Passo {profile.onboarding_step || 1} de 4
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Cadastrado em</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {new Date(user.created_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Stripe ID</p>
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {profile.stripe_customer_id || 'Nenhum'}
              </p>
            </div>
          </div>

          {/* Subscription Management */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color: '#9038fa' }} />
              <Label className="font-semibold" style={{ color: 'var(--text-primary)' }}>Assinatura</Label>
            </div>
            <div className="flex items-center gap-3">
              <Select value={newSubscriptionStatus} onValueChange={setNewSubscriptionStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (Gratuito)</SelectItem>
                  <SelectItem value="premium">Premium (Pago)</SelectItem>
                  <SelectItem value="trial">Trial (Teste Grátis)</SelectItem>
                  <SelectItem value="legacy">Legacy (Cancelou mas ainda ativo)</SelectItem>
                  <SelectItem value="pending">Pendente (Pagamento atrasado)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSaveSubscription} 
                disabled={actionLoading || newSubscriptionStatus === profile.subscription_status}
                className="bg-[#9038fa] hover:bg-[#7a2de0] text-white"
                size="sm"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            {newSubscriptionStatus === 'trial' && (
              <div className="flex items-center gap-3 pl-1">
                <Label className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Dias de trial:</Label>
                <Select value={String(trialDays)} onValueChange={(v) => setTrialDays(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="120">120 dias</SelectItem>
                    <SelectItem value="180">180 dias</SelectItem>
                    <SelectItem value="270">270 dias</SelectItem>
                    <SelectItem value="365">365 dias (1 ano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {profile.trial_end_date && profile.subscription_status === 'trial' && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-3 h-3" />
                Trial expira em: {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Account State Management */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: '#9038fa' }} />
              <Label className="font-semibold" style={{ color: 'var(--text-primary)' }}>Estado da Conta</Label>
            </div>
            <div className="flex items-center gap-3">
              <Select value={newAccountState} onValueChange={setNewAccountState}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete">Incompleta (precisa completar onboarding)</SelectItem>
                  <SelectItem value="ready">Pronta (perfil completo)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSaveAccountState} 
                disabled={actionLoading || newAccountState === profile.account_state}
                className="bg-[#9038fa] hover:bg-[#7a2de0] text-white"
                size="sm"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#9038fa' }} />
                <Label className="font-semibold" style={{ color: 'var(--text-primary)' }}>Verificação</Label>
              </div>
              <Button 
                onClick={handleToggleVerified} 
                disabled={actionLoading}
                variant={profile.is_verified ? 'outline' : 'default'}
                size="sm"
                className={!profile.is_verified ? 'bg-[#9038fa] hover:bg-[#7a2de0] text-white' : ''}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                  profile.is_verified ? 'Remover Verificação' : 'Verificar Perfil'}
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {profile.is_verified 
                ? 'Este perfil está verificado e exibe o selo de verificação.' 
                : 'Este perfil ainda não foi verificado.'}
            </p>
          </div>

          {/* Exclude from Financials */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" style={{ color: '#9038fa' }} />
                <Label className="font-semibold" style={{ color: 'var(--text-primary)' }}>Excluir dos Cálculos Financeiros</Label>
              </div>
              <Button 
                onClick={async () => {
                  const newVal = !excludeFromFinancials;
                  await handleAction('set_exclude_financials', { exclude_from_financials: newVal });
                  setExcludeFromFinancials(newVal);
                }} 
                disabled={actionLoading}
                variant={excludeFromFinancials ? 'default' : 'outline'}
                size="sm"
                className={excludeFromFinancials ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                  excludeFromFinancials ? 'Excluído ✓' : 'Excluir'}
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {excludeFromFinancials 
                ? 'Este usuário está sendo excluído dos cálculos de MRR, receita e métricas financeiras do Stripe.' 
                : 'Ative para que as assinaturas deste usuário não sejam contabilizadas nas métricas financeiras (útil para contas de teste).'}
            </p>
          </div>

          {/* Tags */}
          <UserTagManager
            tags={user?.tags || []}
            loading={actionLoading}
            onSave={(tags) => handleAction('set_tags', { tags })}
          />

          {/* Audit Note */}
          <div className="space-y-2">
            <Label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nota de Auditoria (opcional)</Label>
            <Textarea
              placeholder="Motivo da alteração..."
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              rows={2}
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}