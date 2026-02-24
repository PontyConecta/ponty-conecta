import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Flame, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MissionsAchievements() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const missionsData = await base44.entities.Mission.filter({ user_id: userData.id }, '-order');
      setMissions(missionsData);
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
  const totalRewardPoints = missions.reduce((sum, m) => sum + (m.status === 'completed' ? m.reward_points || 0 : 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Missões</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Complete missões e ganhe pontos de reputação</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Missões Ativas</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeMissions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Concluídas</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedMissions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Pontos Totais</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalRewardPoints}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Missões Ativas</h2>
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
                <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Flame className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{mission.title}</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{mission.description}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-0 flex-shrink-0">
                        +{mission.reward_points} pts
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
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
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Missões Concluídas</h2>
          {completedMissions.map((mission) => (
            <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-emerald-200" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-emerald-800 line-through">{mission.title}</h3>
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
          <Flame className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Nenhuma missão disponível</p>
        </div>
      )}
    </div>
  );
}