import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignMetricsChart({ campaigns, applications }) {
  // Dados por mês
  const monthlyData = {};
  
  campaigns.forEach(campaign => {
    const date = new Date(campaign.created_date);
    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const chartData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    campanhas: count
  })).slice(-6);

  // Taxa de aceitação
  const totalApps = applications.length;
  const acceptedApps = applications.filter(a => a.status === 'accepted').length;
  const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Campanhas ao Longo do Tempo */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Campanhas Criadas</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="campanhas" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taxa de Aceitação */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Taxa de Aceitação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="8"
                    strokeDasharray={`${acceptanceRate * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{acceptanceRate}%</span>
                   <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>aprovação</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center pt-4" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalApps}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total de candidatos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{acceptedApps}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Aceitos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}