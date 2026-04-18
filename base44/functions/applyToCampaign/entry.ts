import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FN = 'applyToCampaign';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // 1. AUTH
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // 1b. BRAND GUARD — only creators can apply
    const brandCheck = await base44.entities.Brand.filter({ user_id: user.id });
    if (brandCheck.length > 0) {
      return err('Apenas criadores podem se candidatar', 'FORBIDDEN', 403);
    }

    // 2. INPUT
    const { campaign_id, message, proposed_rate } = await req.json();
    if (!campaign_id) return err('campaign_id é obrigatório', 'MISSING_FIELDS');

    // 3. CREATOR PROFILE
    const creators = await base44.entities.Creator.filter({ user_id: user.id });
    if (creators.length === 0) return err('Perfil de creator não encontrado', 'FORBIDDEN', 403);
    const creator = creators[0];

    // 4. SUBSCRIPTION CHECK — 'premium' or 'legacy' grants access
    if (!['premium', 'legacy'].includes(creator.subscription_status)) {
      return err('Assinatura ativa necessária', 'SUBSCRIPTION_REQUIRED', 403);
    }

    // 4b. TRIAL EXPIRY CHECK
    if (creator.trial_end_date && !creator.stripe_customer_id) {
      if (new Date(creator.trial_end_date) < new Date()) {
        await base44.entities.Creator.update(creator.id, { subscription_status: 'starter' });
        return err('Seu período de teste expirou', 'TRIAL_EXPIRED', 403);
      }
    }

    // 5. CAMPAIGN CHECK
    const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
    if (campaigns.length === 0) return err('Campanha não encontrada', 'NOT_FOUND', 404);
    const campaign = campaigns[0];

    if (campaign.status !== 'active') {
      return err('Campanha não está aceitando candidaturas', 'CAMPAIGN_NOT_ACTIVE');
    }

    // 5b. SLOT CAPACITY CHECK
    if (campaign.slots_filled >= campaign.slots_total) {
      return err('Campanha sem vagas disponíveis', 'CAMPAIGN_FULL');
    }

    // 6. DUPLICATE CHECK
    const existing = await base44.entities.Application.filter({ campaign_id, creator_id: creator.id });
    if (existing.length > 0) {
      return err('Você já se candidatou a esta campanha', 'DUPLICATE_APPLICATION');
    }

    // 7. VALIDATE PROPOSED RATE
    if (proposed_rate !== undefined && proposed_rate !== null) {
      if (typeof proposed_rate === 'string' && proposed_rate.length > 20) {
        return err('proposed_rate inválido', 'INVALID_RATE');
      }
      const rate = parseFloat(proposed_rate);
      if (isNaN(rate) || rate < 0 || rate > 100000) {
        return err('proposed_rate deve ser entre 0 e 100.000', 'INVALID_RATE');
      }
    }

    // 8. CREATE APPLICATION
    const application = await base44.entities.Application.create({
      campaign_id,
      creator_id: creator.id,
      brand_id: campaign.brand_id,
      message: message || '',
      proposed_rate: proposed_rate ? parseFloat(proposed_rate) : null,
      status: 'pending',
    });

    console.log(`[${FN}] Creator ${creator.id} applied to campaign ${campaign_id}`);
    return Response.json({ success: true, application_id: application.id });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});