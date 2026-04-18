import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// FIX #6: Rollback FeedbackResponse if User update fails + fix admin_id nomenclature

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check beta eligibility
    const fbStatus = user.feedback_status || 'none';
    if (!['eligible', 'invited', 'submitted'].includes(fbStatus)) {
      return Response.json({ error: 'User is not in the feedback beta program' }, { status: 403 });
    }

    const body = await req.json();
    const {
      channel, experience_rating, confusion_level, confusion_text,
      favorite_thing, favorite_thing_text, improvement_one_thing,
      recommend_ponty, recommend_to_yes
    } = body;

    // Validate required
    if (!experience_rating) {
      return Response.json({ error: 'experience_rating is required' }, { status: 400 });
    }

    const platform = body.platform || 'web';

    // Create FeedbackResponse
    const feedbackData = {
      user_id: String(user.id),
      source: 'in_app',
      channel: channel || 'modal',
      platform,
      experience_rating,
      confusion_level: confusion_level || 'none',
      status: 'new',
      priority: 'med',
      category: 'other',
      tags: [],
    };

    if (confusion_text) feedbackData.confusion_text = String(confusion_text).slice(0, 2000);
    if (favorite_thing) feedbackData.favorite_thing = favorite_thing;
    if (favorite_thing_text) feedbackData.favorite_thing_text = String(favorite_thing_text).slice(0, 500);
    if (improvement_one_thing) feedbackData.improvement_one_thing = String(improvement_one_thing).slice(0, 2000);
    if (recommend_ponty) feedbackData.recommend_ponty = recommend_ponty;
    if (recommend_to_yes) feedbackData.recommend_to_yes = String(recommend_to_yes).slice(0, 1000);
    if (user.beta_cohort_id) feedbackData.cohort_id = user.beta_cohort_id;

    const created = await base44.asServiceRole.entities.FeedbackResponse.create(feedbackData);

    // Update user status — rollback FeedbackResponse if this fails
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        feedback_status: 'submitted',
        feedback_submitted_at: new Date().toISOString(),
      });
    } catch (userUpdateError) {
      console.error('[submitBetaFeedback] User update failed, rolling back FeedbackResponse:', userUpdateError.message);
      try {
        await base44.asServiceRole.entities.FeedbackResponse.delete(created.id);
        console.log('[submitBetaFeedback] Rollback successful: deleted FeedbackResponse', created.id);
      } catch (rollbackErr) {
        console.error('[submitBetaFeedback] CRITICAL: Rollback also failed. FeedbackResponse', created.id, 'exists but user not marked as submitted.');
      }
      return Response.json({ error: 'Erro ao salvar feedback. Tente novamente.' }, { status: 500 });
    }

    // Audit log — FIX: use target_user_id instead of admin_id for non-admin action
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: 'system',
      admin_email: user.email,
      action: 'feedback_status_update',
      target_user_id: String(user.id),
      target_entity_id: String(created.id),
      details: `User submitted beta feedback (experience: ${experience_rating}, recommend: ${recommend_ponty || 'N/A'})`,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true, feedbackId: created.id });
  } catch (error) {
    console.error('[submitBetaFeedback] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});