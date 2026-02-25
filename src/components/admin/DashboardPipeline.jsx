import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown } from 'lucide-react';

const PIPELINE_CONFIG = {
  draft: { label: 'Rascunho', color: '#94a3b8' },
  under_review: { label: 'Em Revisão', color: '#f59e0b' },
  active: { label: 'Ativas', color: '#10b981' },
  applications_closed: { label: 'Inscrições Fechadas', color: '#6366f1' },
  completed: { label: 'Concluídas', color: '#3b82f6' },
  paused: { label: 'Pausadas', color: '#fb923c' },
  cancelled: { label: 'Canceladas', color: '#ef4444' },
};

export default function DashboardPipeline({ pipeline, funnelData }) {
  if (!pipeline) return null;

  const pipelineData = Object.entries(PIPELINE_CONFIG)
    .map(([key, cfg]) => ({
      stage: cfg.label,
      value: pipeline[key] || 0,
      color: cfg.color,
    }))
    .filter(d => d.value > 0);

  const totalCampaigns = Object.values(pipeline).reduce((s, v) => s + (v || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline - compact horizontal bars */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pipeline de Campanhas</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
              {totalCampaigns} total
            </span>
          </div>
          {pipelineData.length > 0 ? (
            <div className="space-y-1.5">
              {pipelineData.map(item => {
                const pct = totalCampaigns > 0 ? Math.round((item.value / totalCampaigns) * 100) : 0;
                return (
                  <div key={item.stage} className="flex items-center gap-2">
                    <span className="text-[11px] w-24 truncate text-right flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{item.stage}</span>
                    <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div 
                        className="h-full rounded flex items-center px-1.5 transition-all"
                        style={{ 
                          width: `${Math.max(pct, 12)}%`,
                          backgroundColor: item.color 
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">{item.value}</span>
                      </div>
                    </div>
                    <span className="text-[10px] w-8 text-right flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>Sem dados de pipeline</p>
          )}
        </CardContent>
      </Card>

      {/* Funnel - step-based vertical flow */}
      {funnelData && funnelData.length > 0 && (
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Funil de Conversão</h3>
            <div className="space-y-0">
              {funnelData.map((item, i) => {
                const firstVal = funnelData[0]?.value || 1;
                const widthPct = Math.max((item.value / firstVal) * 100, 20);
                const dropRate = i > 0 && funnelData[i - 1].value > 0 
                  ? Math.round((item.value / funnelData[i - 1].value) * 100) 
                  : null;
                return (
                  <React.Fragment key={item.stage}>
                    {i > 0 && (
                      <div className="flex items-center justify-center py-0.5">
                        <ArrowDown className="w-3 h-3" style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                        {dropRate !== null && (
                          <span className="text-[9px] ml-1 font-medium" style={{ color: dropRate >= 50 ? '#10b981' : dropRate >= 20 ? '#f59e0b' : '#ef4444' }}>
                            {dropRate}%
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center mx-auto" style={{ width: `${widthPct}%`, minWidth: '100%' }}>
                      <div 
                        className="h-8 rounded-lg flex items-center justify-between px-3 transition-all mx-auto"
                        style={{ 
                          width: `${widthPct}%`,
                          minWidth: '120px',
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
            {/* Conversion summary */}
            <div className="mt-3 pt-2 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Taxa geral (início → fim)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ 
                color: 'white',
                backgroundColor: funnelData[0]?.value > 0 && Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100) >= 50 ? '#10b981' : '#f59e0b'
              }}>
                {funnelData[0]?.value > 0 
                  ? `${Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)}%` 
                  : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}