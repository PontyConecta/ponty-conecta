import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, UserPlus, CheckCircle, Briefcase, Target,
  FileCheck, FileX, AlertTriangle, Clock, TrendingUp
} from 'lucide-react';

const METRIC_CONFIG = [
  { key: 'new_creators', label: 'Novos Creators', icon: UserPlus, color: 'text-violet-600' },
  { key: 'new_brands', label: 'Novas Brands', icon: Briefcase, color: 'text-blue-600' },
  { key: 'onboarding_completed', label: 'Onboarding Completo', icon: CheckCircle, color: 'text-green-600' },
  { key: 'campaigns_created', label: 'Campanhas Criadas', icon: Target, color: 'text-orange-600' },
  { key: 'applications_created', label: 'Candidaturas', icon: Users, color: 'text-indigo-600' },
  { key: 'applications_approved', label: 'Aprovações', icon: CheckCircle, color: 'text-emerald-600' },
  { key: 'deliveries_submitted', label: 'Entregas Submetidas', icon: FileCheck, color: 'text-cyan-600' },
  { key: 'deliveries_approved', label: 'Entregas Aprovadas', icon: FileCheck, color: 'text-green-600' },
  { key: 'deliveries_contested', label: 'Revisões', icon: FileX, color: 'text-amber-600' },
  { key: 'disputes_created', label: 'Disputas', icon: AlertTriangle, color: 'text-red-600' },
];

export default function MetricsCards({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {METRIC_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-muted-foreground truncate">{label}</span>
              </div>
              <p className="text-2xl font-bold">{data[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Average times */}
      {(data.avg_app_approval_hours != null || data.avg_delivery_approval_hours != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.avg_app_approval_hours != null && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo médio: Candidatura → Aprovação</p>
                  <p className="text-xl font-bold">{data.avg_app_approval_hours}h</p>
                </div>
              </CardContent>
            </Card>
          )}
          {data.avg_delivery_approval_hours != null && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo médio: Entrega → Aprovação</p>
                  <p className="text-xl font-bold">{data.avg_delivery_approval_hours}h</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}