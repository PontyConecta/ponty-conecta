import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreatorReputationSection({ reputation, deliveries }) {
  const onTimeRate = reputation?.campaigns_completed > 0 
    ? Math.round((reputation.on_time_deliveries / reputation.campaigns_completed) * 100)
    : 100;

  const submittedDeliveries = deliveries?.filter(d => d.status === 'submitted').length || 0;
  const approvedDeliveries = deliveries?.filter(d => d.status === 'approved').length || 0;

  const scoreColor = (score) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500';
    if (score >= 75) return 'from-blue-500 to-indigo-500';
    if (score >= 60) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <Card className="lg:col-span-2 overflow-hidden border-0 shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="p-8 transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pontuação Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-slate-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(reputation?.total_score || 100) * 2.827} 282.7`}
                  className={`text-${reputation?.total_score >= 75 ? 'emerald' : reputation?.total_score >= 60 ? 'orange' : 'red'}-500 transition-all`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {reputation?.total_score || 100}
                </div>
                <div className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}>/100</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center transition-colors" style={{ color: 'var(--text-primary)' }}>Sua Reputação</h3>
            <p className="text-sm mt-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>Pontuação Geral</p>
          </motion.div>

          {/* Entregas */}
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
                    <span className="text-sm font-medium text-slate-700">Aprovadas</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{approvedDeliveries}</span>
                </div>
                <Progress value={approvedDeliveries > 0 ? 80 : 0} className="h-1.5" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Submetidas</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{submittedDeliveries}</span>
                </div>
                <Progress value={submittedDeliveries > 0 ? 60 : 0} className="h-1.5" />
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2">
                  {reputation?.campaigns_completed || 0} campanhas concluídas
                </p>
              </div>
            </div>
          </motion.div>

          {/* Taxa de Entrega no Prazo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Taxa no Prazo</span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-violet-600 mb-2">{onTimeRate}%</div>
                <Progress value={onTimeRate} className="h-2" />
              </div>

              <div className="text-xs text-slate-600 text-center">
                {reputation?.on_time_deliveries || 0} de {reputation?.campaigns_completed || 0} no prazo
              </div>
            </div>

            {reputation?.badges?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 mb-2 font-medium">Badges</p>
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