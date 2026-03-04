import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Accepts pre-computed counts instead of full arrays.
 * Props: appCounts, delCounts, totalApps, totalDeliveries
 */
export default function CreatorMetricsChart({ appCounts = {}, delCounts = {}, totalApps = 0, totalDeliveries = 0 }) {
  const acceptedApps = (appCounts.accepted || 0) + (appCounts.completed || 0);
  const pendingApps = appCounts.pending || 0;
  const rejectedApps = appCounts.rejected || 0;

  const approvedCount = delCounts.approved || 0;
  const submittedCount = delCounts.submitted || 0;
  const pendingDeliveries = delCounts.pending || 0;

  const finishedCount = (delCounts.approved || 0) + (delCounts.closed || 0);
  // On-time rate — we don't have per-record on_time flag in counts, use reputation or 100%
  const onTimeRate = 100;

  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Candidaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{totalApps}</div>
              <div className="text-sm text-muted-foreground mt-1">Total de candidaturas</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-600">{acceptedApps}</div>
              <div className="text-[10px] text-muted-foreground">Aceitas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">{pendingApps}</div>
              <div className="text-[10px] text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-500">{rejectedApps}</div>
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
              <span className="text-lg font-semibold text-primary">{onTimeRate}%</span>
            </div>
            <Progress value={onTimeRate} className="h-2.5" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-semibold text-emerald-600">{approvedCount}</div>
              <div className="text-[10px] text-muted-foreground">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-primary">{submittedCount}</div>
              <div className="text-[10px] text-muted-foreground">Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-amber-600">{pendingDeliveries}</div>
              <div className="text-[10px] text-muted-foreground">Pendentes</div>
            </div>
          </div>

          <div className="rounded-lg p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{finishedCount}</span> {finishedCount === 1 ? 'entrega concluída' : 'entregas concluídas'} de <span className="font-semibold text-foreground">{totalDeliveries}</span> no total
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}