import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle } from 'lucide-react';

const COLORS = ['#818cf8', '#fb923c', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];

export default function DashboardMarketplace({ analytics }) {
  if (!analytics) return null;

  const nicheDistribution = analytics.nicheDistribution || [];
  const platformDistribution = analytics.platformDistribution || [];
  const topBrands = analytics.topBrands || [];
  const topCreators = analytics.topCreators || [];
  const disputes = analytics.disputesSummary || {};

  return (
    <div className="space-y-6">
      {/* Marketplace Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Entregas Aprovadas" value={analytics.completedDeliveries || 0} />
        <MiniStat label="Taxa de Sucesso" value={`${analytics.successRate || 0}%`} />
        <MiniStat label="Taxa de Cumprimento" value={`${analytics.fulfillmentRate || 0}%`} />
        <MiniStat 
          label="Disputas Abertas" 
          value={analytics.pendingDisputes || 0} 
          alert={analytics.pendingDisputes > 0}
        />
      </div>

      {/* Disputes breakdown */}
      {disputes.total > 0 && (
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Disputas</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <DisputeStat label="Abertas" value={disputes.open || 0} color="text-amber-600" />
              <DisputeStat label="Em Análise" value={disputes.under_review || 0} color="text-blue-600" />
              <DisputeStat label="Favor Marca" value={disputes.resolved_brand || 0} color="text-indigo-600" />
              <DisputeStat label="Favor Criador" value={disputes.resolved_creator || 0} color="text-orange-600" />
              <DisputeStat label="Total" value={disputes.total || 0} color="text-slate-600" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Niche distribution */}
        {nicheDistribution.length > 0 && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Nichos Populares</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nicheDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="value" name="Creators" radius={[0, 4, 4, 0]}>
                      {nicheDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform distribution */}
        {platformDistribution.length > 0 && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Plataformas</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={65} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {platformDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {topBrands.length > 0 && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">Top Marcas (por campanhas)</h3>
              </div>
              <div className="space-y-2">
                {topBrands.map((brand, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: COLORS[i] }}>{i + 1}</span>
                    <span className="text-sm font-medium truncate text-foreground">{brand.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{brand.campaigns} campanhas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {topCreators.length > 0 && (
          <Card className="bg-card border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-foreground">Top Criadores (por candidaturas)</h3>
              </div>
              <div className="space-y-2">
                {topCreators.map((creator, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: COLORS[i] }}>{i + 1}</span>
                    <span className="text-sm font-medium truncate text-foreground">{creator.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{creator.applications} candidaturas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, alert }) {
  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs mb-1 text-muted-foreground">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${alert ? 'text-amber-600' : 'text-foreground'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DisputeStat({ label, value, color }) {
  return (
    <div className="p-2 rounded-lg text-center bg-muted/50">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}