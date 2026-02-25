import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignMetricsChart({ campaigns, applications }) {
  // Dados por mês - campanhas criadas
  const monthlyData = {};
  
  campaigns.forEach(campaign => {
    const date = new Date(campaign.created_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    if (!monthlyData[key]) monthlyData[key] = { key, month: label, campanhas: 0 };
    monthlyData[key].campanhas += 1;
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)
    .map(({ month, campanhas }) => ({ month, campanhas }));

  // Taxa de aceitação - baseada em TODAS as candidaturas (não apenas pendentes)
  const totalApps = applications.length;
  const acceptedApps = applications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const decidedApps = acceptedApps + rejectedApps;
  const acceptanceRate = decidedApps > 0 ? Math.round((acceptedApps / decidedApps) * 100) : 0;

  // Status de campanhas - contabilizar TODOS os status
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft' || c.status === 'under_review').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const otherCampaigns = campaigns.filter(c => ['paused', 'applications_closed', 'cancelled'].includes(c.status)).length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Campanhas ao Longo do Tempo */}
      <Card >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold" >Campanhas Criadas</CardTitle>
            <span className="text-sm font-bold" className="text-primary">{campaigns.length} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="campanhas" fill="#9038fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center" className="text-muted-foreground">
              Nenhuma campanha criada ainda
            </div>
          )}
          {/* Summary stats below chart */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4" className="border-t">
            <div className="text-center">
              <div className="text-lg font-bold" className="text-primary">{activeCampaigns}</div>
              <div className="text-[10px]" className="text-muted-foreground">Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" className="text-muted-foreground">{draftCampaigns}</div>
              <div className="text-[10px]" className="text-muted-foreground">Rascunhos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">{completedCampaigns}</div>
              <div className="text-[10px]" className="text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{otherCampaigns}</div>
              <div className="text-[10px]" className="text-muted-foreground">Outras</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Aceitação */}
      <Card >
        <CardHeader>
          <CardTitle className="text-lg font-semibold" >Taxa de Aceitação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#9038fa"
                    strokeWidth="8"
                    strokeDasharray={`${acceptanceRate * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-3xl font-bold" >{acceptanceRate}%</span>
                   <span className="text-xs" className="text-muted-foreground">aprovação</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center pt-4" className="border-t">
              <div>
                <div className="text-2xl font-bold" >{totalApps}</div>
                <div className="text-[10px]" className="text-muted-foreground">Total de candidatos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{acceptedApps}</div>
                <div className="text-[10px]" className="text-muted-foreground">Aceitos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{pendingApps}</div>
                <div className="text-[10px]" className="text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}