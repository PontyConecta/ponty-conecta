import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignMetricsChart({ campaigns, applications }) {
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

  const totalApps = applications.length;
  const acceptedApps = applications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const decidedApps = acceptedApps + rejectedApps;
  const acceptanceRate = decidedApps > 0 ? Math.round((acceptedApps / decidedApps) * 100) : 0;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft' || c.status === 'under_review').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const otherCampaigns = campaigns.filter(c => ['paused', 'applications_closed', 'cancelled'].includes(c.status)).length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold tracking-tight">Campanhas Criadas</CardTitle>
            <span className="text-sm font-semibold text-primary">{campaigns.length} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                <YAxis className="text-muted-foreground" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--card))' }}
                />
                <Bar dataKey="campanhas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              Nenhuma campanha criada ainda
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{activeCampaigns}</div>
              <div className="text-[10px] text-muted-foreground">Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-muted-foreground">{draftCampaigns}</div>
              <div className="text-[10px] text-muted-foreground">Rascunhos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-600">{completedCampaigns}</div>
              <div className="text-[10px] text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">{otherCampaigns}</div>
              <div className="text-[10px] text-muted-foreground">Outras</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Taxa de Aceitação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeDasharray={`${acceptanceRate * 2.83} 283`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-3xl font-semibold text-foreground">{acceptanceRate}%</span>
                   <span className="text-xs text-muted-foreground">aprovação</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t">
              <div>
                <div className="text-2xl font-semibold text-foreground">{totalApps}</div>
                <div className="text-[10px] text-muted-foreground">Total de candidatos</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-emerald-600">{acceptedApps}</div>
                <div className="text-[10px] text-muted-foreground">Aceitos</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-amber-600">{pendingApps}</div>
                <div className="text-[10px] text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}