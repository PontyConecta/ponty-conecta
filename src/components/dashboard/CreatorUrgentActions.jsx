import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

export default function CreatorUrgentActions({ deliveries = [], applications = [], campaignsMap = {} }) {
  const now = new Date();

  // Deliveries with deadline < 5 days
  const urgentDeliveries = deliveries.filter(d => {
    if (d.status !== 'pending') return false;
    if (!d.deadline) return false;
    const diff = (new Date(d.deadline) - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 5;
  });

  // Accepted applications without a delivery started
  const deliveryAppIds = new Set(deliveries.map(d => d.application_id));
  const acceptedNoDelivery = applications.filter(
    a => a.status === 'accepted' && !deliveryAppIds.has(a.id)
  );

  const hasItems = urgentDeliveries.length > 0 || acceptedNoDelivery.length > 0;
  if (!hasItems) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base lg:text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Fazer agora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentDeliveries.slice(0, 3).map(d => {
          const daysLeft = Math.ceil((new Date(d.deadline) - now) / (1000 * 60 * 60 * 24));
          return (
            <Link
              key={d.id}
              to={createPageUrl('MyDeliveries') + '?deliveryId=' + d.id}
              className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group min-h-[56px]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {campaignsMap[d.campaign_id]?.title || 'Entrega pendente'}
                </p>
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          );
        })}

        {acceptedNoDelivery.slice(0, 3).map(a => (
          <Link
            key={a.id}
            to={createPageUrl('MyDeliveries')}
            className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors cursor-pointer group min-h-[56px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {campaignsMap[a.campaign_id]?.title || 'Campanha aceita'}
              </p>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Marca aceitou você! Comece a entrega
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}