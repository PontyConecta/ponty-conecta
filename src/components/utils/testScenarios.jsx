/**
 * CENÁRIOS DE TESTE - FLUXOS CRÍTICOS
 * 
 * Este arquivo documenta os cenários de teste para os principais fluxos da aplicação.
 * Use como guia para testes manuais, automatizados ou QA.
 */

export const criticalFlows = {
  
  /**
   * FLUXO 1: CRIAR E PUBLICAR CAMPANHA (Brand)
   * 
   * Pré-condições:
   * - Usuário logado como Brand com assinatura ativa
   * 
   * Cenários de Teste:
   */
  createCampaign: {
    happy_path: {
      steps: [
        '1. Acessar página de Campanhas',
        '2. Clicar em "Nova Campanha"',
        '3. Preencher todos os campos obrigatórios (título, descrição, requisitos, plataformas, deadline, tipo de remuneração, valores, vagas, prova)',
        '4. Salvar como rascunho',
        '5. Verificar que campanha aparece na lista com status "draft"',
        '6. Editar campanha e publicar (mudar status para "active")',
        '7. Verificar que campanha aparece como "active"'
      ],
      expected_results: [
        'Campanha criada com sucesso',
        'Status transitions: draft → active',
        'Campanha visível para criadores no feed',
        'Todos os dados salvos corretamente'
      ],
      validation_points: [
        'Campos obrigatórios validados no frontend',
        'Valores mínimo/máximo validados (min <= max)',
        'Deadline deve ser data futura',
        'Transição de estado validada',
        'Slots disponíveis > 0'
      ]
    },
    
    edge_cases: [
      {
        name: 'Criar campanha sem assinatura',
        steps: ['Tentar criar campanha sem assinatura ativa'],
        expected: 'Mostrar modal de paywall, bloquear criação'
      },
      {
        name: 'Valores inválidos',
        steps: ['Tentar salvar com budget_min > budget_max'],
        expected: 'Mostrar erro de validação, não permitir salvar'
      },
      {
        name: 'Deadline no passado',
        steps: ['Tentar definir deadline no passado'],
        expected: 'Mostrar erro de validação'
      },
      {
        name: 'Ativar campanha sem vagas',
        steps: ['Tentar ativar campanha com slots_total = 0'],
        expected: 'Bloquear transição, mostrar erro'
      },
      {
        name: 'Campos obrigatórios vazios',
        steps: ['Tentar salvar sem preencher título, descrição ou requisitos'],
        expected: 'Mostrar erros de validação para cada campo'
      }
    ]
  },

  /**
   * FLUXO 2: CANDIDATAR-SE A CAMPANHA (Creator)
   * 
   * Pré-condições:
   * - Usuário logado como Creator com assinatura ativa
   * - Existe campanha ativa disponível
   */
  applyToCampaign: {
    happy_path: {
      steps: [
        '1. Acessar Oportunidades',
        '2. Encontrar campanha de interesse',
        '3. Clicar em "Ver Detalhes"',
        '4. Preencher mensagem de candidatura (opcional)',
        '5. Propor valor (se aplicável)',
        '6. Enviar candidatura',
        '7. Verificar que candidatura aparece em "Minhas Candidaturas" com status "pending"'
      ],
      expected_results: [
        'Application criada com status "pending"',
        'total_applications da campanha incrementado',
        'Notificação enviada para a marca',
        'Creator pode visualizar status da candidatura'
      ],
      validation_points: [
        'Creator não pode se candidatar duas vezes à mesma campanha',
        'Campanha deve estar "active" ou "applications_closed" para aceitar',
        'Mensagem opcional validada (max length)',
        'Valor proposto validado (> 0)'
      ]
    },

    edge_cases: [
      {
        name: 'Candidatura duplicada',
        steps: ['Tentar se candidatar novamente à mesma campanha'],
        expected: 'Bloquear candidatura, mostrar mensagem de erro'
      },
      {
        name: 'Campanha sem vagas',
        steps: ['Tentar se candidatar a campanha com todas vagas preenchidas'],
        expected: 'Bloquear candidatura, informar que não há vagas'
      },
      {
        name: 'Campanha pausada/cancelada',
        steps: ['Tentar se candidatar a campanha não-ativa'],
        expected: 'Bloquear candidatura'
      },
      {
        name: 'Sem assinatura',
        steps: ['Tentar se candidatar sem assinatura ativa'],
        expected: 'Mostrar paywall'
      }
    ]
  },

  /**
   * FLUXO 3: ACEITAR CANDIDATURA (Brand)
   * 
   * Pré-condições:
   * - Existe Application com status "pending"
   * - Campanha ainda tem vagas disponíveis
   * 
   * Entidades Afetadas: Application, Campaign, Delivery, Notification
   */
  acceptApplication: {
    happy_path: {
      steps: [
        '1. Acessar Candidaturas',
        '2. Filtrar por "Pendentes"',
        '3. Clicar em candidatura específica',
        '4. Revisar perfil do criador',
        '5. Definir valor acordado (opcional)',
        '6. Clicar em "Aceitar"',
        '7. Verificar atualização de status'
      ],
      expected_results: [
        'Application.status → "accepted"',
        'Application.accepted_at definido',
        'Application.agreed_rate salvo',
        'Campaign.slots_filled incrementado',
        'Delivery criada automaticamente com status "pending"',
        'Notificação enviada ao creator',
        'Delivery herda deadline da campanha'
      ],
      validation_points: [
        'Validar que há vagas disponíveis (slots_filled < slots_total)',
        'Validar transição de estado (pending → accepted)',
        'Campanha deve estar active ou applications_closed',
        'Delivery criada corretamente com todos os IDs necessários'
      ],
      entities_affected: [
        'Application: status, accepted_at, agreed_rate',
        'Campaign: slots_filled',
        'Delivery: nova entidade criada',
        'Notification: criada para o creator'
      ]
    },

    edge_cases: [
      {
        name: 'Última vaga',
        steps: ['Aceitar candidatura quando slots_filled = slots_total - 1'],
        expected: 'Aceitar normalmente, campanha pode mudar para "applications_closed" automaticamente'
      },
      {
        name: 'Vagas esgotadas',
        steps: ['Tentar aceitar quando slots_filled >= slots_total'],
        expected: 'Bloquear aceitação, mostrar erro'
      },
      {
        name: 'Candidatura já aceita/rejeitada',
        steps: ['Tentar aceitar candidatura não-pending'],
        expected: 'Bloquear ação, transição inválida'
      },
      {
        name: 'Valor acordado inválido',
        steps: ['Tentar aceitar com agreed_rate negativo'],
        expected: 'Validação bloqueia'
      }
    ],

    integration_tests: [
      {
        name: 'Múltiplas entidades atualizadas atomicamente',
        test: 'Verificar que se uma atualização falha, todas são revertidas (transação)',
        entities: ['Application', 'Campaign', 'Delivery']
      },
      {
        name: 'Contadores corretos',
        test: 'Após aceitar N candidaturas, slots_filled deve ser exatamente N',
        validation: 'Campaign.slots_filled === número de Applications accepted'
      },
      {
        name: 'Delivery herda dados corretos',
        test: 'Delivery criada deve ter todos os IDs corretos e deadline da campanha',
        validation: 'Delivery.deadline === Campaign.deadline'
      }
    ]
  },

  /**
   * FLUXO 4: SUBMETER ENTREGA (Creator)
   * 
   * Pré-condições:
   * - Existe Delivery com status "pending"
   * - Creator completou o trabalho
   */
  submitDelivery: {
    happy_path: {
      steps: [
        '1. Acessar Minhas Entregas',
        '2. Encontrar entrega pendente',
        '3. Clicar em "Enviar Entrega"',
        '4. Upload de arquivos de prova (screenshots, fotos)',
        '5. Adicionar links do conteúdo publicado',
        '6. Adicionar observações (opcional)',
        '7. Clicar em "Enviar para Avaliação"',
        '8. Verificar mudança de status'
      ],
      expected_results: [
        'Delivery.status → "submitted"',
        'Delivery.submitted_at definido',
        'Delivery.on_time calculado (baseado em deadline)',
        'proof_urls, content_urls, proof_notes salvos',
        'Notificação enviada à marca',
        'Creator não pode mais editar'
      ],
      validation_points: [
        'Pelo menos 1 arquivo de prova obrigatório',
        'URLs de conteúdo validadas (formato URL)',
        'Transição de estado validada (pending → submitted)',
        'on_time calculado corretamente (submitted_at <= deadline)'
      ]
    },

    edge_cases: [
      {
        name: 'Submeter sem provas',
        steps: ['Tentar enviar sem anexar arquivos'],
        expected: 'Bloquear envio, mostrar erro'
      },
      {
        name: 'URLs inválidas',
        steps: ['Tentar submeter com content_urls em formato inválido'],
        expected: 'Validação bloqueia, mostrar erro'
      },
      {
        name: 'Entrega já submetida',
        steps: ['Tentar submeter entrega que já foi enviada'],
        expected: 'Bloquear ação, transição inválida'
      },
      {
        name: 'Entrega atrasada',
        steps: ['Submeter após deadline'],
        expected: 'Aceitar mas marcar on_time = false'
      }
    ]
  },

  /**
   * FLUXO 5: AVALIAR ENTREGA (Brand)
   * 
   * Pré-condições:
   * - Delivery com status "submitted"
   * 
   * Entidades Afetadas: Delivery, Application, Creator, Dispute (se contestada)
   */
  reviewDelivery: {
    happy_path_approve: {
      steps: [
        '1. Acessar Entregas',
        '2. Filtrar por "Enviadas"',
        '3. Clicar em entrega específica',
        '4. Revisar provas e conteúdo',
        '5. Comparar com requisitos da campanha',
        '6. Clicar em "Aprovar Entrega"',
        '7. Verificar atualizações'
      ],
      expected_results: [
        'Delivery.status → "approved"',
        'Delivery.approved_at e reviewed_at definidos',
        'Application.status → "completed"',
        'Creator.completed_campaigns incrementado',
        'Notificação enviada ao creator',
        'on_time_rate do creator atualizado (se aplicável)'
      ],
      validation_points: [
        'Transição válida (submitted → approved)',
        'Delivery.on_time registrado corretamente'
      ],
      entities_affected: [
        'Delivery: status, approved_at, reviewed_at',
        'Application: status → completed',
        'Creator: completed_campaigns++, on_time_rate recalculado'
      ]
    },

    happy_path_contest: {
      steps: [
        '1. Seguir passos 1-5 acima',
        '2. Identificar não-conformidade com requisitos',
        '3. Preencher motivo detalhado da contestação',
        '4. Clicar em "Confirmar Contestação"',
        '5. Verificar criação de disputa'
      ],
      expected_results: [
        'Delivery.status → "in_dispute"',
        'Delivery.contested_at e reviewed_at definidos',
        'Delivery.contest_reason salvo',
        'Dispute criada com status "open"',
        'Dispute.raised_by = "brand"',
        'Dispute.brand_statement = contest_reason',
        'Notificação enviada ao creator e admins'
      ],
      validation_points: [
        'contest_reason obrigatório (min 20 chars)',
        'Transição válida (submitted → in_dispute)',
        'Dispute criada com todos os IDs necessários'
      ],
      entities_affected: [
        'Delivery: status, contested_at, reviewed_at, contest_reason',
        'Dispute: nova entidade criada'
      ]
    },

    edge_cases: [
      {
        name: 'Aprovar sem revisar',
        steps: ['Tentar aprovar imediatamente sem ver detalhes'],
        expected: 'Permitir (decisão da marca), mas alertar para revisar'
      },
      {
        name: 'Contestar sem motivo',
        steps: ['Tentar contestar sem preencher motivo'],
        expected: 'Bloquear, exigir motivo mínimo 20 chars'
      },
      {
        name: 'Avaliar entrega não-submitted',
        steps: ['Tentar aprovar/contestar entrega pending ou já avaliada'],
        expected: 'Bloquear, transição inválida'
      }
    ],

    integration_tests: [
      {
        name: 'Cascata de atualizações ao aprovar',
        test: 'Aprovar entrega deve atualizar Delivery, Application e Creator atomicamente',
        entities: ['Delivery', 'Application', 'Creator']
      },
      {
        name: 'Criação de disputa ao contestar',
        test: 'Contestar deve criar Dispute com todos os dados corretos',
        validation: 'Dispute possui delivery_id, campaign_id, brand_id, creator_id, reason'
      },
      {
        name: 'Estatísticas do creator',
        test: 'completed_campaigns e on_time_rate calculados corretamente',
        validation: 'Creator stats consistentes com histórico de entregas'
      }
    ]
  },

  /**
   * FLUXO 6: RESOLVER DISPUTA (Admin)
   * 
   * Pré-condições:
   * - Dispute com status "open" ou "under_review"
   * - Usuário admin
   */
  resolveDispute: {
    happy_path: {
      steps: [
        '1. Admin acessa Admin > Disputes',
        '2. Seleciona disputa aberta',
        '3. Revisa evidências de ambas as partes',
        '4. Revisa requisitos da campanha',
        '5. Escolhe resolução (creator_favor ou brand_favor)',
        '6. Escreve justificativa detalhada (min 30 chars)',
        '7. Clica em "Resolver Disputa"',
        '8. Verifica atualizações'
      ],
      expected_results: [
        'Dispute.status → "resolved_creator_favor" ou "resolved_brand_favor"',
        'Dispute.resolved_at, resolution, resolved_by definidos',
        'Delivery.status → "approved" (creator favor) ou permanece "contested"',
        'Application pode ser atualizada conforme resolução',
        'AuditLog criado documentando ação do admin',
        'Notificações enviadas a creator e brand',
        'Reputação atualizada para a parte perdedora'
      ],
      validation_points: [
        'resolution obrigatória (min 30 chars)',
        'Transição de estado válida',
        'Admin autenticado e verificado',
        'Justificativa clara e objetiva'
      ],
      entities_affected: [
        'Dispute: status, resolved_at, resolution, resolved_by',
        'Delivery: status pode mudar conforme resolução',
        'Application: pode ser atualizada',
        'AuditLog: nova entrada criada',
        'Reputation: ajustada para as partes'
      ]
    },

    edge_cases: [
      {
        name: 'Resolver sem justificativa',
        steps: ['Tentar resolver sem preencher campo resolution'],
        expected: 'Bloquear, validação exige min 30 chars'
      },
      {
        name: 'Resolver disputa já resolvida',
        steps: ['Tentar resolver disputa com status resolved_*'],
        expected: 'Bloquear, transição inválida'
      },
      {
        name: 'Não-admin tenta resolver',
        steps: ['Brand ou Creator tenta acessar resolução'],
        expected: 'Bloquear acesso, apenas admins'
      }
    ],

    integration_tests: [
      {
        name: 'Cascata completa de resolução',
        test: 'Resolver disputa deve atualizar Dispute, Delivery, AuditLog, Reputation atomicamente',
        entities: ['Dispute', 'Delivery', 'Application', 'AuditLog', 'Reputation']
      },
      {
        name: 'Auditoria completa',
        test: 'AuditLog deve registrar admin_id, timestamp, ação, detalhes da resolução',
        validation: 'Existe AuditLog com action=dispute_resolved'
      },
      {
        name: 'Reputação consistente',
        test: 'Reputation.disputes_won e disputes_lost devem refletir histórico real',
        validation: 'Somar disputes de todas as resoluções deve bater com stats'
      }
    ]
  }
};

