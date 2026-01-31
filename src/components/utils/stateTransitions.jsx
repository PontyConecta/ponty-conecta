/**
 * Validação de transições de estado para entidades
 */

/**
 * Transições válidas para Campaign
 */
const campaignTransitions = {
  draft: ['active', 'cancelled'],
  under_review: ['active', 'draft', 'cancelled'],
  active: ['paused', 'applications_closed', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  applications_closed: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Transições válidas para Application
 */
const applicationTransitions = {
  pending: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['completed', 'withdrawn'],
  rejected: [],
  withdrawn: [],
  completed: []
};

/**
 * Transições válidas para Delivery
 */
const deliveryTransitions = {
  pending: ['submitted'],
  submitted: ['approved', 'contested'],
  approved: ['in_dispute'],
  contested: ['in_dispute', 'approved'],
  in_dispute: ['approved', 'closed'],
  resolved: ['closed'],
  closed: []
};

/**
 * Transições válidas para Dispute
 */
const disputeTransitions = {
  open: ['under_review', 'resolved_creator_favor', 'resolved_brand_favor', 'closed'],
  under_review: ['resolved_creator_favor', 'resolved_brand_favor', 'closed'],
  resolved_creator_favor: ['closed'],
  resolved_brand_favor: ['closed'],
  closed: []
};

const transitions = {
  campaign: campaignTransitions,
  application: applicationTransitions,
  delivery: deliveryTransitions,
  dispute: disputeTransitions
};

/**
 * Verifica se uma transição de estado é válida
 * @param {string} entityType - Tipo da entidade (campaign, application, delivery, dispute)
 * @param {string} currentState - Estado atual
 * @param {string} newState - Novo estado desejado
 * @returns {{ valid: boolean, error?: string }}
 */
export const isValidTransition = (entityType, currentState, newState) => {
  const entityTransitions = transitions[entityType];
  
  if (!entityTransitions) {
    return { valid: false, error: `Tipo de entidade inválido: ${entityType}` };
  }
  
  if (!entityTransitions[currentState]) {
    return { valid: false, error: `Estado atual inválido: ${currentState}` };
  }
  
  if (!entityTransitions[currentState].includes(newState)) {
    return { 
      valid: false, 
      error: `Transição inválida de "${currentState}" para "${newState}"` 
    };
  }
  
  return { valid: true };
};

/**
 * Valida regras de negócio para Campaign
 */
export const validateCampaignBusinessRules = (campaign, newStatus) => {
  const errors = [];
  
  // Não pode ativar campanha sem slots
  if (newStatus === 'active' && (!campaign.slots_total || campaign.slots_total < 1)) {
    errors.push('Campanha deve ter pelo menos 1 vaga para ser ativada');
  }
  
  // Não pode ativar campanha com deadline passado
  if (newStatus === 'active' && campaign.deadline) {
    const deadline = new Date(campaign.deadline);
    const now = new Date();
    if (deadline < now) {
      errors.push('Não é possível ativar campanha com prazo vencido');
    }
  }
  
  // Não pode completar se ainda há slots vagos e aplicações pendentes
  if (newStatus === 'completed' && campaign.slots_filled < campaign.slots_total) {
    // Apenas aviso, não bloqueia
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Valida regras de negócio para Application
 */
export const validateApplicationBusinessRules = (application, campaign, newStatus) => {
  const errors = [];
  
  // Não pode aceitar se não há mais vagas
  if (newStatus === 'accepted') {
    if (campaign.slots_filled >= campaign.slots_total) {
      errors.push('Campanha já atingiu o número máximo de vagas');
    }
    
    // Não pode aceitar se campanha não está ativa
    if (campaign.status !== 'active' && campaign.status !== 'applications_closed') {
      errors.push('Campanha não está mais aceitando candidaturas');
    }
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Valida regras de negócio para Delivery
 */
export const validateDeliveryBusinessRules = (delivery, newStatus) => {
  const errors = [];
  
  // Não pode submeter sem provas
  if (newStatus === 'submitted' && (!delivery.proof_urls || delivery.proof_urls.length === 0)) {
    errors.push('Entrega deve ter pelo menos uma prova anexada');
  }
  
  // Não pode contestar sem motivo
  if (newStatus === 'contested' && !delivery.contest_reason) {
    errors.push('Especifique o motivo da contestação');
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Valida regras de negócio para Dispute
 */
export const validateDisputeBusinessRules = (dispute, newStatus) => {
  const errors = [];
  
  // Não pode resolver sem justificativa
  if ((newStatus === 'resolved_creator_favor' || newStatus === 'resolved_brand_favor') && !dispute.resolution) {
    errors.push('Resolução deve ter justificativa');
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Valida transição completa (estado + regras de negócio)
 */
export const validateTransition = (entityType, entity, newStatus, relatedData = {}) => {
  // Valida transição de estado
  const transitionResult = isValidTransition(entityType, entity.status, newStatus);
  if (!transitionResult.valid) {
    return transitionResult;
  }
  
  // Valida regras de negócio específicas
  let businessRulesResult;
  
  switch (entityType) {
    case 'campaign':
      businessRulesResult = validateCampaignBusinessRules(entity, newStatus);
      break;
    case 'application':
      businessRulesResult = validateApplicationBusinessRules(entity, relatedData.campaign, newStatus);
      break;
    case 'delivery':
      businessRulesResult = validateDeliveryBusinessRules(entity, newStatus);
      break;
    case 'dispute':
      businessRulesResult = validateDisputeBusinessRules(entity, newStatus);
      break;
    default:
      return { valid: true };
  }
  
  return businessRulesResult;
};