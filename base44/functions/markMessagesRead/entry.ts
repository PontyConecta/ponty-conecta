import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { message_ids } = await req.json();
    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return Response.json({ error: 'message_ids required' }, { status: 400 });
    }
    if (message_ids.length > 100) {
      return Response.json({ error: 'Max 100 messages' }, { status: 400 });
    }
    const now = new Date().toISOString();
    let marked = 0;
    for (const id of message_ids) {
      const msgs = await base44.entities.Message.filter({ id });
      if (msgs.length > 0 && msgs[0].recipient_id === user.id && !msgs[0].read_at) {
        await base44.entities.Message.update(id, { read_at: now });
        marked++;
      }
    }
    return Response.json({ success: true, marked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});