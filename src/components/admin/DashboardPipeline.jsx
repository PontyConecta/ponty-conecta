import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pipeline */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Pipeline de Campanhas</h3>
          {pipelineData.length > 0 ? (
            <div className="space-y-2">
              {pipelineData.map(item => (
                <div key={item.stage} className="flex items-center gap-3">
                  <span className="text-xs w-32 truncate" style={{ color: 'var(--text-secondary)' }}>{item.stage}</span>
                  <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div 
                      className="h-full rounded-md flex items-center px-2 transition-all"
                      style={{ 
                        width: `${Math.max((item.value / Math.max(...pipelineData.map(d => d.value))) * 100, 12)}%`,
                        backgroundColor: item.color 
                      }}
                    >
                      <span className="text-[11px] font-bold text-white">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))}
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}