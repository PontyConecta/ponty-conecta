import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Execute → Respond ───

const FN = 'onboardingFinalize';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { profile_type } = await req.json();

    if (!['brand', 'creator'].includes(profile_type)) {
      return err('Invalid profile_type', 'INVALID_INPUT');
    }

    // ── 3. OWNERSHIP ──
    const entityName = profile_type === 'brand' ? 'Brand' : 'Creator';
    const profiles = await base44.entities[entityName].filter({ user_id: user.id });

    if (profiles.length === 0) {
      return err('Profile not found', 'NOT_FOUND', 404);
    }

    const profile = profiles[0];
    if (profile.user_id !== user.id) {
      return err('Forbidden', 'FORBIDDEN', 403);
    }

    // Already ready — idempotent
    if (profile.account_state === 'ready' && profile.subscription_status) {
      return Response.json({ success: true, profile });
    }

    // ── 4. EXECUTE ──
    const updatePayload = {
      account_state: 'ready',
      onboarding_step: 6,
    };

    // Brands are free forever — no trial needed
    if (profile_type === 'brand') {
      updatePayload.subscription_status = 'free';
    }

    await base44.entities[entityName].update(profile.id, updatePayload);

    // Fire-and-forget: create onboarding missions
    try {
      await base44.functions.invoke('createOnboardingMissions', {
        profile_type,
        profile_id: profile.id,
      });
    } catch (e) {
      console.warn(`[${FN}] Mission creation failed (non-critical):`, e.message);
    }

    // Fire-and-forget: send brand welcome email
    if (profile_type === 'brand') {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Sua marca entrou no Ponty',
          body: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px">
<h1 style="font-size:22px;margin-bottom:12px">Bem-vinda ao clube.</h1>
<p style="font-size:15px;line-height:1.6;color:#444">A partir de agora você pode conectar sua marca aos criadores certos — sem custo, sem contrato longo, sem enrolação.</p>
<h3 style="font-size:16px;margin-top:24px">Primeiros passos</h3>
<ul style="font-size:14px;line-height:1.8;color:#555">
<li>Crie sua primeira campanha e defina o que precisa.</li>
<li>Receba candidaturas de criadores alinhados ao seu perfil.</li>
<li>Avalie, aprove e acompanhe as entregas — tudo na plataforma.</li>
</ul>
<div style="margin-top:28px">
<a href="https://app.ponty.com.br/BrandDashboard" style="display:inline-block;background:#6b5475;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Entrar no dashboard</a>
</div>
<p style="margin-top:32px;font-size:13px;color:#999">Equipe Ponty</p>
</div>`,
        });
      } catch (e) {
        console.warn(`[${FN}] Brand welcome email failed (non-critical):`, e.message);
      }
    }

    // ── 5. RESPOND ──
    console.log(`[${FN}] Finalized ${profile_type} for user ${user.id}`);
    return Response.json({
      success: true,
      profile: { ...profile, ...updatePayload },
    });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});