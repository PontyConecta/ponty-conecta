import { z } from 'zod';

// Brand Schemas
export const BrandProfileSchema = z.object({
  company_name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  industry: z.enum(['fashion', 'beauty', 'tech', 'food_beverage', 'health_wellness', 'travel', 
    'entertainment', 'sports', 'finance', 'education', 'retail', 'automotive', 'other']),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  website: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
  contact_email: z.string()
    .email('Email inválido')
    .optional(),
  contact_phone: z.string()
    .optional(),
  social_instagram: z.string()
    .max(50)
    .optional(),
  social_linkedin: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

// Creator Schemas
export const CreatorProfileSchema = z.object({
  display_name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  bio: z.string()
    .max(500, 'Bio deve ter no máximo 500 caracteres')
    .optional(),
  niche: z.array(z.string())
    .min(1, 'Selecione pelo menos um nicho')
    .max(5, 'Selecione no máximo 5 nichos'),
  location: z.string()
    .max(100)
    .optional(),
  contact_email: z.string()
    .email('Email inválido')
    .optional(),
  contact_whatsapp: z.string()
    .optional(),
  rate_cash_min: z.number()
    .min(0, 'Valor mínimo inválido')
    .optional(),
  rate_cash_max: z.number()
    .min(0, 'Valor máximo inválido')
    .optional(),
  accepts_barter: z.boolean()
    .default(true),
});

// Campaign Schema
export const CampaignSchema = z.object({
  title: z.string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  requirements: z.string()
    .max(1000)
    .optional(),
  platforms: z.array(z.string())
    .min(1, 'Selecione pelo menos uma plataforma'),
  content_type: z.array(z.string())
    .min(1, 'Selecione pelo menos um tipo de conteúdo'),
  deadline: z.string()
    .min(1, 'Prazo de entrega é obrigatório'),
  application_deadline: z.string()
    .min(1, 'Prazo para candidaturas é obrigatório'),
  remuneration_type: z.enum(['cash', 'barter', 'mixed']),
  budget_min: z.number()
    .min(0)
    .optional(),
  budget_max: z.number()
    .min(0)
    .optional(),
  slots_total: z.number()
    .min(1, 'Número de vagas deve ser no mínimo 1')
    .max(100, 'Número de vagas deve ser no máximo 100'),
});

// Application Schema
export const ApplicationSchema = z.object({
  message: z.string()
    .min(10, 'Mensagem deve ter no mínimo 10 caracteres')
    .max(500, 'Mensagem deve ter no máximo 500 caracteres')
    .optional(),
  proposed_rate: z.number()
    .min(0)
    .optional(),
});

// Delivery Schema
export const DeliverySchema = z.object({
  proof_urls: z.array(z.string().url())
    .min(1, 'Envie pelo menos um comprovante'),
  proof_notes: z.string()
    .max(500)
    .optional(),
  content_urls: z.array(z.string().url())
    .optional(),
});

// Dispute Schema
export const DisputeSchema = z.object({
  reason: z.string()
    .min(20, 'Explique o motivo da disputa (mínimo 20 caracteres)')
    .max(1000, 'Motivo muito longo (máximo 1000 caracteres)'),
  evidence_urls: z.array(z.string().url())
    .optional(),
});

// Helper para validar dados
export function validateData(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(firstError.message);
    }
    throw error;
  }
}