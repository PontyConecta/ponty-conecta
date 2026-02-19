import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, CheckCircle2, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MissionTracker({ missions = [] }) {
  if (missions.length === 0) {
    return (
      <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Flame className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Missões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-secondary)' }}>Nenhuma missão ativa no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Flame className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          Missões ({missions.filter(m => m.status === 'active').length} ativas)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {missions.map((mission, index) => {
          const progress = mission.target_value > 0 
            ? Math.min((mission.current_progress / mission.target_value) * 100, 100)
            : 0;
          
          const isCompleted = mission.status === 'completed';
          const isActive = mission.status === 'active';

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all ${
                isCompleted 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                  : isActive 
                  ? 'border-opacity-50'
                  : 'opacity-60'
              }`}
              style={{
                backgroundColor: isCompleted ? undefined : 'var(--bg-secondary)',
                borderColor: isCompleted ? undefined : 'var(--border-color)'
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-emerald-100' 
                    : 'bg-purple-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isActive ? (
                    <Unlock className="w-5 h-5 text-[#9038fa]" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                   <h4 className={`font-semibold truncate ${
                     isCompleted 
                       ? 'text-emerald-900 line-through' 
                       : ''
                   }`} style={{ color: isCompleted ? undefined : 'var(--text-primary)' }}>
                     {mission.title}
                   </h4>
                   <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{mission.description}</p>
                 </div>

                {mission.reward_points > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-0 flex-shrink-0">
                    +{mission.reward_points}
                  </Badge>
                )}
              </div>

              {isActive && (
                <>
                  <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>Progresso</span>
                    <span className="font-semibold">
                      {mission.current_progress}/{mission.target_value}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </>
              )}

              {isCompleted && (
                <div className="text-xs text-emerald-700 font-medium">
                  ✓ Concluída
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}