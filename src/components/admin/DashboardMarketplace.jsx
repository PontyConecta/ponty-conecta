import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function DashboardMarketplace({ analytics }) {
  if (!analytics) return null;

  const categoryDistribution = analytics.categoryDistribution || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat label="Entregas Completas" value={analytics.completedDeliveries || 0} />
        <MiniStat label="Disputas Pendentes" value={analytics.pendingDisputes || 0} className="text-orange-600" />
        <MiniStat label="Valor Transacionado" value={`R$ ${(analytics.totalTransactionValue || 0).toLocaleString('pt-BR')}`} />
      </div>

      {categoryDistribution.length > 0 && (
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribuição de Categorias</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value, className = '' }) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-4">
        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className={`text-2xl font-bold ${className}`} style={!className ? { color: 'var(--text-primary)' } : {}}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}