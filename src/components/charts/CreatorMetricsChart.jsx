import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function CreatorMetricsChart({ deliveries }) {
  // Dados por mês
  const monthlyData = {};
  
  deliveries.forEach(delivery => {
    const date = new Date(delivery.submitted_at || delivery.created_date);
    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const chartData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    entregas: count
  })).slice(-6);

  // Taxa de entregas no prazo
  const totalDeliveries = deliveries.length;
  const onTimeDeliveries = deliveries.filter(d => d.on_time === true).length;
  const onTimeRate = totalDeliveries > 0 ? Math.round((onTimeDeliveries / totalDeliveries) * 100) : 0;

  // Status das entregas
  const approvedCount = deliveries.filter(d => d.status === 'approved').length;
  const submittedCount = deliveries.filter(d => d.status === 'submitted').length;
  const pendingCount = deliveries.filter(d => d.status === 'pending').length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Entregas ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Entregas Submetidas</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="entregas" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              Sem dados disponíveis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taxa de Prazo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Taxa de Entregas no Prazo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Entregas no prazo</span>
              <span className="text-lg font-bold text-slate-900">{onTimeRate}%</span>
            </div>
            <Progress value={onTimeRate} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-3 border-t pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
              <div className="text-xs text-slate-500">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{submittedCount}</div>
              <div className="text-xs text-slate-500">Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-slate-500">Pendentes</div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-900">
              <span className="font-semibold">{onTimeDeliveries}</span> de <span className="font-semibold">{totalDeliveries}</span> entregas foram no prazo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}