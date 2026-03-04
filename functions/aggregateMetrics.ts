import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Scheduled Job: Aggregate EventLog → MetricDaily + FunnelSnapshot ───
// Runs daily. Idempotent: uses date+metric_key as natural key.

const FN = 'aggregateMetrics';

// Event types to aggregate
const EVENT_METRIC_MAP = {
  'profile_selected': { creator: 'new_creators', brand: 'new_brands' },
  'onboarding_completed': { _all: 'onboarding_completed', creator: 'creator_onboarding_completed', brand: 'brand_onboarding_completed' },
  'campaign_created': { _all: 'campaigns_created' },
  'campaign_activated': { _all: 'campaigns_activated' },
  'application_created': { _all: 'applications_created' },
  'application_approved': { _all: 'applications_approved' },
  'application_rejected': { _all: 'applications_rejected' },
  'delivery_submitted': { _all: 'deliveries_submitted' },
  'delivery_approved': { _all: 'deliveries_approved' },
  'delivery_contested': { _all: 'deliveries_revision_requested' },
  'dispute_created': { _all: 'disputes_created' },
  'dispute_resolved': { _all: 'disputes_resolved' },
  'subscription_updated': { _all: 'subscriptions_updated' },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Admin-only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { target_date } = await req.json().catch(() => ({}));

    // Default to yesterday
    const date = target_date || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();

    console.log(`[${FN}] Aggregating metrics for date: ${date}`);

    // Fetch all events for the target date
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const allEvents = await base44.asServiceRole.entities.EventLog.filter({
      created_date: { $gte: dayStart, $lte: dayEnd }
    });

    console.log(`[${FN}] Found ${allEvents.length} events for ${date}`);

    // Count events by type and role
    const counts = {};
    for (const event of allEvents) {
      const mapping = EVENT_METRIC_MAP[event.event_type];
      if (!mapping) continue;

      // _all dimension
      if (mapping._all) {
        counts[mapping._all] = (counts[mapping._all] || 0) + 1;
      }

      // Role-specific dimension
      if (event.actor_role && mapping[event.actor_role]) {
        counts[mapping[event.actor_role]] = (counts[mapping[event.actor_role]] || 0) + 1;
      }
    }

    console.log(`[${FN}] Aggregated counts:`, JSON.stringify(counts));

    // Upsert MetricDaily records
    for (const [metricKey, metricValue] of Object.entries(counts)) {
      // Check if already exists (idempotent)
      const existing = await base44.asServiceRole.entities.MetricDaily.filter({
        date,
        metric_key: metricKey,
      });

      if (existing.length > 0) {
        await base44.asServiceRole.entities.MetricDaily.update(existing[0].id, { metric_value: metricValue });
        console.log(`[${FN}] Updated: ${metricKey} = ${metricValue}`);
      } else {
        await base44.asServiceRole.entities.MetricDaily.create({
          date,
          metric_key: metricKey,
          metric_value: metricValue,
          dimension_role: 'all',
        });
        console.log(`[${FN}] Created: ${metricKey} = ${metricValue}`);
      }
    }

    // ── Build Funnel Snapshots ──
    const periods = [
      { key: 'last_7_days', days: 7 },
      { key: 'last_30_days', days: 30 },
      { key: 'last_90_days', days: 90 },
    ];

    for (const { key, days } of periods) {
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - days);
      const periodStartStr = periodStart.toISOString();

      const periodEvents = await base44.asServiceRole.entities.EventLog.filter({
        created_date: { $gte: periodStartStr }
      });

      const funnel = {
        period: key,
        snapshot_date: date,
        creator_signup: 0,
        creator_onboarding_completed: 0,
        creators_applied: 0,
        creators_approved: 0,
        deliveries_submitted: 0,
        deliveries_approved: 0,
        brand_signup: 0,
        brand_onboarding_completed: 0,
        campaigns_created: 0,
        campaigns_activated: 0,
        disputes_created: 0,
        disputes_resolved: 0,
      };

      for (const ev of periodEvents) {
        switch (ev.event_type) {
          case 'profile_selected':
            if (ev.actor_role === 'creator') funnel.creator_signup++;
            if (ev.actor_role === 'brand') funnel.brand_signup++;
            break;
          case 'onboarding_completed':
            if (ev.actor_role === 'creator') funnel.creator_onboarding_completed++;
            if (ev.actor_role === 'brand') funnel.brand_onboarding_completed++;
            break;
          case 'application_created': funnel.creators_applied++; break;
          case 'application_approved': funnel.creators_approved++; break;
          case 'delivery_submitted': funnel.deliveries_submitted++; break;
          case 'delivery_approved': funnel.deliveries_approved++; break;
          case 'campaign_created': funnel.campaigns_created++; break;
          case 'campaign_activated': funnel.campaigns_activated++; break;
          case 'dispute_created': funnel.disputes_created++; break;
          case 'dispute_resolved': funnel.disputes_resolved++; break;
        }
      }

      // Upsert funnel snapshot
      const existingSnap = await base44.asServiceRole.entities.FunnelSnapshot.filter({
        period: key,
        snapshot_date: date,
      });

      if (existingSnap.length > 0) {
        await base44.asServiceRole.entities.FunnelSnapshot.update(existingSnap[0].id, funnel);
      } else {
        await base44.asServiceRole.entities.FunnelSnapshot.create(funnel);
      }

      console.log(`[${FN}] Funnel snapshot ${key}: creators ${funnel.creator_signup}→${funnel.creator_onboarding_completed}→${funnel.creators_applied}→${funnel.creators_approved}`);
    }

    return Response.json({ success: true, date, metrics_count: Object.keys(counts).length });
  } catch (error) {
    console.error(`[${FN}] Error:`, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});