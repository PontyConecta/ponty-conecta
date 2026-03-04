import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { arrayToMap } from '../utils/entityHelpers';

const QUERY_CONFIG = {
  staleTime: 30 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
};

const BATCH_CHUNK_SIZE = 100;
const RECENT_LIMIT = 10;

async function batchFetchByIds(entityApi, ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return {};
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + BATCH_CHUNK_SIZE));
  }
  const results = await Promise.all(
    chunks.map(chunk => entityApi.filter({ id: { $in: chunk } }))
  );
  return arrayToMap(results.flat());
}

/**
 * Count records matching a filter. Uses limit=0 trick: fetches 1 record just to
 * count, but since SDK doesn't support count(), we fetch small batches by status.
 * Returns { [status]: count }
 */
async function countByStatus(entityApi, baseFilter, statuses) {
  // Fetch all status counts in parallel — each limited to 500 (generous ceiling)
  const entries = await Promise.all(
    statuses.map(async (status) => {
      const items = await entityApi.filter({ ...baseFilter, status }, '-created_date', 500);
      return [status, items.length];
    })
  );
  return Object.fromEntries(entries);
}

// ─── CREATOR DASHBOARD (paginated) ───

export function useCreatorDashboardData(creatorId, userId) {
  return useQuery({
    queryKey: ['dashboard', 'creator', creatorId],
    queryFn: async () => {
      // 1) Counts by status (parallel) — no full array load
      const [appCounts, delCounts, reputationData, recentApps, recentDeliveries] = await Promise.all([
        countByStatus(base44.entities.Application, { creator_id: creatorId }, [
          'pending', 'accepted', 'rejected', 'withdrawn', 'completed'
        ]),
        countByStatus(base44.entities.Delivery, { creator_id: creatorId }, [
          'pending', 'submitted', 'approved', 'contested', 'in_dispute', 'resolved', 'closed'
        ]),
        base44.entities.Reputation.filter({ user_id: userId, profile_type: 'creator' }),
        // 2) Recent items for the lists (top 10)
        base44.entities.Application.filter({ creator_id: creatorId }, '-created_date', RECENT_LIMIT),
        base44.entities.Delivery.filter({ creator_id: creatorId }, '-created_date', RECENT_LIMIT),
      ]);

      // 3) Batch-fetch related campaigns + brands for recent items only
      const campaignIds = [...new Set([
        ...recentApps.map(a => a.campaign_id),
        ...recentDeliveries.map(d => d.campaign_id),
      ].filter(Boolean))];
      const brandIds = [...new Set(recentDeliveries.map(d => d.brand_id).filter(Boolean))];

      const [campaignsMap, brandsMap] = await Promise.all([
        batchFetchByIds(base44.entities.Campaign, campaignIds),
        batchFetchByIds(base44.entities.Brand, brandIds),
      ]);

      const reputation = reputationData.length > 0 ? reputationData[0] : null;

      // 4) Derive aggregated stats from counts
      const totalApps = Object.values(appCounts).reduce((a, b) => a + b, 0);
      const totalDeliveries = Object.values(delCounts).reduce((a, b) => a + b, 0);

      return {
        // Recent items (for lists, max 10)
        recentApplications: recentApps,
        recentDeliveries,
        // Maps for display
        campaignsMap,
        brandsMap,
        reputation,
        // Counts by status (for stats, charts)
        appCounts,
        delCounts,
        totalApps,
        totalDeliveries,
      };
    },
    enabled: !!creatorId && !!userId,
    ...QUERY_CONFIG,
  });
}

// ─── BRAND DASHBOARD (paginated) ───

export function useBrandDashboardData(brandId) {
  return useQuery({
    queryKey: ['dashboard', 'brand', brandId],
    queryFn: async () => {
      // 1) Counts + recent items in parallel
      const [
        campaignCounts,
        appCounts,
        delCounts,
        recentCampaigns,
        recentApps,
        recentDeliveries,
      ] = await Promise.all([
        countByStatus(base44.entities.Campaign, { brand_id: brandId }, [
          'draft', 'under_review', 'active', 'paused', 'applications_closed', 'completed', 'cancelled'
        ]),
        countByStatus(base44.entities.Application, { brand_id: brandId }, [
          'pending', 'accepted', 'rejected', 'withdrawn', 'completed'
        ]),
        countByStatus(base44.entities.Delivery, { brand_id: brandId }, [
          'pending', 'submitted', 'approved', 'contested', 'in_dispute', 'resolved', 'closed'
        ]),
        base44.entities.Campaign.filter({ brand_id: brandId }, '-created_date', RECENT_LIMIT),
        base44.entities.Application.filter({ brand_id: brandId }, '-created_date', RECENT_LIMIT),
        base44.entities.Delivery.filter({ brand_id: brandId }, '-created_date', RECENT_LIMIT),
      ]);

      // 2) Build campaigns map from recent campaigns for display
      const campaignsMap = arrayToMap(recentCampaigns);

      // Derive totals
      const totalCampaigns = Object.values(campaignCounts).reduce((a, b) => a + b, 0);
      const totalApps = Object.values(appCounts).reduce((a, b) => a + b, 0);
      const totalDeliveries = Object.values(delCounts).reduce((a, b) => a + b, 0);

      return {
        recentCampaigns,
        recentApplications: recentApps,
        recentDeliveries,
        campaignsMap,
        campaignCounts,
        appCounts,
        delCounts,
        totalCampaigns,
        totalApps,
        totalDeliveries,
      };
    },
    enabled: !!brandId,
    ...QUERY_CONFIG,
  });
}