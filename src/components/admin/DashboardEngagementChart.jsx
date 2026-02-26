import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg p-3 text-xs border bg-card border-border">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardEngagementChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Engajamento ao Longo do Tempo</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="engApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9038fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9038fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="engDel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="engAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="candidaturas" name="Candidaturas" stroke="#9038fa" fill="url(#engApps)" strokeWidth={2} />
              <Area type="monotone" dataKey="aceitas" name="Aceitas" stroke="#fb923c" fill="url(#engAccepted)" strokeWidth={2} />
              <Area type="monotone" dataKey="entregas" name="Entregas" stroke="#10b981" fill="url(#engDel)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}