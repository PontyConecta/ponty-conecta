import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function CreatorMetricsChart({ applications, deliveries }) {
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

  const totalApps = applications.length;
  const acceptedApps = applications.filter(a => a.status === 'accepted' || a.status === 'completed').length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;

  const totalDeliveries = deliveries.length;
  const approvedCount = deliveries.filter(d => d.status === 'approved').length;
  const submittedCount = deliveries.filter(d => d.status === 'submitted').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;

  const finishedDeliveries = deliveries.filter(d => d.status === 'approved' || d.status === 'closed');
  const onTimeDeliveries = finishedDeliveries.filter(d => d.on_time === true).length;
  const onTimeRate = finishedDeliveries.length > 0 ? Math.round((onTimeDeliveries / finishedDeliveries.length) * 100) : 100;

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Candidaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                <YAxis className="text-muted-foreground" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: 'hsl(var(--card))' }}
                />
                <Bar dataKey="candidaturas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              Nenhuma candidatura ainda
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">{acceptedApps}</div>
              <div className="text-[10px] text-muted-foreground">Aceitas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-600">{pendingApps}</div>
              <div className="text-[10px] text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">{rejectedApps}</div>
              <div className="text-[10px] text-muted-foreground">Recusadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Entregas no prazo</span>
              <span className="text-lg font-bold text-primary">{onTimeRate}%</span>
            </div>
            <Progress value={onTimeRate} className="h-2.5" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
              <div className="text-[10px] text-muted-foreground">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{submittedCount}</div>
              <div className="text-[10px] text-muted-foreground">Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingDeliveries}</div>
              <div className="text-[10px] text-muted-foreground">Pendentes</div>
            </div>
          </div>

          <div className="rounded-lg p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{onTimeDeliveries}</span> de <span className="font-semibold text-foreground">{finishedDeliveries.length}</span> {finishedDeliveries.length === 1 ? 'entrega foi' : 'entregas foram'} no prazo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}