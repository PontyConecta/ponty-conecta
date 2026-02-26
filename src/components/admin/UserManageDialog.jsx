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
  AlertTriangle, Eye, Calendar, Mail, EyeOff
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
      console.error('[UserManageDialog]', action, error.message);
      toast.error('Erro ao realizar ação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSubscription = () => {
    const data = { subscription_status: newSubscriptionStatus };
    if (newSubscriptionStatus === 'trial') data.trial_days = trialDays;
    handleAction('set_subscription_status', data);
  };

  const handleSaveAccountState = () => handleAction('set_account_state', { account_state: newAccountState });
  const handleToggleVerified = () => handleAction('toggle_verified');
  const handleSaveRole = () => handleAction('set_user_role', { role: newRole });

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 text-primary" />
            Gerenciar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* User Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="w-14 h-14 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold tracking-tight truncate text-foreground">
                {profileType === 'brand' ? profile.company_name : profile.display_name || user.full_name || 'Sem nome'}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
              {user.tags && user.tags.length > 0 && (
                <div className="mt-2">
                  <UserTagBadges tags={user.tags} maxShow={6} />
                </div>
              )}
            </div>
          </div>

          {/* Role Info */}
          <SectionCard icon={Shield} label="Papel do Usuário">
            <div className="flex items-center gap-3">
              <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-700 border-0' : 'bg-slate-100 text-slate-700 border-0'}>
                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Para promover ou remover admin, acesse o <strong>Painel Base44</strong> → Dashboard → Usuários e altere o role diretamente. 
              A plataforma restringe essa alteração via app por segurança.
            </p>
          </SectionCard>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCell label="Estado da Conta" value={profile.account_state === 'ready' ? '✅ Pronta' : '⏳ Incompleta'} />
            <InfoCell label="Onboarding" value={`Passo ${profile.onboarding_step || 1} de 4`} />
            <InfoCell label="Cadastrado em" value={new Date(user.created_date).toLocaleDateString('pt-BR')} />
            <InfoCell label="Stripe ID" value={profile.stripe_customer_id || 'Nenhum'} truncate />
          </div>

          {/* Subscription Management */}
          <SectionCard icon={Crown} label="Assinatura">
            <div className="flex items-center gap-3">
              <Select value={newSubscriptionStatus} onValueChange={setNewSubscriptionStatus}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (Gratuito)</SelectItem>
                  <SelectItem value="premium">Premium (Pago)</SelectItem>
                  <SelectItem value="trial">Trial (Teste Grátis)</SelectItem>
                  <SelectItem value="legacy">Legacy (Cancelou mas ainda ativo)</SelectItem>
                  <SelectItem value="pending">Pendente (Pagamento atrasado)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSaveSubscription} disabled={actionLoading || newSubscriptionStatus === profile.subscription_status} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
            {newSubscriptionStatus === 'trial' && (
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap text-muted-foreground">Dias de trial:</Label>
                <Select value={String(trialDays)} onValueChange={(v) => setTrialDays(Number(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90, 120, 180, 270, 365].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} dias</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {profile.trial_end_date && profile.subscription_status === 'trial' && (
              <p className="text-xs flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Trial expira em: {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
          </SectionCard>

          {/* Account State */}
          <SectionCard icon={Eye} label="Estado da Conta">
            <div className="flex items-center gap-3">
              <Select value={newAccountState} onValueChange={setNewAccountState}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete">Incompleta (precisa completar onboarding)</SelectItem>
                  <SelectItem value="ready">Pronta (perfil completo)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSaveAccountState} disabled={actionLoading || newAccountState === profile.account_state} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </SectionCard>

          {/* Verification */}
          <SectionCard icon={CheckCircle2} label="Verificação">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex-1">
                {profile.is_verified 
                  ? 'Este perfil está verificado e exibe o selo.' 
                  : 'Este perfil ainda não foi verificado.'}
              </p>
              <Button onClick={handleToggleVerified} disabled={actionLoading} variant={profile.is_verified ? 'outline' : 'default'} size="sm"
                className={!profile.is_verified ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                  profile.is_verified ? 'Remover Verificação' : 'Verificar Perfil'}
              </Button>
            </div>
          </SectionCard>

          {/* Exclude from Financials */}
          <SectionCard icon={EyeOff} label="Excluir dos Cálculos Financeiros">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex-1">
                {excludeFromFinancials 
                  ? 'Excluído dos cálculos de MRR, receita e métricas financeiras.' 
                  : 'Ative para excluir das métricas financeiras (útil para contas de teste).'}
              </p>
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
          </SectionCard>

          {/* Tags */}
          <UserTagManager
            tags={user?.tags || []}
            loading={actionLoading}
            onSave={(tags) => handleAction('set_tags', { tags })}
          />

          {/* Audit Note */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nota de Auditoria (opcional)</Label>
            <Textarea
              placeholder="Motivo da alteração..."
              value={auditNote}
              onChange={(e) => setAuditNote(e.target.value)}
              rows={2}
              className="bg-background"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({ icon: Icon, label, children }) {
  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-background/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <Label className="font-semibold text-foreground">{label}</Label>
      </div>
      {children}
    </div>
  );
}

function InfoCell({ label, value, truncate }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs mb-1 text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm text-foreground ${truncate ? 'truncate' : ''}`}>{value}</p>
    </div>
  );
}