import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function TrendBadge({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const prev = Number(previous) || 0;
  const curr = Number(current) || 0;
  if (prev === 0 && curr === 0) return null;

  const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : (curr > 0 ? 100 : 0);
  const isPositive = pct > 0;
  const isNeutral = pct === 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
      isNeutral ? 'bg-muted text-muted-foreground' :
      isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
    }`}>
      {isNeutral ? <Minus className="w-2.5 h-2.5" /> : isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {Math.abs(pct)}%
    </span>
  );
}

export default function DashboardMetricCard({ label, value, subtitle, secondaryLabel, icon: Icon, iconColor = 'text-blue-600', trend, previousValue, tooltip }) {
  const hasTrend = trend !== undefined || previousValue !== undefined;
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;

  return (
    <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70 truncate">{label}</p>
              {tooltip && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 cursor-help flex-shrink-0 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-[1.75rem] font-bold tracking-tight tabular-nums text-foreground leading-none">
                {value}
              </p>
              {hasTrend && (
                <TrendBadge current={numericValue} previous={previousValue} />
              )}
            </div>
            {!hasTrend && !subtitle && (
              <p className="text-[10px] mt-0.5 text-muted-foreground/40">— sem mudança</p>
            )}
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] mt-0.5 text-muted-foreground leading-tight">{subtitle}</p>
            )}
            <p className="text-[10px] mt-0.5 text-muted-foreground/50 leading-tight">{secondaryLabel || '—'}</p>
          </div>
          {Icon && (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100').replace('-400', '-100')}`}>
              <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${iconColor}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}