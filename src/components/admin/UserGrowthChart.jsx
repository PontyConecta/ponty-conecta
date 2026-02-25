import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function UserGrowthChart({ brands, creators }) {
  // Growth over last 8 weeks
  const growthData = useMemo(() => {
    const data = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      
      const brandCount = brands.filter(b => new Date(b.created_date) <= date).length;
      const creatorCount = creators.filter(c => new Date(c.created_date) <= date).length;
      
      data.push({ date: label, marcas: brandCount, criadores: creatorCount, total: brandCount + creatorCount });
    }
    return data;
  }, [brands, creators]);

  // Subscription distribution
  const subData = useMemo(() => {
    const all = [...brands, ...creators];
    const counts = { starter: 0, premium: 0, trial: 0, legacy: 0 };
    all.forEach(p => {
      const status = p.subscription_status || 'starter';
      if (counts[status] !== undefined) counts[status]++;
    });
    return [
      { name: 'Starter', value: counts.starter, color: '#94a3b8' },
      { name: 'Premium', value: counts.premium, color: '#10b981' },
      { name: 'Trial', value: counts.trial, color: '#3b82f6' },
      { name: 'Legacy', value: counts.legacy, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [brands, creators]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Growth Chart */}
      <Card className="lg:col-span-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Crescimento de Usuários</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorBrands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCreators" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="marcas" stroke="#818cf8" fill="url(#colorBrands)" strokeWidth={2} />
                <Area type="monotone" dataKey="criadores" stroke="#fb923c" fill="url(#colorCreators)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Distribution */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribuição de Planos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subData}
                  cx="50%"
                  cy="45%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {subData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}