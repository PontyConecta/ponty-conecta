/**
 * TEST HELPERS
 * 
 * Funções auxiliares para facilitar testes e validação de dados
 */

/**
 * Valida consistência de dados entre entidades relacionadas
 */
export const dataConsistencyChecks = {
  
  /**
   * Verifica se Application e Delivery estão sincronizadas
   */
  checkApplicationDeliverySync: (application, delivery) => {
    const errors = [];
    
    if (!delivery && application.status === 'accepted') {
      errors.push('Application accepted deve ter Delivery correspondente');
    }
    
    if (delivery) {
      if (delivery.application_id !== application.id) {
        errors.push('Delivery.application_id não corresponde a Application.id');
      }
      
      if (delivery.campaign_id !== application.campaign_id) {
        errors.push('IDs de campanha não correspondem entre Application e Delivery');
      }
      
      if (delivery.creator_id !== application.creator_id) {
        errors.push('IDs de creator não correspondem');
      }
      
      if (delivery.brand_id !== application.brand_id) {
        errors.push('IDs de brand não correspondem');
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  /**
   * Verifica se Campaign.slots_filled está correto
   */
  checkCampaignSlots: (campaign, applications) => {
    const acceptedApps = applications.filter(a => 
      a.campaign_id === campaign.id && 
      (a.status === 'accepted' || a.status === 'completed')
    );
    
    const expected = acceptedApps.length;
    const actual = campaign.slots_filled || 0;
    
    return {
      valid: expected === actual,
      expected,
      actual,
      error: expected !== actual ? `Esperado ${expected}, encontrado ${actual}` : null
    };
  },
  
  /**
   * Verifica se Campaign.total_applications está correto
   */
  checkCampaignApplicationCount: (campaign, applications) => {
    const campaignApps = applications.filter(a => a.campaign_id === campaign.id);
    const expected = campaignApps.length;
    const actual = campaign.total_applications || 0;
    
    return {
      valid: expected === actual,
      expected,
      actual,
      error: expected !== actual ? `Esperado ${expected}, encontrado ${actual}` : null
    };
  },
  
  /**
   * Verifica se Creator.completed_campaigns está correto
   */
  checkCreatorCompletedCount: (creator, applications) => {
    const completed = applications.filter(a => 
      a.creator_id === creator.id && 
      a.status === 'completed'
    );
    
    const expected = completed.length;
    const actual = creator.completed_campaigns || 0;
    
    return {
      valid: expected === actual,
      expected,
      actual,
      error: expected !== actual ? `Esperado ${expected}, encontrado ${actual}` : null
    };
  },
  
  /**
   * Verifica se Dispute tem todos os IDs necessários
   */
  checkDisputeReferences: (dispute, delivery) => {
    const errors = [];
    
    if (!dispute.delivery_id) errors.push('Falta delivery_id');
    if (!dispute.campaign_id) errors.push('Falta campaign_id');
    if (!dispute.brand_id) errors.push('Falta brand_id');
    if (!dispute.creator_id) errors.push('Falta creator_id');
    
    if (delivery) {
      if (dispute.delivery_id !== delivery.id) {
        errors.push('dispute.delivery_id não corresponde a delivery.id');
      }
      if (dispute.campaign_id !== delivery.campaign_id) {
        errors.push('IDs de campanha não correspondem');
      }
      if (dispute.creator_id !== delivery.creator_id) {
        errors.push('IDs de creator não correspondem');
      }
      if (dispute.brand_id !== delivery.brand_id) {
        errors.push('IDs de brand não correspondem');
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  /**
   * Verifica se on_time foi calculado corretamente
   */
  checkOnTimeCalculation: (delivery) => {
    if (!delivery.submitted_at || !delivery.deadline) {
      return { valid: true, note: 'Sem dados para verificar' };
    }
    
    const submitted = new Date(delivery.submitted_at);
    const deadline = new Date(delivery.deadline);
    const expectedOnTime = submitted <= deadline;
    const actualOnTime = delivery.on_time;
    
    return {
      valid: expectedOnTime === actualOnTime,
      expected: expectedOnTime,
      actual: actualOnTime,
      error: expectedOnTime !== actualOnTime 
        ? `on_time deveria ser ${expectedOnTime}, mas é ${actualOnTime}`
        : null
    };
  }
};

/**
 * Simula ações de usuário para testes
 */
export const testActions = {
  
  /**
   * Simula criação de campanha completa
   */
  mockCreateCampaign: (brandId, overrides = {}) => ({
    brand_id: brandId,
    title: 'Campanha Teste',
    description: 'Descrição detalhada da campanha de teste',
    requirements: 'Requisitos específicos para entrega',
    platforms: ['Instagram', 'TikTok'],
    content_type: ['Reels', 'Stories'],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 dias
    remuneration_type: 'cash',
    budget_min: 500,
    budget_max: 2000,
    slots_total: 5,
    proof_requirements: 'Screenshots do post publicado com métricas visíveis',
    status: 'draft',
    ...overrides
  }),
  
  /**
   * Simula candidatura
   */
  mockCreateApplication: (campaignId, creatorId, brandId, overrides = {}) => ({
    campaign_id: campaignId,
    creator_id: creatorId,
    brand_id: brandId,
    status: 'pending',
    message: 'Gostaria de participar desta campanha',
    proposed_rate: 1000,
    ...overrides
  }),
  
  /**
   * Simula submissão de entrega
   */
  mockSubmitDelivery: (deliveryId, overrides = {}) => ({
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    proof_urls: ['https://example.com/proof1.jpg', 'https://example.com/proof2.jpg'],
    content_urls: ['https://instagram.com/p/example'],
    proof_notes: 'Entrega realizada conforme requisitos',
    ...overrides
  })
};

/**
 * Validadores de estado
 */
export const stateValidators = {
  
  /**
   * Valida se transição de estado é permitida
   */
  isValidTransition: (entityType, currentState, newState) => {
    const transitions = {
      campaign: {
        draft: ['active', 'cancelled'],
        active: ['paused', 'applications_closed', 'completed', 'cancelled'],
        paused: ['active', 'cancelled'],
        applications_closed: ['active', 'completed', 'cancelled'],
        completed: [],
        cancelled: []
      },
      application: {
        pending: ['accepted', 'rejected', 'withdrawn'],
        accepted: ['completed', 'withdrawn'],
        rejected: [],
        withdrawn: [],
        completed: []
      },
      delivery: {
        pending: ['submitted'],
        submitted: ['approved', 'in_dispute'],
        approved: [],
        in_dispute: ['approved', 'closed'],
        closed: []
      },
      dispute: {
        open: ['under_review', 'resolved_creator_favor', 'resolved_brand_favor', 'closed'],
        under_review: ['resolved_creator_favor', 'resolved_brand_favor', 'closed'],
        resolved_creator_favor: ['closed'],
        resolved_brand_favor: ['closed'],
        closed: []
      }
    };
    
    const entityTransitions = transitions[entityType];
    if (!entityTransitions) return { valid: false, error: 'Tipo de entidade inválido' };
    
    const allowedTransitions = entityTransitions[currentState];
    if (!allowedTransitions) return { valid: false, error: 'Estado atual inválido' };
    
    return {
      valid: allowedTransitions.includes(newState),
      allowed: allowedTransitions,
      error: !allowedTransitions.includes(newState) 
        ? `Transição ${currentState} → ${newState} não permitida`
        : null
    };
  },
  
  /**
   * Valida estado final de entidade
   */
  validateFinalState: (entity, entityType) => {
    const finalStates = {
      campaign: ['completed', 'cancelled'],
      application: ['rejected', 'withdrawn', 'completed'],
      delivery: ['approved', 'closed'],
      dispute: ['closed']
    };
    
    const finals = finalStates[entityType] || [];
    return finals.includes(entity.status);
  }
};

/**
 * Gerador de dados de teste
 */
export const testDataGenerator = {
  
  /**
   * Gera conjunto completo de dados para teste de fluxo
   */
  generateCompleteFlow: () => {
    const brandId = 'brand_test_1';
    const creatorId = 'creator_test_1';
    
    const campaign = testActions.mockCreateCampaign(brandId);
    const application = testActions.mockCreateApplication(campaign.id, creatorId, brandId);
    
    return {
      brand: { id: brandId, company_name: 'Test Brand', user_id: 'user_brand_1' },
      creator: { id: creatorId, display_name: 'Test Creator', user_id: 'user_creator_1' },
      campaign,
      application,
      delivery: {
        application_id: application.id,
        campaign_id: campaign.id,
        creator_id: creatorId,
        brand_id: brandId,
        status: 'pending',
        deadline: campaign.deadline
      }
    };
  }
};

/**
 * Executa bateria de validações de consistência
 */
export async function runConsistencyChecks(data) {
  const results = [];
  
  if (data.campaign && data.applications) {
    results.push({
      check: 'Campaign slots consistency',
      ...dataConsistencyChecks.checkCampaignSlots(data.campaign, data.applications)
    });
    
    results.push({
      check: 'Campaign applications count',
      ...dataConsistencyChecks.checkCampaignApplicationCount(data.campaign, data.applications)
    });
  }
  
  if (data.application && data.delivery) {
    results.push({
      check: 'Application-Delivery sync',
      ...dataConsistencyChecks.checkApplicationDeliverySync(data.application, data.delivery)
    });
  }
  
  if (data.creator && data.applications) {
    results.push({
      check: 'Creator completed count',
      ...dataConsistencyChecks.checkCreatorCompletedCount(data.creator, data.applications)
    });
  }
  
  if (data.delivery && data.delivery.submitted_at) {
    results.push({
      check: 'Delivery on_time calculation',
      ...dataConsistencyChecks.checkOnTimeCalculation(data.delivery)
    });
  }
  
  if (data.dispute && data.delivery) {
    results.push({
      check: 'Dispute references',
      ...dataConsistencyChecks.checkDisputeReferences(data.dispute, data.delivery)
    });
  }
  
  const allValid = results.every(r => r.valid);
  const errors = results.filter(r => !r.valid).map(r => r.error || r.errors).flat();
  
  return {
    valid: allValid,
    results,
    errors,
    summary: `${results.filter(r => r.valid).length}/${results.length} checks passed`
  };
}