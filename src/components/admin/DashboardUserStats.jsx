import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Building2, Star, Crown, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

const PLAN_COLORS = {
  starter: '#94a3b8',
  premium: '#10b981',
  trial: '#3b82f6',
  legacy: '#f59e0b',
};

export default function DashboardUserStats({ analytics }) {
  if (!analytics) return null;

  const userGrowthData = analytics.userGrowthChart || [];
  
  const planDistribution = useMemo(() => {
    const totalBrands = analytics.totalBrands || 0;
    const totalCreators = analytics.totalCreators || 0;
    return [
      { name: 'Marcas', value: totalBrands, color: '#818cf8' },
      { name: 'Criadores', value: totalCreators, color: '#fb923c' },
    ].filter(d => d.value > 0);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* User summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMiniCard
          icon={Building2} iconBg="bg-indigo-100" iconColor="text-indigo-600"
          label="Marcas" value={analytics.totalBrands || 0}
        />
        <StatMiniCard
          icon={Star} iconBg="bg-orange-100" iconColor="text-orange-600"
          label="Criadores" value={analytics.totalCreators || 0}
        />
        <StatMiniCard
          icon={Crown} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          label="Assinantes Ativos" value={analytics.activeSubscribers || 0}
        />
        <StatMiniCard
          icon={CheckCircle2} iconBg="bg-blue-100" iconColor="text-blue-600"
          label="Usuários Ativos" value={analytics.activeUsers || 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Chart */}
        <Card className="lg:col-span-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Crescimento de Usuários</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="dashColorBrands" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashColorCreators" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="brands" name="Marcas" stroke="#818cf8" fill="url(#dashColorBrands)" strokeWidth={2} />
                  <Area type="monotone" dataKey="creators" name="Criadores" stroke="#fb923c" fill="url(#dashColorCreators)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribuição por Tipo</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatMiniCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}