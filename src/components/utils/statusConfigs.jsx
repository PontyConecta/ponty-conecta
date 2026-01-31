import { 
  Edit, 
  AlertTriangle, 
  CheckCircle2, 
  Pause, 
  XCircle, 
  Ban, 
  Clock,
  Building2,
  User
} from 'lucide-react';

/**
 * Configurações centralizadas de status para badges e displays
 */

export const campaignStatusConfig = {
  draft: { 
    label: 'Rascunho', 
    color: 'bg-slate-100 text-slate-700', 
    icon: Edit 
  },
  under_review: { 
    label: 'Em Análise', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: AlertTriangle 
  },
  active: { 
    label: 'Ativa', 
    color: 'bg-emerald-100 text-emerald-700', 
    icon: CheckCircle2 
  },
  paused: { 
    label: 'Pausada', 
    color: 'bg-orange-100 text-orange-700', 
    icon: Pause 
  },
  applications_closed: { 
    label: 'Inscrições Fechadas', 
    color: 'bg-blue-100 text-blue-700', 
    icon: XCircle 
  },
  completed: { 
    label: 'Concluída', 
    color: 'bg-violet-100 text-violet-700', 
    icon: CheckCircle2 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'bg-red-100 text-red-700', 
    icon: Ban 
  }
};

export const applicationStatusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: Clock 
  },
  accepted: { 
    label: 'Aceita', 
    color: 'bg-emerald-100 text-emerald-700', 
    icon: CheckCircle2 
  },
  rejected: { 
    label: 'Rejeitada', 
    color: 'bg-red-100 text-red-700', 
    icon: XCircle 
  },
  withdrawn: { 
    label: 'Cancelada', 
    color: 'bg-slate-100 text-slate-700', 
    icon: Ban 
  },
  completed: { 
    label: 'Concluída', 
    color: 'bg-violet-100 text-violet-700', 
    icon: CheckCircle2 
  }
};

export const deliveryStatusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: Clock 
  },
  submitted: { 
    label: 'Enviada', 
    color: 'bg-blue-100 text-blue-700', 
    icon: CheckCircle2 
  },
  approved: { 
    label: 'Aprovada', 
    color: 'bg-emerald-100 text-emerald-700', 
    icon: CheckCircle2 
  },
  contested: { 
    label: 'Contestada', 
    color: 'bg-orange-100 text-orange-700', 
    icon: AlertTriangle 
  },
  in_dispute: { 
    label: 'Em Disputa', 
    color: 'bg-red-100 text-red-700', 
    icon: AlertTriangle 
  },
  resolved: { 
    label: 'Resolvida', 
    color: 'bg-violet-100 text-violet-700', 
    icon: CheckCircle2 
  },
  closed: { 
    label: 'Encerrada', 
    color: 'bg-slate-100 text-slate-700', 
    icon: XCircle 
  }
};

export const disputeStatusConfig = {
  open: { 
    label: 'Aberta', 
    color: 'bg-red-100 text-red-700', 
    icon: AlertTriangle 
  },
  under_review: { 
    label: 'Em Análise', 
    color: 'bg-yellow-100 text-yellow-700', 
    icon: Clock 
  },
  resolved_brand_favor: { 
    label: 'Favorável à Marca', 
    color: 'bg-indigo-100 text-indigo-700', 
    icon: Building2 
  },
  resolved_creator_favor: { 
    label: 'Favorável ao Criador', 
    color: 'bg-orange-100 text-orange-700', 
    icon: User 
  },
  closed: { 
    label: 'Encerrada', 
    color: 'bg-slate-100 text-slate-700', 
    icon: CheckCircle2 
  }
};

export const auditLogActionConfig = {
  role_switch: { 
    label: 'Troca de Perfil', 
    color: 'bg-violet-100 text-violet-700' 
  },
  user_activated: { 
    label: 'Usuário Ativado', 
    color: 'bg-emerald-100 text-emerald-700' 
  },
  user_deactivated: { 
    label: 'Usuário Desativado', 
    color: 'bg-orange-100 text-orange-700' 
  },
  subscription_override: { 
    label: 'Assinatura Alterada', 
    color: 'bg-blue-100 text-blue-700' 
  },
  user_flagged: { 
    label: 'Usuário Marcado', 
    color: 'bg-yellow-100 text-yellow-700' 
  },
  data_export: { 
    label: 'Exportação de Dados', 
    color: 'bg-indigo-100 text-indigo-700' 
  },
  campaign_status_change: { 
    label: 'Status de Campanha', 
    color: 'bg-purple-100 text-purple-700' 
  },
  dispute_resolved: { 
    label: 'Disputa Resolvida', 
    color: 'bg-emerald-100 text-emerald-700' 
  }
};

export const getStatusConfig = (type, status) => {
  const configs = {
    campaign: campaignStatusConfig,
    application: applicationStatusConfig,
    delivery: deliveryStatusConfig,
    dispute: disputeStatusConfig,
    audit_log: auditLogActionConfig
  };
  
  const config = configs[type]?.[status];
  return config || { 
    label: status, 
    color: 'bg-slate-100 text-slate-700', 
    icon: Clock 
  };
};