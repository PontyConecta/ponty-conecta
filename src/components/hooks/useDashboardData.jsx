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

// ─── CREATOR DASHBOARD ───

export function useCreatorDashboardData(creatorId, userId) {
  return useQuery({
    queryKey: ['dashboard', 'creator', creatorId],
    queryFn: async () => {
      // 1) Stats from backend (1 request) + recent items + reputation in parallel
      const [statsRes, reputationData, recentApps, recentDeliveries] = await Promise.all([
        base44.functions.invoke('creatorDashboardStats', { creatorId, range: 'all' }),
        base44.entities.Reputation.filter({ user_id: userId, profile_type: 'creator' }),
        base44.entities.Application.filter({ creator_id: creatorId }, '-created_date', RECENT_LIMIT),
        base44.entities.Delivery.filter({ creator_id: creatorId }, '-created_date', RECENT_LIMIT),
      ]);

      const stats = statsRes.data;

      // 2) Batch-fetch related campaigns + brands for recent items only
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

      return {
        recentApplications: recentApps,
        recentDeliveries,
        campaignsMap,
        brandsMap,
        reputation,
        // From backend stats
        appCounts: stats.appCounts || {},
        delCounts: stats.delCounts || {},
        totalApps: stats.totalApps || 0,
        totalDeliveries: stats.totalDeliveries || 0,
        onTimeRate: stats.onTimeRate ?? 100,
        appsByMonth: stats.appsByMonth || [],
        deliveriesByMonth: stats.deliveriesByMonth || [],
      };
    },
    enabled: !!creatorId && !!userId,
    ...QUERY_CONFIG,
  });
}

// ─── BRAND DASHBOARD ───

export function useBrandDashboardData(brandId) {
  return useQuery({
    queryKey: ['dashboard', 'brand', brandId],
    queryFn: async () => {
      // 1) Stats from backend (1 request) + recent items in parallel
      const [statsRes, recentCampaigns, recentApps, recentDeliveries] = await Promise.all([
        base44.functions.invoke('brandDashboardStats', { brandId, range: 'all' }),
        base44.entities.Campaign.filter({ brand_id: brandId }, '-created_date', 200),
        base44.entities.Application.filter({ brand_id: brandId, status: 'pending' }, '-created_date', 100),
        base44.entities.Delivery.filter({ brand_id: brandId }, '-created_date', RECENT_LIMIT),
      ]);

      const stats = statsRes.data;

      // Build campaigns map from recent campaigns for display
      const campaignsMap = arrayToMap(recentCampaigns);

      return {
        recentCampaigns,
        recentApplications: recentApps,
        recentDeliveries,
        campaignsMap,
        // From backend stats
        campaignCounts: stats.campaignCounts || {},
        appCounts: stats.appCounts || {},
        delCounts: stats.delCounts || {},
        totalCampaigns: stats.totalCampaigns || 0,
        totalApps: stats.totalApps || 0,
        totalDeliveries: stats.totalDeliveries || 0,
        campaignsByMonth: stats.campaignsByMonth || [],
      };
    },
    enabled: !!brandId,
    ...QUERY_CONFIG,
  });
}