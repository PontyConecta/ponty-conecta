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
    <Card className="lg:col-span-2 overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="flex flex-col items-center justify-center py-4">
          {/* Pontuação Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
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
                <div className="text-4xl font-bold text-slate-900">
                  {reputation?.total_score || 100}
                </div>
                <div className="text-xs text-slate-500">/100</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Sua Reputação</h3>
            <p className="text-sm text-slate-600 mt-1 mb-6">Pontuação Geral</p>

            {reputation?.badges?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {reputation.badges.slice(0, 3).map((badge, i) => (
                  <Badge key={i} variant="outline" className="bg-violet-50 border-violet-200 text-violet-700 text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Card>
  );
}