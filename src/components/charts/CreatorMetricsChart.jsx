import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function CreatorMetricsChart({ applications, deliveries }) {
  // Dados por mês - candidaturas
  const monthlyData = {};
  
  applications.forEach(app => {
    const date = new Date(app.created_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    if (!monthlyData[key]) monthlyData[key] = { key, month: label, candidaturas: 0 };
    monthlyData[key].candidaturas += 1;
  });

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)
    .map(({ month, candidaturas }) => ({ month, candidaturas }));

  // Application stats
  const totalApps = applications.length;
  const acceptedApps = applications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;

  // Delivery stats
  const totalDeliveries = deliveries.length;
  const approvedCount = deliveries.filter(d => d.status === 'approved').length;
  const submittedCount = deliveries.filter(d => d.status === 'submitted').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;

  // Taxa de entregas no prazo
  const finishedDeliveries = deliveries.filter(d => d.status === 'approved' || d.status === 'closed');
  const onTimeDeliveries = finishedDeliveries.filter(d => d.on_time === true).length;
  const onTimeRate = finishedDeliveries.length > 0 ? Math.round((onTimeDeliveries / finishedDeliveries.length) * 100) : 100;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Candidaturas ao Longo do Tempo */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Candidaturas</CardTitle>
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
                <Bar dataKey="candidaturas" fill="#9038fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma candidatura ainda
            </div>
          )}
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">{acceptedApps}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Aceitas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{pendingApps}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">{rejectedApps}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Recusadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Entregas */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Entregas no prazo</span>
              <span className="text-lg font-bold" style={{ color: '#9038fa' }}>{onTimeRate}%</span>
            </div>
            <Progress value={onTimeRate} className="h-2.5" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#9038fa' }}>{submittedCount}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingDeliveries}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Pendentes</div>
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{onTimeDeliveries}</span> de <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{finishedDeliveries.length}</span> {finishedDeliveries.length === 1 ? 'entrega foi' : 'entregas foram'} no prazo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}