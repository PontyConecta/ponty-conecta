import { z } from 'zod';

/**
 * Schemas de validação para entidades usando Zod
 */

export const campaignSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(100, 'Título muito longo'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(2000, 'Descrição muito longa'),
  requirements: z.string().min(10, 'Requisitos devem ter no mínimo 10 caracteres'),
  platforms: z.array(z.string()).min(1, 'Selecione pelo menos uma plataforma'),
  content_type: z.array(z.string()).optional(),
  niche_required: z.array(z.string()).optional(),
  deadline: z.string().min(1, 'Data de entrega é obrigatória'),
  application_deadline: z.string().optional(),
  remuneration_type: z.enum(['cash', 'barter', 'mixed'], {
    errorMap: () => ({ message: 'Tipo de remuneração inválido' })
  }),
  budget_min: z.number().min(0, 'Valor mínimo inválido').optional().nullable(),
  budget_max: z.number().min(0, 'Valor máximo inválido').optional().nullable(),
  slots_total: z.number().min(1, 'Deve ter pelo menos 1 vaga').max(100, 'Máximo de 100 vagas'),
  proof_requirements: z.string().min(10, 'Especifique como provar a entrega'),
}).refine((data) => {
  // Se for cash ou mixed, deve ter budget
  if (data.remuneration_type === 'cash' || data.remuneration_type === 'mixed') {
    return data.budget_min && data.budget_max;
  }
  return true;
}, {
  message: 'Para pagamento em dinheiro, especifique valores mínimo e máximo',
  path: ['budget_min']
}).refine((data) => {
  // Budget min deve ser menor que max
  if (data.budget_min && data.budget_max) {
    return data.budget_min <= data.budget_max;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor ou igual ao máximo',
  path: ['budget_max']
}).refine((data) => {
  // Deadline deve ser no futuro
  if (data.deadline) {
    const deadlineDate = new Date(data.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate >= today;
  }
  return true;
}, {
  message: 'Data de entrega deve ser futura',
  path: ['deadline']
});

export const applicationSchema = z.object({
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres').max(1000, 'Mensagem muito longa').optional(),
  proposed_rate: z.number().min(0, 'Valor proposto inválido').optional().nullable(),
});

export const deliverySchema = z.object({
  proof_urls: z.array(z.string().url('URL inválida')).min(1, 'Envie pelo menos uma prova'),
  content_urls: z.array(z.string().url('URL inválida')).optional(),
  proof_notes: z.string().max(1000, 'Nota muito longa').optional(),
});

export const disputeSchema = z.object({
  reason: z.string().min(20, 'Motivo deve ter no mínimo 20 caracteres').max(2000, 'Motivo muito longo'),
  evidence_urls: z.array(z.string().url('URL inválida')).optional(),
});

export const disputeResolutionSchema = z.object({
  resolution: z.string().min(30, 'Justificativa deve ter no mínimo 30 caracteres').max(2000, 'Justificativa muito longa'),
  resolution_type: z.enum(['resolved_creator_favor', 'resolved_brand_favor'], {
    errorMap: () => ({ message: 'Tipo de resolução inválido' })
  }),
});

/**
 * Valida dados contra um schema
 * @param {Object} schema - Schema Zod
 * @param {Object} data - Dados a validar
 * @returns {{ success: boolean, errors?: Object, data?: Object }}
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Converte erros do Zod para formato amigável
  const errors = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return { success: false, errors };
};