import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Admin Metrics API — Read-only queries for admin dashboard ───

const FN = 'adminMetrics';

function err(msg, code, status = 400) {
  return Response.json({ error: msg, code }, { status });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // ── AUTH (admin-only) ──
    const user = await base44.auth.me();
    if (!user) return err('Unauthorized', 'UNAUTHORIZED', 401);
    if (user.role !== 'admin') return err('Forbidden', 'FORBIDDEN', 403);

    const { query_type, days, threshold_hours } = await req.json();

    const sr = base44.asServiceRole;
    const now = new Date();

    // ── METRIC CARDS (last N days) ──
    if (query_type === 'metric_cards') {
      const periodDays = days || 7;
      const since = new Date(now);
      since.setDate(since.getDate() - periodDays);
      const sinceStr = since.toISOString();

      // Fetch events for the period
      const events = await sr.entities.EventLog.filter({
        created_date: { $gte: sinceStr }
      });

      // Count by event_type
      const counts = {};
      for (const ev of events) {
        counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
      }

      // Average times
      const approvedApps = events.filter(e => e.event_type === 'application_approved');
      const createdApps = events.filter(e => e.event_type === 'application_created');
      const approvedDeliveries = events.filter(e => e.event_type === 'delivery_approved');
      const submittedDeliveries = events.filter(e => e.event_type === 'delivery_submitted');

      // Compute avg time: application_created → application_approved
      let avgAppApprovalHours = null;
      if (approvedApps.length > 0) {
        const durations = [];
        for (const approved of approvedApps) {
          const appId = approved.metadata?.campaign_id; // match by app resource_id
          const created = createdApps.find(c => c.resource_id === approved.resource_id);
          if (created) {
            const diff = new Date(approved.created_date) - new Date(created.created_date);
            durations.push(diff / (1000 * 60 * 60)); // hours
          }
        }
        if (durations.length > 0) {
          avgAppApprovalHours = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
        }
      }

      // Compute avg time: delivery_submitted → delivery_approved
      let avgDeliveryApprovalHours = null;
      if (approvedDeliveries.length > 0) {
        const durations = [];
        for (const approved of approvedDeliveries) {
          const submitted = submittedDeliveries.find(s => s.resource_id === approved.resource_id);
          if (submitted) {
            const diff = new Date(approved.created_date) - new Date(submitted.created_date);
            durations.push(diff / (1000 * 60 * 60));
          }
        }
        if (durations.length > 0) {
          avgDeliveryApprovalHours = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10;
        }
      }

      return Response.json({
        period_days: periodDays,
        new_creators: (counts.profile_selected || 0), // refined by role in frontend if needed
        new_brands: (counts.profile_selected || 0),
        onboarding_completed: counts.onboarding_completed || 0,
        campaigns_created: counts.campaign_created || 0,
        campaigns_activated: counts.campaign_activated || 0,
        applications_created: counts.application_created || 0,
        applications_approved: counts.application_approved || 0,
        applications_rejected: counts.application_rejected || 0,
        deliveries_submitted: counts.delivery_submitted || 0,
        deliveries_approved: counts.delivery_approved || 0,
        deliveries_contested: counts.delivery_contested || 0,
        disputes_created: counts.dispute_created || 0,
        disputes_resolved: counts.dispute_resolved || 0,
        subscriptions_updated: counts.subscription_updated || 0,
        avg_app_approval_hours: avgAppApprovalHours,
        avg_delivery_approval_hours: avgDeliveryApprovalHours,
        total_events: events.length,
      });
    }

    // ── FUNNEL SNAPSHOT ──
    if (query_type === 'funnel') {
      const period = days === 7 ? 'last_7_days' : days === 90 ? 'last_90_days' : 'last_30_days';
      const snapshots = await sr.entities.FunnelSnapshot.filter({ period }, '-snapshot_date', 1);

      if (snapshots.length === 0) {
        return Response.json({ funnel: null, message: 'No funnel snapshot available yet. Run aggregateMetrics first.' });
      }

      return Response.json({ funnel: snapshots[0] });
    }

    // ── DAILY TREND (MetricDaily) ──
    if (query_type === 'trend') {
      const periodDays = days || 30;
      const since = new Date(now);
      since.setDate(since.getDate() - periodDays);
      const sinceStr = since.toISOString().split('T')[0];

      const metrics = await sr.entities.MetricDaily.filter({
        date: { $gte: sinceStr }
      }, 'date');

      return Response.json({ metrics });
    }

    // ── OPERATIONAL LISTS ──
    if (query_type === 'stale_applications') {
      const hours = threshold_hours || 48;
      const cutoff = new Date(now - hours * 60 * 60 * 1000).toISOString();
      const pending = await sr.entities.Application.filter({
        status: 'pending',
        created_date: { $lte: cutoff }
      }, '-created_date', 50);
      return Response.json({ stale_applications: pending, threshold_hours: hours });
    }

    if (query_type === 'stale_deliveries') {
      const hours = threshold_hours || 72;
      const cutoff = new Date(now - hours * 60 * 60 * 1000).toISOString();
      const submitted = await sr.entities.Delivery.filter({
        status: 'submitted',
        submitted_at: { $lte: cutoff }
      }, '-submitted_at', 50);
      return Response.json({ stale_deliveries: submitted, threshold_hours: hours });
    }

    if (query_type === 'campaigns_no_applications') {
      const campaigns = await sr.entities.Campaign.filter({ status: 'active' });
      const noApps = campaigns.filter(c => !c.total_applications || c.total_applications === 0);
      return Response.json({ campaigns_no_applications: noApps });
    }

    if (query_type === 'open_disputes') {
      const disputes = await sr.entities.Dispute.filter({ status: 'open' }, '-created_date', 50);
      const underReview = await sr.entities.Dispute.filter({ status: 'under_review' }, '-created_date', 50);
      return Response.json({ open_disputes: [...disputes, ...underReview] });
    }

    if (query_type === 'incomplete_onboarding') {
      const creators = await sr.entities.Creator.filter({ account_state: 'incomplete' }, '-created_date', 50);
      const brands = await sr.entities.Brand.filter({ account_state: 'incomplete' }, '-created_date', 50);
      return Response.json({ incomplete_creators: creators, incomplete_brands: brands });
    }

    return err('Invalid query_type', 'INVALID_QUERY');
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return err(error.message, 'INTERNAL_ERROR', 500);
  }
});