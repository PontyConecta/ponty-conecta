import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #7: Idempotent — skip users already invited (feedback_invited_at set)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userIds, feedback_tags } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: 'userIds array is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userId of userIds) {
      try {
        // FIX: Check if already invited before updating
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length === 0) {
          console.warn(`[adminBulkFeedbackInvite] User ${userId} not found, skipping`);
          skippedCount++;
          continue;
        }

        const targetUser = users[0];
        if (targetUser.feedback_invited_at) {
          // Already invited — skip to avoid duplicates
          console.log(`[adminBulkFeedbackInvite] User ${userId} already invited at ${targetUser.feedback_invited_at}, skipping`);
          skippedCount++;
          continue;
        }

        const updateData = {
          feedback_status: 'invited',
          feedback_invited_at: now,
        };
        if (feedback_tags && feedback_tags.length > 0) {
          updateData.feedback_tags = feedback_tags;
        }
        await base44.asServiceRole.entities.User.update(userId, updateData);
        successCount++;
      } catch (err) {
        console.error(`[adminBulkFeedbackInvite] Error updating user ${userId}:`, err.message);
        errorCount++;
      }
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'feedback_beta_changed',
      details: `Bulk feedback invite: ${successCount} invited, ${skippedCount} skipped (already invited or not found), ${errorCount} errors. Total: ${userIds.length}`,
      note: feedback_tags?.length ? `Tags: ${feedback_tags.join(', ')}` : '',
      timestamp: now,
    });

    console.log(`[adminBulkFeedbackInvite] ${successCount} users invited, ${skippedCount} skipped by ${admin.email}`);

    return Response.json({ success: true, invited: successCount, skipped: skippedCount, errors: errorCount });
  } catch (error) {
    console.error('[adminBulkFeedbackInvite] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});