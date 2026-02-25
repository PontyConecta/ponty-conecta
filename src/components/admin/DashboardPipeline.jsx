import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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

  // Pie data for pipeline distribution
  const pieData = pipelineData.filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline + Pie */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Pipeline de Campanhas</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
              {totalCampaigns} total
            </span>
          </div>
          {pipelineData.length > 0 ? (
            <div className="flex gap-4">
              {/* Bars */}
              <div className="flex-1 space-y-2">
                {pipelineData.map(item => (
                  <div key={item.stage} className="flex items-center gap-2">
                    <span className="text-[11px] w-28 truncate text-right" style={{ color: 'var(--text-secondary)' }}>{item.stage}</span>
                    <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div 
                        className="h-full rounded-md flex items-center px-2 transition-all"
                        style={{ 
                          width: `${Math.max((item.value / Math.max(...pipelineData.map(d => d.value))) * 100, 15)}%`,
                          backgroundColor: item.color 
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mini Pie */}
              {pieData.length > 1 && (
                <div className="w-24 h-24 flex-shrink-0 self-center hidden sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={16} outerRadius={36} paddingAngle={2} dataKey="value" nameKey="stage" stroke="none">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-secondary)' }}>Sem dados de pipeline</p>
          )}
        </CardContent>
      </Card>

      {/* Funnel */}
      {funnelData && funnelData.length > 0 && (
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Funil de Conversão</h3>
            <div className="space-y-2">
              {funnelData.map((item, i) => {
                const maxVal = Math.max(...funnelData.map(d => d.value), 1);
                const pct = (item.value / maxVal) * 100;
                const convRate = i > 0 && funnelData[i - 1].value > 0 
                  ? Math.round((item.value / funnelData[i - 1].value) * 100) 
                  : null;
                return (
                  <div key={item.stage} className="flex items-center gap-2">
                    <span className="text-[11px] w-28 truncate text-right" style={{ color: 'var(--text-secondary)' }}>{item.stage}</span>
                    <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <div 
                        className="h-full rounded-md flex items-center justify-between px-2 transition-all"
                        style={{ 
                          width: `${Math.max(pct, 15)}%`,
                          backgroundColor: item.color 
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">{item.value}</span>
                      </div>
                    </div>
                    {convRate !== null && (
                      <span className="text-[10px] w-10 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {convRate}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Conversion summary */}
            <div className="mt-3 pt-3 border-t flex justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Taxa geral</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
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