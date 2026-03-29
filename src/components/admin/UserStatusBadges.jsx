import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EyeOff, Ghost, Moon, Sparkles, Crown, MessageSquarePlus, Clock } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

const BADGE_CONFIG = {
  hidden:       { label: 'Oculto',        icon: EyeOff,   cls: 'bg-red-100 text-red-700',    tip: 'Oculto: usuário invisível no app' },
  never_active: { label: 'Nunca acessou', icon: Ghost,    cls: 'bg-zinc-100 text-zinc-600',   tip: 'Nunca acessou: ainda não houve primeiro acesso' },
  inactive:     { label: 'Inativo',       icon: Moon,     cls: 'bg-orange-100 text-orange-700', tip: 'Inativo: sem acesso há mais de 30 dias' },
  new_user:     { label: 'Novo',          icon: Sparkles, cls: 'bg-emerald-100 text-emerald-700', tip: 'Novo: conta criada nos últimos 7 dias' },
  premium:      { label: 'Premium',       icon: Crown,    cls: 'bg-amber-100 text-amber-700', tip: 'Premium: assinatura ativa' },
  trial:        { label: 'Trial',         icon: Clock,    cls: 'bg-amber-100 text-amber-700', tip: 'Trial ativo' },
  feedback_beta:{ label: 'Pesquisa',      icon: MessageSquarePlus, cls: 'bg-primary/10 text-primary', tip: 'Pesquisa de experiência: participando da pesquisa' },
};

// Priority order for badge display
const PRIORITY = ['hidden', 'never_active', 'inactive', 'new_user', 'trial', 'premium', 'feedback_beta'];

export function getUserBadgeKeys(user, profile) {
  const now = Date.now();
  const keys = [];

  if (profile?.is_hidden) keys.push('hidden');
  if (!user.first_active) keys.push('never_active');

  const lastActive = user.last_active ? new Date(user.last_active).getTime() : 0;
  if (!lastActive || (now - lastActive) > 30 * DAY_MS) keys.push('inactive');

  const created = user.created_date ? new Date(user.created_date).getTime() : 0;
  if (created && (now - created) < 7 * DAY_MS) keys.push('new_user');

  const sub = profile?.subscription_status;
  if (sub === 'premium') {
    const trialEnd = profile?.trial_end_date;
    if (trialEnd && new Date(trialEnd) > new Date()) {
      const daysLeft = Math.ceil((new Date(trialEnd) - Date.now()) / 86400000);
      keys.push('trial');
      // Store daysLeft for tooltip
      keys._trialDaysLeft = daysLeft;
    } else {
      keys.push('premium');
    }
  }

  if (user.feedback_status && user.feedback_status !== 'none') keys.push('feedback_beta');

  return keys.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
}

export default function UserStatusBadges({ user, profile, maxShow = 2 }) {
  const keys = getUserBadgeKeys(user, profile);
  if (keys.length === 0) return null;

  const visible = keys.slice(0, maxShow);
  const remaining = keys.length - maxShow;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 flex-wrap">
        {visible.map(key => {
          const cfg = BADGE_CONFIG[key];
          if (!cfg) return null;
          const IconComp = cfg.icon;
          const tipText = key === 'trial' && keys._trialDaysLeft
            ? `Trial ativo — expira em ${keys._trialDaysLeft} dias`
            : cfg.tip;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-start">
                  <Badge className={`${cfg.cls} border-0 text-[10px] px-1.5 py-0 gap-0.5 cursor-default`}>
                    <IconComp className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </Badge>
                  {key === 'trial' && keys._trialDaysLeft && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">expira em {keys._trialDaysLeft}d</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">
                <p>{tipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remaining > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 cursor-default">
                +{remaining}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-0.5">
                {keys.slice(maxShow).map(k => (
                  <p key={k}>{BADGE_CONFIG[k]?.tip}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}