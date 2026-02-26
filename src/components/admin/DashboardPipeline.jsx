import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown } from 'lucide-react';

const PIPELINE_CONFIG = {
  draft: { label: 'Rascunho', color: '#94a3b8' },
  under_review: { label: 'Em Revisão', color: '#f59e0b' },
  active: { label: 'Ativas', color: '#10b981' },
  applications_closed: { label: 'Inscr. Fechadas', color: '#6366f1' },
  completed: { label: 'Concluídas', color: '#3b82f6' },
  paused: { label: 'Pausadas', color: '#fb923c' },
  cancelled: { label: 'Canceladas', color: '#ef4444' },
};

export default function DashboardPipeline({ pipeline, funnelData }) {
  if (!pipeline) return null;

  const pipelineData = Object.entries(PIPELINE_CONFIG).map(([key, cfg]) => ({
    key,
    stage: cfg.label,
    value: pipeline[key] || 0,
    color: cfg.color,
  }));

  const totalCampaigns = pipelineData.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...pipelineData.map(d => d.value), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline — lista com barras individuais */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Pipeline de Campanhas</h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {totalCampaigns} total
            </span>
          </div>

          <div className="space-y-1.5">
            {pipelineData.map(item => {
              const pct = totalCampaigns > 0 ? Math.round((item.value / totalCampaigns) * 100) : 0;
              const barWidth = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
              return (
                <div key={item.key} className="flex items-center gap-1.5 h-7">
                  {/* Status dot + label */}
                  <div className="flex items-center gap-1.5 w-[82px] sm:w-[90px] flex-shrink-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-muted-foreground truncate leading-none">{item.stage}</span>
                  </div>

                  {/* Count */}
                  <span className="text-[11px] font-bold text-foreground w-4 text-right flex-shrink-0 tabular-nums">
                    {item.value}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden min-w-0">
                    {item.value > 0 && (
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(barWidth, 4)}%`,
                          backgroundColor: item.color,
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </div>

                  {/* Percentage */}
                  <span className={`text-[10px] w-[26px] text-right flex-shrink-0 tabular-nums ${item.value > 0 ? 'text-muted-foreground font-medium' : 'text-muted-foreground/25'}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Funnel */}
      {funnelData && funnelData.length > 0 && (
        <Card className="bg-card border">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Funil de Conversão</h3>
            <div className="space-y-0">
              {funnelData.map((item, i) => {
                const firstVal = funnelData[0]?.value || 1;
                const widthPct = firstVal > 0 ? Math.max((item.value / firstVal) * 100, 18) : 18;
                const prevVal = i > 0 ? funnelData[i - 1].value : 0;
                const dropRate = i > 0 && prevVal > 0
                  ? Math.round((item.value / prevVal) * 100)
                  : null;
                return (
                  <React.Fragment key={item.stage}>
                    {i > 0 && (
                      <div className="flex items-center justify-center py-0.5">
                        <ArrowDown className="w-3 h-3 text-muted-foreground/40" />
                        {dropRate !== null && (
                          <span className={`text-[9px] ml-1 font-medium ${dropRate >= 50 ? 'text-emerald-600' : dropRate >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                            {dropRate}%
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-center">
                      <div
                        className="h-8 rounded-lg flex items-center justify-between px-3 transition-all"
                        style={{
                          width: `${widthPct}%`,
                          minWidth: '120px',
                          maxWidth: '100%',
                          backgroundColor: item.color,
                          opacity: 0.9
                        }}
                      >
                        <span className="text-[10px] font-medium text-white truncate">{item.stage}</span>
                        <span className="text-[11px] font-bold text-white ml-2">{item.value}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            {funnelData.length >= 2 && (
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">Taxa geral (início → fim)</span>
                {(() => {
                  const rate = funnelData[0]?.value > 0
                    ? Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)
                    : 0;
                  return (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${rate >= 50 ? 'bg-emerald-600' : rate >= 20 ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {rate}%
                    </span>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}