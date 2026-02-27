import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notification_key, notification_keys, notification_data } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    if (action === 'mark_read') {
      if (!notification_key) {
        return Response.json({ error: 'Missing notification_key' }, { status: 400 });
      }

      const existing = await base44.entities.Notification.filter({
        user_id: user.id,
        notification_key,
      });

      if (existing.length > 0) {
        await base44.entities.Notification.update(existing[0].id, {
          read_at: new Date().toISOString(),
        });
      } else if (notification_data) {
        await base44.entities.Notification.create({
          user_id: user.id,
          notification_key,
          type: notification_data.type || 'application',
          title: notification_data.title || '',
          message: notification_data.message || '',
          action_url: notification_data.action_url || '',
          related_entity_id: notification_data.related_entity_id || '',
          read_at: new Date().toISOString(),
        });
      }

      return Response.json({ success: true });
    }

    if (action === 'mark_all_read') {
      if (!notification_keys || !Array.isArray(notification_keys)) {
        return Response.json({ error: 'Missing notification_keys array' }, { status: 400 });
      }

      const notificationsArr = notification_data || [];

      for (let i = 0; i < notification_keys.length; i++) {
        const key = notification_keys[i];
        const nData = notificationsArr[i] || {};

        const existing = await base44.entities.Notification.filter({
          user_id: user.id,
          notification_key: key,
        });

        if (existing.length > 0) {
          await base44.entities.Notification.update(existing[0].id, {
            read_at: new Date().toISOString(),
          });
        } else {
          await base44.entities.Notification.create({
            user_id: user.id,
            notification_key: key,
            type: nData.type || 'application',
            title: nData.title || '',
            message: nData.message || '',
            action_url: nData.action_url || '',
            related_entity_id: nData.related_entity_id || '',
            read_at: new Date().toISOString(),
          });
        }
      }

      return Response.json({ success: true });
    }

    if (action === 'dismiss') {
      if (!notification_key) {
        return Response.json({ error: 'Missing notification_key' }, { status: 400 });
      }

      const existing = await base44.entities.Notification.filter({
        user_id: user.id,
        notification_key,
      });

      if (existing.length > 0) {
        await base44.entities.Notification.update(existing[0].id, {
          dismissed_at: new Date().toISOString(),
        });
      } else if (notification_data) {
        await base44.entities.Notification.create({
          user_id: user.id,
          notification_key,
          type: notification_data.type || 'application',
          title: notification_data.title || '',
          message: notification_data.message || '',
          action_url: notification_data.action_url || '',
          related_entity_id: notification_data.related_entity_id || '',
          dismissed_at: new Date().toISOString(),
        });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[manageNotification] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});