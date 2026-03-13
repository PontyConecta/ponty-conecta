import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { arrayToMap } from '../utils/entityHelpers';

const PAGE_SIZE = 20;
const BATCH_CHUNK_SIZE = 100;

async function batchFetch(entityApi, ids) {
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
 * Paginated opportunities feed with shadow mode.
 * Each page: PAGE_SIZE campaigns + brands + users (shadow check) + applications.
 * Requests per page: campaigns(1) + brands(1) + users(1) + apps(1) = 4 max
 */
export function useOpportunitiesPaginated(creatorId) {
  return useInfiniteQuery({
    queryKey: ['opportunities-paginated', creatorId],
    queryFn: async ({ pageParam = 0 }) => {
      // 1) Fetch one page of active campaigns
      const campaigns = await base44.entities.Campaign.filter(
        { status: 'active' },
        '-created_date',
        PAGE_SIZE,
        pageParam
      );

      // 2) Batch fetch related brands
      const brandIds = [...new Set(campaigns.map(c => c.brand_id).filter(Boolean))];

      // 3) Batch fetch creator's applications for THESE campaigns only
      const campaignIds = campaigns.map(c => c.id).filter(Boolean);

      // Fetch brands first (needed for shadow mode user_id lookup)
      const [brands, myApplications] = await Promise.all([
        batchFetch(base44.entities.Brand, brandIds),
        creatorId && campaignIds.length > 0
          ? base44.entities.Application.filter({
              creator_id: creatorId,
              campaign_id: { $in: campaignIds },
            })
          : Promise.resolve([]),
      ]);

      // 4) Filter out campaigns from hidden brands (using brand.is_hidden)
      const hiddenBrandIds = new Set();
      for (const brand of Object.values(brands)) {
        if (brand.is_hidden) {
          hiddenBrandIds.add(brand.id);
        }
      }

      const visibleCampaigns = hiddenBrandIds.size > 0
        ? campaigns.filter(c => !hiddenBrandIds.has(c.brand_id))
        : campaigns;

      return {
        campaigns: visibleCampaigns,
        brands,
        myApplications,
        hiddenCount: campaigns.length - visibleCampaigns.length,
        // Offset advances by raw count (including hidden) to keep server pagination stable
        nextOffset: pageParam + campaigns.length,
        hasMore: campaigns.length === PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    enabled: true,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}