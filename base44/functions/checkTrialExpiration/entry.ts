// FIX #10: Scheduled function to downgrade expired trials
// Run every 6 hours via scheduled automation
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BATCH_SIZE = 200;

async function fetchPaginated(entityApi, filter) {
  const all = [];
  let page = 0;
  while (true) {
    const batch = await entityApi.filter(filter, '-created_date', BATCH_SIZE, page * BATCH_SIZE);
    all.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    page++;
    if (page > 50) break;
  }
  return all;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const now = new Date();
    const results = { creators_downgraded: 0, already_ok: 0, errors: [] };

    // Find all premium creators with trial_end_date
    const premiumCreators = await fetchPaginated(
      base44.asServiceRole.entities.Creator,
      { subscription_status: 'premium' }
    );

    for (const creator of premiumCreators) {
      // Skip if no trial_end_date (paid subscriber, not trial)
      if (!creator.trial_end_date) continue;

      // Skip if they have a Stripe subscription (real paid user)
      if (creator.stripe_customer_id) {
        // Double check: verify active Stripe subscription exists
        // If stripe_customer_id exists, they're a real subscriber — skip
        continue;
      }

      const trialEnd = new Date(creator.trial_end_date);
      if (trialEnd < now) {
        // Trial expired — downgrade
        await base44.asServiceRole.entities.Creator.update(creator.id, {
          subscription_status: 'starter',
          plan_level: null,
        });

        // Also update Subscription record if exists
        const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: creator.user_id });
        for (const sub of subs) {
          if (sub.status === 'premium' && !sub.stripe_subscription_id) {
            await base44.asServiceRole.entities.Subscription.update(sub.id, {
              status: 'starter',
              end_date: now.toISOString().split('T')[0],
            });
          }
        }

        console.log(`[checkTrialExpiration] Downgraded creator ${creator.id} (trial ended ${creator.trial_end_date})`);
        results.creators_downgraded++;
      } else {
        results.already_ok++;
      }
    }

    console.log(`[checkTrialExpiration] Done: ${results.creators_downgraded} downgraded, ${results.already_ok} still active`);
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('[checkTrialExpiration] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});