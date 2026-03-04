import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Internal event emitter — called by other backend functions ───
// Append-only: EventLog records are never updated or deleted.

const FN = 'emitEvent';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const {
      event_type,
      actor_user_id,
      actor_role,
      resource_type,
      resource_id,
      metadata,
      idempotency_key,
    } = await req.json();

    // Validate required fields
    if (!event_type || !actor_user_id || !actor_role || !resource_type || !resource_id) {
      return Response.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    // Idempotency check — skip if duplicate
    if (idempotency_key) {
      const existing = await base44.asServiceRole.entities.EventLog.filter({ idempotency_key });
      if (existing.length > 0) {
        console.log(`[${FN}] Duplicate event skipped: ${idempotency_key}`);
        return Response.json({ success: true, duplicate: true });
      }
    }

    // Create event (append-only)
    const eventRecord = await base44.asServiceRole.entities.EventLog.create({
      event_type,
      actor_user_id,
      actor_role,
      resource_type,
      resource_id,
      metadata: metadata || {},
      idempotency_key: idempotency_key || `${event_type}_${resource_id}_${Date.now()}`,
    });

    console.log(`[${FN}] Event emitted: ${event_type} | resource=${resource_type}:${resource_id} | actor=${actor_role}:${actor_user_id}`);
    return Response.json({ success: true, event_id: eventRecord.id });
  } catch (error) {
    // Fire-and-forget pattern: log but don't crash the caller
    console.error(`[${FN}] Error:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});