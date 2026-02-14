import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Flame, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardMissions({ userId, profileType }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, [userId]);

  const loadMissions = async () => {
    if (!userId) return;
    const data = await base44.entities.Mission.filter({ 
      user_id: userId, 
      profile_type: profileType, 
      type: 'onboarding' 
    });
    setMissions(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setLoading(false);
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-secondary)' }} />
        </CardContent>
      </Card>
    );
  }

  if (missions.length === 0) return null;

  const completedCount = missions.filter(m => m.status === 'completed').length;
  const totalCount = missions.length;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Flame className="w-5 h-5 text-orange-500" />
            Primeiros Passos
          </CardTitle>
          <Badge variant="outline" className="font-medium">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="mt-2">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {overallProgress}% concluído
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {missions.map((mission, index) => {
          const isCompleted = mission.status === 'completed';
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isCompleted ? 'opacity-60' : ''}`}
              style={{ backgroundColor: isCompleted ? 'transparent' : 'var(--bg-primary)' }}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--border-color)' }} />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isCompleted ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>
                  {mission.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {mission.description}
                </p>
              </div>
              {mission.reward_points > 0 && (
                <Badge className={`text-xs flex-shrink-0 ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-0`}>
                  +{mission.reward_points}pts
                </Badge>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}