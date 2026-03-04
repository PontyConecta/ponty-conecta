import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Ghost, Activity, Moon, EyeOff, Crown } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

function KpiCard({ icon: Icon, iconColor, label, value, secondary }) {
  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100').replace('-400', '-100')}`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold tabular-nums leading-none text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{label}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1 leading-tight">{secondary}</p>
      </CardContent>
    </Card>
  );
}

export default function UserKpiBar({ users, brands, creators }) {
  const kpis = useMemo(() => {
    const now = Date.now();
    const total = users.length;
    if (total === 0) return { newWeek: 0, neverActive: 0, activeWeek: 0, inactive30: 0, hidden: 0, premiumInactive: 0, total: 0 };

    const getProfile = (userId) => brands.find(b => b.user_id === userId) || creators.find(c => c.user_id === userId);

    let newWeek = 0, neverActive = 0, activeWeek = 0, inactive30 = 0, hidden = 0, premiumInactive = 0;

    users.forEach(u => {
      const profile = getProfile(u.id);
      const created = u.created_date ? new Date(u.created_date).getTime() : 0;
      const lastActive = u.last_active ? new Date(u.last_active).getTime() : 0;
      const firstActive = u.first_active ? new Date(u.first_active).getTime() : 0;

      if (created && (now - created) < 7 * DAY_MS) newWeek++;
      if (!firstActive && !u.first_active) neverActive++;
      if (lastActive && (now - lastActive) < 7 * DAY_MS) activeWeek++;
      if (!lastActive || (now - lastActive) > 30 * DAY_MS) inactive30++;
      if (u.visibility_status === 'hidden') hidden++;

      const sub = profile?.subscription_status;
      if ((sub === 'premium' || sub === 'legacy' || sub === 'trial') && (!lastActive || (now - lastActive) > 30 * DAY_MS)) {
        premiumInactive++;
      }
    });

    return { newWeek, neverActive, activeWeek, inactive30, hidden, premiumInactive, total };
  }, [users, brands, creators]);

  const pct = (v) => kpis.total > 0 ? `${Math.round((v / kpis.total) * 100)}% do total` : '—';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
      <KpiCard icon={UserPlus} iconColor="text-emerald-500" label="Novos (7 dias)" value={kpis.newWeek} secondary={pct(kpis.newWeek)} />
      <KpiCard icon={Ghost} iconColor="text-zinc-400" label="Nunca acessaram" value={kpis.neverActive} secondary={pct(kpis.neverActive)} />
      <KpiCard icon={Activity} iconColor="text-blue-500" label="Ativos (7 dias)" value={kpis.activeWeek} secondary={pct(kpis.activeWeek)} />
      <KpiCard icon={Moon} iconColor="text-orange-500" label="Inativos (30 dias)" value={kpis.inactive30} secondary={pct(kpis.inactive30)} />
      <KpiCard icon={EyeOff} iconColor="text-red-500" label="Ocultos" value={kpis.hidden} secondary={pct(kpis.hidden)} />
      <KpiCard icon={Crown} iconColor="text-amber-500" label="Premium inativos" value={kpis.premiumInactive} secondary={pct(kpis.premiumInactive)} />
    </div>
  );
}