import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  UserPlus, LogIn, Activity, Send, PackageCheck, Scale, EyeOff, Clock
} from 'lucide-react';

const EVENT_CONFIG = {
  created:     { icon: UserPlus,     color: 'bg-emerald-500', label: 'Conta criada' },
  first_active:{ icon: LogIn,        color: 'bg-blue-500',    label: 'Primeiro acesso' },
  last_active: { icon: Activity,     color: 'bg-blue-500',    label: 'Última atividade' },
  application: { icon: Send,         color: 'bg-primary',  label: 'Aplicou em campanha' },
  delivery:    { icon: PackageCheck,  color: 'bg-amber-500',   label: 'Entrega enviada' },
  dispute:     { icon: Scale,         color: 'bg-red-500',     label: 'Disputa aberta' },
  hidden:      { icon: EyeOff,       color: 'bg-zinc-500',    label: 'Usuário ocultado pelo admin' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function UserActivityTimeline({ user, profile, profileType }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    buildTimeline();
  }, [user?.id]);

  const buildTimeline = async () => {
    setLoading(true);
    const timeline = [];

    // Static events from user data
    if (user.created_date) {
      timeline.push({ type: 'created', date: user.created_date });
    }
    if (user.first_active) {
      timeline.push({ type: 'first_active', date: user.first_active });
    }
    if (user.last_active && user.last_active !== user.first_active) {
      timeline.push({ type: 'last_active', date: user.last_active });
    }
    if (profile?.is_hidden) {
      timeline.push({ type: 'hidden', date: profile.updated_date || user.created_date, subtitle: 'Perfil oculto pelo admin' });
    }

    // Fetch related entities
    try {
      const profileId = profile?.id;
      if (profileId) {
        const [apps, deliveries, disputes] = await Promise.all([
          base44.entities.Application.filter(
            profileType === 'creator' ? { creator_id: profileId } : { brand_id: profileId },
            '-created_date', 5
          ),
          base44.entities.Delivery.filter(
            profileType === 'creator' ? { creator_id: profileId } : { brand_id: profileId },
            '-created_date', 5
          ),
          base44.entities.Dispute.filter(
            profileType === 'creator' ? { creator_id: profileId } : { brand_id: profileId },
            '-created_date', 3
          ),
        ]);

        (apps || []).forEach(a => timeline.push({ type: 'application', date: a.created_date, subtitle: `Status: ${a.status || '—'}` }));
        (deliveries || []).forEach(d => timeline.push({ type: 'delivery', date: d.submitted_at || d.created_date, subtitle: `Status: ${d.status || '—'}` }));
        (disputes || []).forEach(d => timeline.push({ type: 'dispute', date: d.created_date, subtitle: d.reason ? d.reason.substring(0, 60) : '' }));
      }
    } catch (err) {
      console.error('Error loading timeline data:', err);
    }

    // Sort newest first
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEvents(timeline);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4 rounded-xl border border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <Label className="font-semibold text-foreground">Histórico do Usuário</Label>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-background/50">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <Label className="font-semibold text-foreground">Histórico do Usuário</Label>
        <Badge variant="outline" className="text-[10px] ml-auto">{events.length} evento(s)</Badge>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum evento registrado.</p>
      ) : (
        <div className="relative ml-3">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-0">
            {events.map((evt, i) => {
              const cfg = EVENT_CONFIG[evt.type] || EVENT_CONFIG.created;
              const IconComp = cfg.icon;
              return (
                <div key={`${evt.type}-${i}`} className="relative flex items-start gap-3 py-2">
                  {/* Dot */}
                  <div className={`w-[11px] h-[11px] rounded-full ${cfg.color} flex-shrink-0 mt-0.5 ring-2 ring-card z-10`} />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <IconComp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground">{cfg.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(evt.date)} {formatTime(evt.date) && `às ${formatTime(evt.date)}`}
                    </p>
                    {evt.subtitle && (
                      <p className="text-[10px] text-muted-foreground/60 truncate">{evt.subtitle}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}