import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Service function: creates notifications for users
// Called from other backend functions via base44.functions.invoke('createNotification', {...})

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const { user_id, notification_key, type, title, message, action_url, related_entity_id } = await req.json();

    if (!user_id || !notification_key || !type || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dedup: skip if notification with same key already exists for this user
    const existing = await base44.asServiceRole.entities.Notification.filter({
      user_id,
      notification_key,
    });
    if (existing.length > 0) {
      return Response.json({ success: true, skipped: true });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id,
      notification_key,
      type: type.slice(0, 50),
      title: title.slice(0, 200),
      message: message.slice(0, 500),
      action_url: (action_url || '').slice(0, 500),
      related_entity_id: related_entity_id || '',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[createNotification] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});