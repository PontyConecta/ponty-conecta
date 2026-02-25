import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Building2, Star, Crown, CheckCircle2, UserPlus, TrendingUp } from 'lucide-react';

const COLORS = ['#818cf8', '#fb923c', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg p-3 text-xs border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardUserStats({ analytics }) {
  const [growthView, setGrowthView] = useState('cumulative');
  if (!analytics) return null;

  const userGrowthData = analytics.userGrowthChart || [];
  const planDist = analytics.planDistribution || [];
  const stateDist = analytics.stateDistribution || [];
  const sizeDist = analytics.sizeDistribution || [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMiniCard icon={Building2} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Marcas" value={analytics.totalBrands || 0} subtitle={`${analytics.brandActiveUsers || 0} ativas`} />
        <StatMiniCard icon={Star} iconBg="bg-orange-100" iconColor="text-orange-600" label="Criadores" value={analytics.totalCreators || 0} subtitle={`${analytics.creatorActiveUsers || 0} ativos`} />
        <StatMiniCard icon={UserPlus} iconBg="bg-purple-100" iconColor="text-purple-600" label="Novos no Período" value={analytics.newUsers || 0} subtitle={`${analytics.newBrands || 0} marcas, ${analytics.newCreators || 0} criadores`} />
        <StatMiniCard icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Crescimento" value={`${analytics.growthRate || 0}%`} subtitle="vs período anterior" />
      </div>

      {/* Growth + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Crescimento de Usuários</h3>
              <div className="flex gap-1">
                <Button variant={growthView === 'cumulative' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] px-2 ${growthView === 'cumulative' ? 'bg-[#9038fa] text-white' : ''}`} onClick={() => setGrowthView('cumulative')}>Acumulado</Button>
                <Button variant={growthView === 'new' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] px-2 ${growthView === 'new' ? 'bg-[#9038fa] text-white' : ''}`} onClick={() => setGrowthView('new')}>Novos</Button>
              </div>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                {growthView === 'cumulative' ? (
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="ugBrands" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ugCreators" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="marcas_total" name="Marcas" stroke="#818cf8" fill="url(#ugBrands)" strokeWidth={2} />
                    <Area type="monotone" dataKey="criadores_total" name="Criadores" stroke="#fb923c" fill="url(#ugCreators)" strokeWidth={2} />
                  </AreaChart>
                ) : (
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="novos_marcas" name="Novas Marcas" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="novos_criadores" name="Novos Criadores" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Distribuição por Plano</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planDist} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {planDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legends */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {planDist.map((p, i) => (
                <span key={p.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {p.name} ({p.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geography + Profile Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stateDist.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Distribuição por Estado</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={35} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="value" name="Usuários" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {sizeDist.length > 0 && (
          <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tamanho de Perfil (Creators)</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sizeDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="value" name="Creators" fill="#fb923c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatMiniCard({ icon: Icon, iconBg, iconColor, label, value, subtitle }) {
  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            {subtitle && <p className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}