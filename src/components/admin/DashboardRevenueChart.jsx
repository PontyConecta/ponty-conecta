import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg p-3 text-xs border bg-card border-border">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-semibold text-foreground">R$ {entry.value?.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardRevenueChart({ data, profileFilter }) {
  const [chartType, setChartType] = useState('area');

  if (!data || data.length === 0) return null;

  const showSegmented = profileFilter === 'all';

  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Receita Mensal (MRR)</h3>
          <div className="flex gap-1">
            <Button variant={chartType === 'area' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] px-2 ${chartType === 'area' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setChartType('area')}>Área</Button>
            <Button variant={chartType === 'bar' ? 'default' : 'ghost'} size="sm" className={`h-7 text-[10px] px-2 ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setChartType('bar')}>Barra</Button>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revBrands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revCreators" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {showSegmented ? (
                  <>
                    <Area type="monotone" dataKey="marcas" name="Marcas" stroke="hsl(var(--primary))" fill="url(#revBrands)" strokeWidth={2} activeDot={{ r: 4, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="criadores" name="Criadores" stroke="#fb923c" fill="url(#revCreators)" strokeWidth={2} activeDot={{ r: 4, fill: 'hsl(var(--background))', stroke: '#fb923c', strokeWidth: 2 }} />
                  </>
                ) : (
                  <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" fill="url(#revTotal)" strokeWidth={2} activeDot={{ r: 4, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {showSegmented ? (
                  <>
                    <Bar dataKey="marcas" name="Marcas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} activeBar={{ fillOpacity: 0.8 }} />
                    <Bar dataKey="criadores" name="Criadores" fill="#fb923c" radius={[4, 4, 0, 0]} activeBar={{ fillOpacity: 0.8 }} />
                  </>
                ) : (
                  <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} activeBar={{ fillOpacity: 0.8 }} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}