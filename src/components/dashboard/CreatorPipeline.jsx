import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";


const STAGES = [
  { key: 'sent', label: 'Enviadas', filter: null, page: 'MyApplications' },
  { key: 'pending', label: 'Em análise', filter: 'pending', page: 'MyApplications' },
  { key: 'accepted', label: 'Aceitas', filter: 'accepted', page: 'MyApplications' },
  { key: 'in_delivery', label: 'Em entrega', filter: null, page: 'MyDeliveries' },
  { key: 'completed', label: 'Concluídas', filter: 'approved', page: 'MyDeliveries' },
];

export default function CreatorPipeline({ appCounts = {}, delCounts = {}, totalApps = 0 }) {
  const counts = {
    sent: totalApps,
    pending: appCounts.pending || 0,
    accepted: appCounts.accepted || 0,
    in_delivery: (delCounts.pending || 0) + (delCounts.submitted || 0),
    completed: delCounts.approved || 0,
  };

  const allZero = Object.values(counts).every(v => v === 0);

  if (allZero) {
    return (
      <div className="rounded-xl bg-card border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Sua jornada começa com a primeira candidatura
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className="flex-1 min-w-[80px] flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-dashed border-border/50 text-center opacity-50"
            >
              <span className="text-lg font-semibold tabular-nums text-muted-foreground">—</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stage.label}</span>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('OpportunityFeed')}>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
            Ver campanhas disponíveis
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {STAGES.map((stage) => {
        const count = counts[stage.key];
        const url = createPageUrl(stage.page) + (stage.filter ? `?filter=${stage.filter}` : '');
        return (
          <Link
            key={stage.key}
            to={url}
            className="flex-1 min-w-[80px] flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-card border hover:bg-muted/50 transition-colors cursor-pointer text-center"
          >
            <span className="text-lg font-semibold tabular-nums text-foreground">{count}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stage.label}</span>
          </Link>
        );
      })}
    </div>
  );
}