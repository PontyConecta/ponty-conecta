import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ─── Template: Auth → Validate → Ownership → Execute → Respond ───

const FN = 'manageNotification';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

// Sanitize notification_data to prevent injection
function sanitizeNotificationData(nd) {
  if (!nd || typeof nd !== 'object') return null;
  return {
    type: typeof nd.type === 'string' ? nd.type.trim() : 'application',
    title: typeof nd.title === 'string' ? nd.title.trim().slice(0, 200) : '',
    message: typeof nd.message === 'string' ? nd.message.trim().slice(0, 500) : '',
    action_url: typeof nd.action_url === 'string' ? nd.action_url.trim().slice(0, 500) : '',
    related_entity_id: typeof nd.related_entity_id === 'string' ? nd.related_entity_id.trim() : '',
  };
}

async function upsertNotification(base44, userId, key, nData, field) {
  const now = new Date().toISOString();
  const existing = await base44.entities.Notification.filter({
    user_id: userId,
    notification_key: key,
  });

  if (existing.length > 0) {
    await base44.entities.Notification.update(existing[0].id, { [field]: now });
  } else if (nData) {
    const safe = sanitizeNotificationData(nData);
    if (safe) {
      await base44.entities.Notification.create({
        user_id: userId,
        notification_key: key,
        ...safe,
        [field]: now,
      });
    }
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    // ── 2. VALIDATE INPUT ──
    const { action, notification_key, notification_keys, notification_data } = await req.json();

    if (!action) return err('Missing action', 'MISSING_FIELDS');

    // ── ACTION: MARK READ ──
    if (action === 'mark_read') {
      if (!notification_key) return err('Missing notification_key', 'MISSING_FIELDS');

      // ── 3. OWNERSHIP (user_id forced to authenticated user) ──
      // ── 4. EXECUTE ──
      await upsertNotification(base44, user.id, notification_key, notification_data, 'read_at');
      return Response.json({ success: true });
    }

    // ── ACTION: MARK ALL READ ──
    if (action === 'mark_all_read') {
      if (!notification_keys || !Array.isArray(notification_keys)) {
        return err('Missing notification_keys array', 'MISSING_FIELDS');
      }

      const notificationsArr = Array.isArray(notification_data) ? notification_data : [];

      for (let i = 0; i < notification_keys.length; i++) {
        await upsertNotification(base44, user.id, notification_keys[i], notificationsArr[i], 'read_at');
      }

      console.log(`[${FN}] Marked ${notification_keys.length} notifications as read for user ${user.id}`);
      return Response.json({ success: true });
    }

    // ── ACTION: DISMISS ──
    if (action === 'dismiss') {
      if (!notification_key) return err('Missing notification_key', 'MISSING_FIELDS');
      await upsertNotification(base44, user.id, notification_key, notification_data, 'dismissed_at');
      return Response.json({ success: true });
    }

    return err('Invalid action', 'INVALID_ACTION');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});