/**
 * TESTES DE INTEGRAÇÃO DE ENTIDADES
 * 
 * Cenários onde múltiplas entidades são afetadas simultaneamente
 */
export const integrationTests = {
  
  /**
   * TESTE 1: Aceitar candidatura atualiza 3+ entidades
   */
  acceptApplication_multiEntity: {
    description: 'Aceitar candidatura deve atualizar Application, Campaign, Delivery atomicamente',
    
    setup: [
      'Criar Brand, Creator, Campaign (com 5 vagas)',
      'Criar Application pendente'
    ],
    
    action: 'Brand aceita a candidatura',
    
    assertions: [
      'Application.status === "accepted"',
      'Application.accepted_at !== null',
      'Campaign.slots_filled incrementado em 1',
      'Nova Delivery criada',
      'Delivery.status === "pending"',
      'Delivery.campaign_id === Campaign.id',
      'Delivery.creator_id === Creator.id',
      'Delivery.brand_id === Brand.id',
      'Delivery.deadline === Campaign.deadline'
    ],
    
    rollback_test: 'Se Delivery.create falhar, Application e Campaign não devem ser atualizados'
  },

  /**
   * TESTE 2: Aprovar entrega atualiza 3 entidades
   */
  approveDelivery_multiEntity: {
    description: 'Aprovar entrega deve atualizar Delivery, Application, Creator atomicamente',
    
    setup: [
      'Criar Brand, Creator, Campaign, Application accepted',
      'Criar Delivery submitted (com on_time = true)'
    ],
    
    action: 'Brand aprova a entrega',
    
    assertions: [
      'Delivery.status === "approved"',
      'Delivery.approved_at !== null',
      'Application.status === "completed"',
      'Creator.completed_campaigns incrementado em 1',
      'Se on_time: Creator.on_time_rate recalculado corretamente'
    ],
    
    edge_case: 'Se Creator.update falhar, Delivery e Application não devem mudar'
  },

  /**
   * TESTE 3: Contestar entrega cria disputa
   */
  contestDelivery_createsDispute: {
    description: 'Contestar entrega deve atualizar Delivery e criar Dispute',
    
    setup: [
      'Criar Brand, Creator, Campaign, Application, Delivery submitted'
    ],
    
    action: 'Brand contesta entrega com motivo válido',
    
    assertions: [
      'Delivery.status === "in_dispute"',
      'Delivery.contest_reason !== null',
      'Delivery.contested_at !== null',
      'Nova Dispute criada',
      'Dispute.status === "open"',
      'Dispute.raised_by === "brand"',
      'Dispute.delivery_id === Delivery.id',
      'Dispute.reason === contest_reason',
      'Todos os IDs (campaign, brand, creator) corretos na Dispute'
    ],
    
    data_consistency: 'Dispute.campaign_id deve corresponder a Delivery.campaign_id'
  },

  /**
   * TESTE 4: Resolver disputa em favor do creator
   */
  resolveDispute_creatorFavor: {
    description: 'Resolver disputa a favor do creator atualiza múltiplas entidades',
    
    setup: [
      'Criar Brand, Creator, Campaign, Application, Delivery in_dispute, Dispute open'
    ],
    
    action: 'Admin resolve disputa em favor do creator',
    
    assertions: [
      'Dispute.status === "resolved_creator_favor"',
      'Dispute.resolution !== null',
      'Dispute.resolved_at !== null',
      'Dispute.resolved_by === admin.id',
      'Delivery.status === "approved"',
      'Application.status === "completed"',
      'Creator.completed_campaigns incrementado',
      'Creator.disputes_won incrementado',
      'Brand.disputes_lost incrementado (se tiver Reputation)',
      'AuditLog criado com action === "dispute_resolved"'
    ]
  },

  /**
   * TESTE 5: Múltiplas candidaturas simultâneas
   */
  concurrent_applications: {
    description: 'Várias candidaturas simultâneas não devem exceder vagas disponíveis',
    
    setup: [
      'Criar Campaign com slots_total = 3',
      'Criar 5 Applications pendentes de creators diferentes'
    ],
    
    action: 'Brand tenta aceitar 4 candidaturas rapidamente',
    
    expected_behavior: [
      'Primeiras 3 são aceitas com sucesso',
      '4ª deve ser rejeitada com erro "Não há vagas disponíveis"',
      'Campaign.slots_filled === 3 (não 4)',
      'Exatamente 3 Deliveries criadas'
    ],
    
    race_condition_test: 'Testar aceitação simultânea (concorrência) para verificar locks'
  },

  /**
   * TESTE 6: Cancelar campanha com candidaturas/entregas ativas
   */
  cancelCampaign_cascadeEffects: {
    description: 'Cancelar campanha deve considerar estado de applications/deliveries',
    
    setup: [
      'Criar Campaign active',
      'Criar 2 Applications accepted',
      '1 Delivery pending, 1 Delivery submitted'
    ],
    
    action: 'Brand cancela a campanha',
    
    expected_behavior: [
      'Campaign.status === "cancelled"',
      'Applications accepted permanecem (ou são marcadas como afetadas)',
      'Deliveries pending/submitted permanecem para conclusão',
      'Notificações enviadas aos creators afetados'
    ],
    
    data_integrity: 'Creators devem poder completar entregas já aceitas'
  },

  /**
   * TESTE 7: Estatísticas consistentes
   */
  statistics_consistency: {
    description: 'Estatísticas devem sempre refletir o estado real das entidades',
    
    tests: [
      {
        stat: 'Campaign.total_applications',
        validation: 'Deve ser igual ao número de Applications com campaign_id correspondente'
      },
      {
        stat: 'Campaign.slots_filled',
        validation: 'Deve ser igual ao número de Applications com status "accepted" ou "completed"'
      },
      {
        stat: 'Creator.completed_campaigns',
        validation: 'Deve ser igual ao número de Applications completed do creator'
      },
      {
        stat: 'Creator.on_time_rate',
        validation: 'Deve ser (deliveries on_time / total deliveries) * 100'
      }
    ]
  }
};

