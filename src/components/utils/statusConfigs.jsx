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
    color: 'bg-muted text-muted-foreground', 
    icon: Edit 
  },
  under_review: { 
    label: 'Em Análise', 
    color: 'bg-accent/10 text-accent-foreground', 
    icon: AlertTriangle 
  },
  active: { 
    label: 'Ativa', 
    color: 'bg-primary/10 text-primary', 
    icon: CheckCircle2 
  },
  paused: { 
    label: 'Pausada', 
    color: 'bg-destructive/10 text-destructive', 
    icon: Pause 
  },
  applications_closed: { 
    label: 'Inscrições Fechadas', 
    color: 'bg-secondary text-secondary-foreground', 
    icon: XCircle 
  },
  completed: { 
    label: 'Concluída', 
    color: 'bg-primary/15 text-primary', 
    icon: CheckCircle2 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'bg-destructive/10 text-destructive', 
    icon: Ban 
  }
};

export const applicationStatusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-accent/10 text-accent-foreground', 
    icon: Clock 
  },
  accepted: { 
    label: 'Aceita', 
    color: 'bg-primary/10 text-primary', 
    icon: CheckCircle2 
  },
  rejected: { 
    label: 'Rejeitada', 
    color: 'bg-destructive/10 text-destructive', 
    icon: XCircle 
  },
  withdrawn: { 
    label: 'Cancelada', 
    color: 'bg-muted text-muted-foreground', 
    icon: Ban 
  },
  completed: { 
    label: 'Concluída', 
    color: 'bg-primary/15 text-primary', 
    icon: CheckCircle2 
  }
};

export const deliveryStatusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-accent/10 text-accent-foreground', 
    icon: Clock 
  },
  submitted: { 
    label: 'Enviada', 
    color: 'bg-secondary text-secondary-foreground', 
    icon: CheckCircle2 
  },
  approved: { 
    label: 'Aprovada', 
    color: 'bg-primary/10 text-primary', 
    icon: CheckCircle2 
  },
  contested: { 
    label: 'Contestada', 
    color: 'bg-destructive/10 text-destructive', 
    icon: AlertTriangle 
  },
  in_dispute: { 
    label: 'Em Disputa', 
    color: 'bg-destructive/15 text-destructive', 
    icon: AlertTriangle 
  },
  resolved: { 
    label: 'Resolvida', 
    color: 'bg-primary/15 text-primary', 
    icon: CheckCircle2 
  },
  closed: { 
    label: 'Encerrada', 
    color: 'bg-muted text-muted-foreground', 
    icon: XCircle 
  }
};

export const disputeStatusConfig = {
  open: { 
    label: 'Aberta', 
    color: 'bg-destructive/10 text-destructive', 
    icon: AlertTriangle 
  },
  under_review: { 
    label: 'Em Análise', 
    color: 'bg-accent/10 text-accent-foreground', 
    icon: Clock 
  },
  resolved_brand_favor: { 
    label: 'Favorável à Marca', 
    color: 'bg-primary/10 text-primary', 
    icon: Building2 
  },
  resolved_creator_favor: { 
    label: 'Favorável ao Criador', 
    color: 'bg-primary/15 text-primary', 
    icon: User 
  },
  closed: { 
    label: 'Encerrada', 
    color: 'bg-muted text-muted-foreground', 
    icon: CheckCircle2 
  }
};

export const auditLogActionConfig = {
  role_switch: { 
    label: 'Troca de Perfil', 
    color: 'bg-primary/10 text-primary' 
  },
  user_role_change: {
    label: 'Papel Alterado',
    color: 'bg-destructive/10 text-destructive'
  },
  user_activated: { 
    label: 'Usuário Ativado', 
    color: 'bg-primary/10 text-primary' 
  },
  user_deactivated: { 
    label: 'Usuário Desativado', 
    color: 'bg-destructive/10 text-destructive' 
  },
  subscription_override: { 
    label: 'Assinatura Alterada', 
    color: 'bg-secondary text-secondary-foreground' 
  },
  user_flagged: { 
    label: 'Usuário Marcado', 
    color: 'bg-accent/10 text-accent-foreground' 
  },
  data_export: { 
    label: 'Exportação de Dados', 
    color: 'bg-secondary text-secondary-foreground' 
  },
  campaign_status_change: { 
    label: 'Status de Campanha', 
    color: 'bg-primary/15 text-primary' 
  },
  dispute_resolved: { 
    label: 'Disputa Resolvida', 
    color: 'bg-primary/10 text-primary' 
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
    color: 'bg-muted text-muted-foreground', 
    icon: Clock 
  };
};