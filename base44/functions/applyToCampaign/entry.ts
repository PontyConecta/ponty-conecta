import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // 2. INPUT
    const { campaign_id, message, proposed_rate } = await req.json();
    if (!campaign_id) return err('campaign_id é obrigatório', 'MISSING_FIELDS');

    // 3. CREATOR PROFILE
    const creators = await base44.entities.Creator.filter({ user_id: user.id });
    if (creators.length === 0) return err('Perfil de creator não encontrado', 'FORBIDDEN', 403);
    const creator = creators[0];

    // 4. SUBSCRIPTION CHECK
    const validStatuses = ['premium', 'trial', 'legacy'];
    if (!validStatuses.includes(creator.subscription_status)) {
      return err('Assinatura ativa necessária', 'SUBSCRIPTION_REQUIRED', 403);
    }

    // 4b. TRIAL EXPIRY CHECK
    if (creator.subscription_status === 'trial') {
      if (!creator.trial_end_date || new Date(creator.trial_end_date) <= new Date()) {
        return err('Trial expirado', 'SUBSCRIPTION_REQUIRED', 403);
      }
    }

    // 5. CAMPAIGN CHECK
    const campaigns = await base44.entities.Campaign.filter({ id: campaign_id });
    if (campaigns.length === 0) return err('Campanha não encontrada', 'NOT_FOUND', 404);
    const campaign = campaigns[0];

    if (campaign.status !== 'active') {
      return err('Campanha não está aceitando candidaturas', 'CAMPAIGN_NOT_ACTIVE');
    }

    // 6. DUPLICATE CHECK
    const existing = await base44.entities.Application.filter({ campaign_id, creator_id: creator.id });
    if (existing.length > 0) {
      return err('Você já se candidatou a esta campanha', 'DUPLICATE_APPLICATION');
    }

    // 7. CREATE APPLICATION
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