/**
 * CENÁRIOS DE TESTE NEGATIVOS
 * 
 * Testes que devem FALHAR ou serem BLOQUEADOS
 */
export const negativeTests = {
  
  validations: [
    {
      test: 'Criar campanha com budget_min > budget_max',
      expected: 'Erro de validação'
    },
    {
      test: 'Criar campanha com deadline no passado',
      expected: 'Erro de validação'
    },
    {
      test: 'Submeter delivery sem provas',
      expected: 'Erro de validação'
    },
    {
      test: 'Contestar delivery sem motivo',
      expected: 'Erro de validação'
    },
    {
      test: 'Resolver disputa sem justificativa',
      expected: 'Erro de validação'
    }
  ],
  
  stateTransitions: [
    {
      test: 'Tentar mudar Campaign de "completed" para "active"',
      expected: 'Erro: transição inválida'
    },
    {
      test: 'Tentar aceitar Application já "rejected"',
      expected: 'Erro: transição inválida'
    },
    {
      test: 'Tentar aprovar Delivery "pending" (pular "submitted")',
      expected: 'Erro: transição inválida'
    },
    {
      test: 'Tentar reabrir Dispute "closed"',
      expected: 'Erro: transição inválida'
    }
  ],
  
  businessRules: [
    {
      test: 'Aceitar candidatura quando slots_filled >= slots_total',
      expected: 'Erro: não há vagas disponíveis'
    },
    {
      test: 'Candidatar-se duas vezes à mesma campanha',
      expected: 'Erro: candidatura duplicada'
    },
    {
      test: 'Ativar campanha sem vagas (slots_total = 0)',
      expected: 'Erro: campanha deve ter pelo menos 1 vaga'
    }
  ],
  
  permissions: [
    {
      test: 'Creator tentar aprovar própria entrega',
      expected: 'Erro: apenas brand pode avaliar'
    },
    {
      test: 'Brand tentar resolver disputa',
      expected: 'Erro: apenas admin pode resolver disputas'
    },
    {
      test: 'Usuário não-assinante criar campanha',
      expected: 'Bloqueado com paywall'
    }
  ]
};

/**
 * HELPER: Executar checklist de teste manual
 */
export function getTestChecklist(flowName) {
  const flow = criticalFlows[flowName];
  if (!flow) return null;
  
  return {
    flow: flowName,
    happy_path: flow.happy_path,
    edge_cases: flow.edge_cases,
    integration_tests: flow.integration_tests || []
  };
}