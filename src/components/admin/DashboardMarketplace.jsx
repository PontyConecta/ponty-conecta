import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle, FolderOpen, Megaphone, FolderCheck, Target, ThumbsUp, Timer, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import DashboardMetricCard from './DashboardMetricCard';


const COLORS = ['#B5956A', '#fb923c', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#3b82f6', '#ef4444'];

export default function DashboardMarketplace({ analytics }) {
  if (!analytics) return null;

  const nicheDistribution = analytics.nicheDistribution || [];
  const platformDistribution = analytics.platformDistribution || [];
  const topBrands = analytics.topBrands || [];
  const topCreators = analytics.topCreators || [];
  const disputes = analytics.disputesSummary || {};

  return (
    <div className="space-y-6">
      {/* ── Operações do Marketplace ── */}
      <div>
        <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Operações do Marketplace</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <DashboardMetricCard
            label="Total de Campanhas"
            value={analytics.marketplace?.total_campaigns ?? 0}
            icon={FolderOpen}
            iconColor="text-primary"
            tooltip="Total de campanhas criadas na plataforma."
            secondaryLabel={`${analytics.marketplace?.active_campaigns ?? 0} ativas agora`}
          />
          <DashboardMetricCard
            label="Campanhas Ativas"
            value={analytics.marketplace?.active_campaigns ?? analytics.activeCampaigns ?? 0}
            icon={Megaphone}
            iconColor="text-blue-500"
            tooltip="Campanhas com status 'ativa' atualmente."
            secondaryLabel={`de ${analytics.marketplace?.total_campaigns ?? 0} campanhas`}
          />
          <DashboardMetricCard
            label="Campanhas Concluídas"
            value={analytics.pipeline?.completed ?? 0}
            icon={FolderCheck}
            iconColor="text-emerald-500"
            tooltip="Campanhas finalizadas com sucesso."
            secondaryLabel={(analytics.marketplace?.total_campaigns ?? 0) > 0 ? `${Math.round(((analytics.pipeline?.completed ?? 0) / (analytics.marketplace?.total_campaigns ?? 1)) * 100)}% do total` : '—'}
          />
          <DashboardMetricCard
            label="Campanhas Sem Candidaturas"
            value={analytics.marketplace?.campaigns_zero_apps ?? analytics.alerts?.campaigns_zero_apps ?? 0}
            icon={AlertCircle}
            iconColor="text-red-500"
            tooltip="Campanhas ativas sem nenhuma candidatura recebida."
            secondaryLabel={`de ${analytics.marketplace?.active_campaigns ?? 0} ativas`}
          />
        </div>
      </div>

      {/* ── Saúde do Marketplace ── */}
      <div>
        <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Saúde do Marketplace</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <DashboardMetricCard
            label="Aplicações por Campanha"
            value={analytics.marketplace?.avg_apps_per_campaign != null ? Number(analytics.marketplace.avg_apps_per_campaign).toFixed(1) : '—'}
            icon={Target}
            iconColor="text-primary"
            tooltip="Número médio de candidaturas por campanha ativa."
            secondaryLabel="média de candidaturas por campanha ativa"
          />
          <DashboardMetricCard
            label="Taxa de Aprovação"
            value={analytics.marketplace?.approval_rate != null ? `${analytics.marketplace.approval_rate}%` : '—'}
            icon={ThumbsUp}
            iconColor="text-emerald-500"
            tooltip="Percentual de candidaturas aceitas pelas marcas."
            secondaryLabel="percentual de candidaturas aceitas"
          />
          <DashboardMetricCard
            label="Tempo Médio de Resposta"
            value={analytics.marketplace?.avg_brand_response_time_hours != null ? `${Math.round(analytics.marketplace.avg_brand_response_time_hours)}h` : '—'}
            icon={Timer}
            iconColor="text-amber-500"
            tooltip="Tempo médio que marcas levam para responder candidaturas."
            secondaryLabel="tempo médio de resposta das marcas"
          />
          <DashboardMetricCard
            label="Candidaturas Pendentes"
            value={analytics.alerts?.pending_applications ?? 0}
            icon={Clock}
            iconColor="text-orange-500"
            tooltip="Candidaturas aguardando resposta da marca."
            secondaryLabel={`Taxa aprovação: ${analytics.conversionRate || 0}%`}
          />
        </div>
      </div>

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
              <DisputeStat label="Favor Marca" value={disputes.resolved_brand || 0} color="text-primary" />
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
                <Trophy className="w-4 h-4 text-primary" />
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