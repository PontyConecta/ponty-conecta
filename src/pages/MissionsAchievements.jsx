import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Flame, Trophy, Star, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MissionsAchievements() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('missions');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [missionsData, achievementsData] = await Promise.all([
        base44.entities.Mission.filter({ user_id: userData.id }, '-order'),
        base44.entities.Achievement.filter({ user_id: userData.id }, '-unlocked_at')
      ]);

      setMissions(missionsData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeMissions = missions.filter(m => m.status === 'active');
  const completedMissions = missions.filter(m => m.status === 'completed');
  const unlockedAchievements = achievements.filter(a => a.unlocked_at);
  const lockedAchievements = achievements.filter(a => !a.unlocked_at);
  const totalRewardPoints = missions.reduce((sum, m) => sum + (m.status === 'completed' ? m.reward_points || 0 : 0), 0);

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-slate-100 text-slate-700 border-slate-300',
      rare: 'bg-blue-100 text-blue-700 border-blue-300',
      epic: 'bg-purple-100 text-purple-700 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Missões & Conquistas</h1>
        <p className="text-slate-600">Desbloqueie missões e ganhe pontos de reputação</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Missões Ativas</p>
                  <p className="text-3xl font-bold text-slate-900">{activeMissions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Conquistas</p>
                  <p className="text-3xl font-bold text-slate-900">{unlockedAchievements.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pontos Totais</p>
                  <p className="text-3xl font-bold text-slate-900">{totalRewardPoints}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'missions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 inline mr-2" />
          Missões ({activeMissions.length})
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'achievements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Conquistas ({unlockedAchievements.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          {/* Active Missions */}
          {activeMissions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Missões Ativas</h2>
              {activeMissions.map((mission, index) => {
                const progress = mission.target_value > 0 
                  ? Math.min((mission.current_progress / mission.target_value) * 100, 100)
                  : 0;

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-6 h-6 text-orange-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 text-lg">{mission.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{mission.description}</p>
                          </div>

                          <Badge className="bg-yellow-100 text-yellow-800 border-0 flex-shrink-0">
                            +{mission.reward_points} pts
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Progresso</span>
                            <span className="font-semibold text-slate-900">
                              {mission.current_progress}/{mission.target_value}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Missões Concluídas</h2>
              {completedMissions.map((mission) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-emerald-900 line-through">{mission.title}</h3>
                          <p className="text-xs text-emerald-700 mt-1">
                            Concluída em {new Date(mission.completed_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <Badge className="bg-emerald-100 text-emerald-800 border-0">
                          +{mission.reward_points} pts
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {activeMissions.length === 0 && completedMissions.length === 0 && (
            <div className="text-center py-12">
              <Flame className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma missão disponível</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Conquistadas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={`border-2 ${getRarityColor(achievement.rarity).split(' ')[0]}`}>
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mx-auto mb-4">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 mb-1">{achievement.title}</h3>
                        <p className="text-xs text-slate-600 mb-3">{achievement.description}</p>
                        
                        <Badge className={`${getRarityColor(achievement.rarity)} border capitalize`}>
                          {achievement.rarity}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Bloqueadas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="opacity-50">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-8 h-8 text-slate-400" />
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 mb-1">{achievement.title}</h3>
                        <p className="text-xs text-slate-600 mb-3">{achievement.description}</p>
                        
                        <Badge variant="outline" className="capitalize">
                          {achievement.rarity}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {achievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma conquista ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}