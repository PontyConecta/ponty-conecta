import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

export default function AttentionBlock({ deliveries = [], applications = [], campaigns = [], campaignsMap = {} }) {
  const submittedDeliveries = deliveries.filter(d => d.status === 'submitted');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const now = new Date();
  const expiringCampaigns = campaigns.filter(c => {
    if (c.status !== 'active' || !c.deadline) return false;
    const diff = (new Date(c.deadline) - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });

  const hasItems = submittedDeliveries.length > 0 || pendingApps.length > 0 || expiringCampaigns.length > 0;
  if (!hasItems) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Atenção necessária
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Submitted deliveries awaiting approval */}
        {submittedDeliveries.slice(0, 3).map(d => (
          <Link
            key={d.id}
            to={createPageUrl('DeliveriesManager') + '?deliveryId=' + d.id}
            className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group min-h-[56px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {campaignsMap[d.campaign_id]?.title || 'Entrega submetida'}
              </p>
              <p className="text-xs text-muted-foreground">Aguardando sua aprovação</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge type="delivery" status={d.status} />
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}

        {/* Pending applications count */}
        {pendingApps.length > 0 && (
          <Link
            to={createPageUrl('ApplicationsManager')}
            className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group min-h-[56px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Candidaturas não revisadas</p>
              <p className="text-xs text-muted-foreground">{pendingApps.length} aguardando decisão</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{pendingApps.length}</Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        )}

        {/* Expiring campaigns */}
        {expiringCampaigns.slice(0, 2).map(c => {
          const daysLeft = Math.ceil((new Date(c.deadline) - now) / (1000 * 60 * 60 * 24));
          return (
            <Link
              key={c.id}
              to={createPageUrl('CampaignManager') + '?campaignId=' + c.id}
              className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group min-h-[56px]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-xs text-amber-600">Expira em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}