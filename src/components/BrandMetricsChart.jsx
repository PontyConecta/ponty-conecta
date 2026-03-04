import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignMetricsChart({ campaignCounts = {}, appCounts = {}, totalCampaigns = 0, totalApps = 0, campaignsByMonth }) {
  const acceptedApps = (appCounts.accepted || 0) + (appCounts.completed || 0);
  const rejectedApps = appCounts.rejected || 0;
  const pendingApps = appCounts.pending || 0;
  const decidedApps = acceptedApps + rejectedApps;
  const acceptanceRate = decidedApps > 0 ? Math.round((acceptedApps / decidedApps) * 100) : 0;

  const activeCampaigns = campaignCounts.active || 0;
  const draftCampaigns = (campaignCounts.draft || 0) + (campaignCounts.under_review || 0);
  const completedCampaigns = campaignCounts.completed || 0;
  const otherCampaigns = (campaignCounts.paused || 0) + (campaignCounts.applications_closed || 0) + (campaignCounts.cancelled || 0);

  const safe = Array.isArray(campaignsByMonth) ? campaignsByMonth : [];
  const chartData = safe.map(item => {
    const parts = (item.month || '').split('-');
    const date = new Date(parseInt(parts[0]) || 2026, (parseInt(parts[1]) || 1) - 1);
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      campanhas: item.count || 0,
    };
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold tracking-tight">Campanhas Criadas</CardTitle>
            <span className="text-sm font-semibold text-primary">{totalCampaigns} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
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
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{totalCampaigns}</div>
                <div className="text-sm text-muted-foreground mt-1">Total de campanhas</div>
              </div>
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