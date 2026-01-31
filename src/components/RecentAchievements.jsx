import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecentAchievements({ achievements = [], limit = 6 }) {
  const unlockedAchievements = achievements.filter(a => a.unlocked_at).slice(0, limit);

  if (unlockedAchievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Continue trabalhando para desbloquear conquistas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-slate-100 text-slate-700',
      rare: 'bg-blue-100 text-blue-700',
      epic: 'bg-purple-100 text-purple-700',
      legendary: 'bg-yellow-100 text-yellow-700'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Conquistas Desbloqueadas
          </span>
          <Badge variant="outline">{unlockedAchievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {unlockedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="w-full bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl p-3 mb-2 flex items-center justify-center h-20">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xs font-semibold text-slate-900 line-clamp-2">{achievement.title}</h4>
              <Badge className={`${getRarityColor(achievement.rarity)} border-0 text-xs mt-1.5 capitalize`}>
                {achievement.rarity}
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}