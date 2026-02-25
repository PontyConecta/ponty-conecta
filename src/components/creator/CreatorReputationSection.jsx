import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreatorReputationSection({ reputation, deliveries }) {
  const totalDeliveries = deliveries?.length || 0;
  const submittedDeliveries = deliveries?.filter(d => d.status === 'submitted').length || 0;
  const approvedDeliveries = deliveries?.filter(d => d.status === 'approved').length || 0;
  const completedDeliveries = approvedDeliveries;
  
  const onTimeFromDeliveries = deliveries?.filter(d => d.on_time === true).length || 0;
  const finishedDeliveries = deliveries?.filter(d => d.status === 'approved' || d.status === 'closed').length || 0;
  const onTimeRate = reputation?.campaigns_completed > 0 
    ? Math.round((reputation.on_time_deliveries / reputation.campaigns_completed) * 100)
    : finishedDeliveries > 0
    ? Math.round((onTimeFromDeliveries / finishedDeliveries) * 100)
    : 100;

  return (
    <Card className="lg:col-span-2 overflow-hidden border bg-card shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-border" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${(reputation?.total_score || 100) * 2.827} 282.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{reputation?.total_score || 100}</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center">Sua Reputação</h3>
            <p className="text-sm mt-1 text-muted-foreground">Pontuação Geral</p>
          </motion.div>

          {/* Deliveries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col justify-center"
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium">Aprovadas</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{approvedDeliveries}</span>
                </div>
                <Progress value={totalDeliveries > 0 ? Math.round((approvedDeliveries / totalDeliveries) * 100) : 0} className="h-1.5" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Submetidas</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{submittedDeliveries}</span>
                </div>
                <Progress value={totalDeliveries > 0 ? Math.round((submittedDeliveries / totalDeliveries) * 100) : 0} className="h-1.5" />
              </div>

              <p className="text-xs pt-2 text-muted-foreground">
                {completedDeliveries} {completedDeliveries === 1 ? 'entrega aprovada' : 'entregas aprovadas'} de {totalDeliveries} no total
              </p>
            </div>
          </motion.div>

          {/* On-time Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="rounded-xl p-4 border bg-muted/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm font-medium">Taxa no Prazo</span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-violet-600 mb-2">{onTimeRate}%</div>
                <Progress value={onTimeRate} className="h-2" />
              </div>

              <div className="text-xs text-center text-muted-foreground">
                {reputation?.on_time_deliveries || onTimeFromDeliveries} de {reputation?.campaigns_completed || finishedDeliveries} no prazo
              </div>
            </div>

            {reputation?.badges?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs mb-2 font-medium text-muted-foreground">Badges</p>
                <div className="flex flex-wrap gap-2">
                  {reputation.badges.slice(0, 3).map((badge, i) => (
                    <Badge key={i} variant="outline" className="bg-violet-50 border-violet-200 text-violet-700 text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Card>
  );
}