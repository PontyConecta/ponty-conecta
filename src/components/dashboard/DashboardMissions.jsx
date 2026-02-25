import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Circle, Flame, Loader2, ArrowRight } from 'lucide-react';
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
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (missions.length === 0) return null;

  const completedCount = missions.filter(m => m.status === 'completed').length;
  const totalCount = missions.length;
  if (completedCount === totalCount) return null;

  const overallProgress = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Primeiros Passos
          </CardTitle>
          <Badge variant="outline" className="font-medium">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="mt-2">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs mt-1 text-muted-foreground">
            {overallProgress}% concluído
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {missions.map((mission, index) => {
          const isCompleted = mission.status === 'completed';
          const Wrapper = mission.target_action_url && !isCompleted ? Link : 'div';
          const wrapperProps = mission.target_action_url && !isCompleted 
            ? { to: createPageUrl(mission.target_action_url) } 
            : {};

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Wrapper
                {...wrapperProps}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCompleted ? 'opacity-60' : 'cursor-pointer hover:bg-muted/60 bg-muted/30'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 flex-shrink-0 text-border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {mission.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mission.description}
                  </p>
                </div>
                {!isCompleted && mission.target_action_url && (
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary" />
                )}
                {mission.reward_points > 0 && (
                  <Badge className={`text-xs flex-shrink-0 border-0 ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    +{mission.reward_points}pts
                  </Badge>
                )}
              </Wrapper>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}