import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function DisputeStatsCards({ disputes }) {
  const stats = {
    open: disputes.filter(d => d.status === 'open').length,
    under_review: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status.includes('resolved')).length,
    total: disputes.length
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border">
        <CardContent className="p-5">
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          <div className="text-sm text-muted-foreground mt-1">Abertas</div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-5">
          <div className="text-2xl font-bold text-yellow-600">{stats.under_review}</div>
          <div className="text-sm text-muted-foreground mt-1">Em Análise</div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-5">
          <div className="text-2xl font-bold text-emerald-600">{stats.resolved}</div>
          <div className="text-sm text-muted-foreground mt-1">Resolvidas</div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-5">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground mt-1">Total</div>
        </CardContent>
      </Card>
    </div>
  );
}