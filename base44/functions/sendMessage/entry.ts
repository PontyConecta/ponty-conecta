import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FN = 'sendMessage';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // 1. AUTH
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // 2. INPUT VALIDATION
    const { recipient_id, content, application_id } = await req.json();

    if (!recipient_id) return err('recipient_id é obrigatório', 'MISSING_FIELDS');
    if (!content || typeof content !== 'string' || !content.trim()) {
      return err('content não pode ser vazio', 'MISSING_FIELDS');
    }
    if (content.length > 2000) {
      return err('content deve ter no máximo 2000 caracteres', 'CONTENT_TOO_LONG');
    }

    // 3. VALIDATE RECIPIENT EXISTS
    const recipients = await base44.asServiceRole.entities.User.filter({ id: recipient_id });
    if (recipients.length === 0) {
      return err('Destinatário não encontrado', 'RECIPIENT_NOT_FOUND', 404);
    }

    if (recipient_id === user.id) {
      return err('Não é possível enviar mensagem para si mesmo', 'SELF_MESSAGE_NOT_ALLOWED', 400);
    }

    // 4. RATE LIMIT — max 30 messages in 60 seconds
    const recentMessages = await base44.entities.Message.filter(
      { sender_id: user.id },
      '-created_date',
      30
    );
    if (recentMessages.length >= 30) {
      const oldest = recentMessages[recentMessages.length - 1];
      const oldestDate = new Date(oldest.created_date);
      const now = new Date();
      if (now - oldestDate < 60000) {
        return err('Muitas mensagens enviadas. Aguarde um momento.', 'RATE_LIMITED', 429);
      }
    }

    // 5. Determine sender_type
    const [brandProfiles, creatorProfiles] = await Promise.all([
      base44.entities.Brand.filter({ user_id: user.id }),
      base44.entities.Creator.filter({ user_id: user.id }),
    ]);
    let senderType = 'creator';
    if (brandProfiles.length > 0 && creatorProfiles.length === 0) {
      senderType = 'brand';
    } else if (brandProfiles.length > 0 && creatorProfiles.length > 0) {
      // Prefer the profile with account_state ready, or brand as default
      const brandReady = brandProfiles[0].account_state === 'ready';
      const creatorReady = creatorProfiles[0].account_state === 'ready';
      senderType = creatorReady && !brandReady ? 'creator' : 'brand';
    }

    // Derive application_id for direct conversations if not provided
    const resolvedAppId = application_id || [user.id, recipient_id].sort().join('__direct__');

    // 5b. AUTHORIZATION CHECK for direct conversations
    if (!application_id) {
      // Direct conversation — user must be one of the two parties
      if (!resolvedAppId.includes(user.id)) {
        return err('Forbidden', 'FORBIDDEN', 403);
      }
    } else {
      // Application-based conversation — user must be sender or part of the application
      const apps = await base44.entities.Application.filter({ id: application_id });
      if (apps.length > 0) {
        const app = apps[0];
        // Verify user is the brand owner or the creator owner
        const [appBrands, appCreators] = await Promise.all([
          base44.entities.Brand.filter({ id: app.brand_id, user_id: user.id }),
          base44.entities.Creator.filter({ id: app.creator_id, user_id: user.id }),
        ]);
        if (appBrands.length === 0 && appCreators.length === 0) {
          return err('Forbidden', 'FORBIDDEN', 403);
        }
      }
    }

    // 6. CREATE MESSAGE — sender_id always from auth, never from payload
    const message = await base44.entities.Message.create({
      application_id: resolvedAppId,
      sender_id: user.id,
      sender_type: senderType,
      recipient_id,
      content: escapeHtml(content.trim()),
    });

    console.log(`[${FN}] Message sent from ${user.id} to ${recipient_id}`);
    return Response.json({ success: true, message });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});