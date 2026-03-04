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

async function batchFetchArray(entityApi, ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + BATCH_CHUNK_SIZE));
  }
  const results = await Promise.all(
    chunks.map(chunk => entityApi.filter({ id: { $in: chunk } }))
  );
  return results.flat();
}

/**
 * Paginated opportunities feed.
 * Each page fetches PAGE_SIZE campaigns + related brands + creator applications.
 * Shadow mode: filters out campaigns from hidden brand owners.
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
      const brandsMap = await batchFetch(base44.entities.Brand, brandIds);

      // 3) Shadow mode — fetch Users of brand owners to check visibility_status
      const brandUserIds = [...new Set(
        Object.values(brandsMap).map(b => b.user_id).filter(Boolean)
      )];
      const brandUsers = await batchFetchArray(base44.entities.User, brandUserIds);
      const hiddenUserIds = new Set(
        brandUsers.filter(u => u.visibility_status === 'hidden').map(u => u.id)
      );

      // Build set of hidden brand IDs (brands whose owner is hidden)
      const hiddenBrandIds = new Set();
      for (const [brandId, brand] of Object.entries(brandsMap)) {
        if (hiddenUserIds.has(brand.user_id)) {
          hiddenBrandIds.add(brandId);
        }
      }

      // Filter out hidden campaigns
      const visibleCampaigns = campaigns.filter(c => !hiddenBrandIds.has(c.brand_id));

      // 4) Batch fetch creator's applications for visible campaigns only
      const campaignIds = visibleCampaigns.map(c => c.id).filter(Boolean);

      const myApplications = creatorId && campaignIds.length > 0
        ? await base44.entities.Application.filter({
            creator_id: creatorId,
            campaign_id: { $in: campaignIds },
          })
        : [];

      return {
        campaigns: visibleCampaigns,
        brands: brandsMap,
        myApplications,
        nextOffset: pageParam + campaigns.length, // offset based on raw count (not filtered)
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