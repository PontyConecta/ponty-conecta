import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Template: Auth → Validate → Throttle → Execute → Respond ───

const FN = 'trackActivity';
const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── 1. AUTH ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);

    const now = new Date().toISOString();
    const nowMs = Date.now();

    // ── 2. THROTTLE CHECK ──
    // If last_active is within 24h, skip the write
    if (user.last_active) {
      const lastMs = new Date(user.last_active).getTime();
      if (nowMs - lastMs < THROTTLE_MS) {
        return Response.json({
          did_update: false,
          first_active: user.first_active || null,
          last_active: user.last_active
        });
      }
    }

    // ── 3. BUILD UPDATE (whitelist: only first_active + last_active) ──
    const updateData = { last_active: now };

    // Set first_active only if it doesn't exist yet
    if (!user.first_active) {
      updateData.first_active = now;
    }

    // ── 4. EXECUTE ──
    await base44.auth.updateMe(updateData);

    console.log(`[${FN}] Updated activity for user ${user.id} | first_active=${!user.first_active ? 'SET' : 'kept'}`);

    return Response.json({
      did_update: true,
      first_active: updateData.first_active || user.first_active,
      last_active: now
    });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});