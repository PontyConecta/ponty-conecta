import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { arrayToMap } from '../utils/entityHelpers';

// Shared query config
const QUERY_CONFIG = {
  staleTime: 30 * 1000,       // 30s
  gcTime: 10 * 60 * 1000,     // 10min
  refetchOnWindowFocus: false,
  retry: 1,
};

// Fetch related entities by IDs (deduped, parallel)
async function fetchRelatedByIds(entityApi, ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return {};
  const results = await Promise.all(uniqueIds.map(id => entityApi.filter({ id })));
  return arrayToMap(results.flat());
}

// ─── DELIVERIES ───

export function useDeliveriesQuery(profileType, profileId) {
  return useQuery({
    queryKey: ['deliveries', profileType, profileId],
    queryFn: async () => {
      const filterKey = profileType === 'brand' ? 'brand_id' : 'creator_id';
      const deliveries = await base44.entities.Delivery.filter({ [filterKey]: profileId }, '-created_date');

      const campaignIds = [...new Set(deliveries.map(d => d.campaign_id))];
      const creatorIds = profileType === 'brand' ? [...new Set(deliveries.map(d => d.creator_id))] : [];
      const brandIds = profileType !== 'brand' ? [...new Set(deliveries.map(d => d.brand_id))] : [];

      const [campaigns, creators, brands] = await Promise.all([
        fetchRelatedByIds(base44.entities.Campaign, campaignIds),
        creatorIds.length > 0 ? fetchRelatedByIds(base44.entities.Creator, creatorIds) : {},
        brandIds.length > 0 ? fetchRelatedByIds(base44.entities.Brand, brandIds) : {},
      ]);

      // For brand, also fetch campaigns filtered by brand_id (includes those without deliveries yet)
      let allCampaigns = campaigns;
      if (profileType === 'brand') {
        const brandCampaigns = await base44.entities.Campaign.filter({ brand_id: profileId });
        allCampaigns = arrayToMap(brandCampaigns);
      }

      return { deliveries, campaigns: allCampaigns, creators, brands };
    },
    enabled: !!profileId && !!profileType,
    ...QUERY_CONFIG,
  });
}

// ─── APPLICATIONS ───

export function useApplicationsQuery(profileType, profileId) {
  return useQuery({
    queryKey: ['applications', profileType, profileId],
    queryFn: async () => {
      const filterKey = profileType === 'brand' ? 'brand_id' : 'creator_id';
      const applications = await base44.entities.Application.filter({ [filterKey]: profileId }, '-created_date');

      const creatorIds = profileType === 'brand' ? [...new Set(applications.map(a => a.creator_id))] : [];
      const campaignIds = [...new Set(applications.map(a => a.campaign_id))];
      const brandIds = profileType !== 'brand' ? [...new Set(applications.map(a => a.brand_id))] : [];

      const [creators, brands] = await Promise.all([
        creatorIds.length > 0 ? fetchRelatedByIds(base44.entities.Creator, creatorIds) : {},
        brandIds.length > 0 ? fetchRelatedByIds(base44.entities.Brand, brandIds) : {},
      ]);

      // For brand, include all brand campaigns for filter dropdown
      let campaigns;
      if (profileType === 'brand') {
        const brandCampaigns = await base44.entities.Campaign.filter({ brand_id: profileId });
        campaigns = arrayToMap(brandCampaigns);
      } else {
        campaigns = await fetchRelatedByIds(base44.entities.Campaign, campaignIds);
      }

      return { applications, campaigns, creators, brands };
    },
    enabled: !!profileId && !!profileType,
    ...QUERY_CONFIG,
  });
}

// ─── OPPORTUNITIES ───

export function useOpportunitiesQuery(creatorId) {
  return useQuery({
    queryKey: ['opportunities', creatorId],
    queryFn: async () => {
      const [myApplications, campaigns] = await Promise.all([
        base44.entities.Application.filter({ creator_id: creatorId }),
        base44.entities.Campaign.filter({ status: 'active' }, '-created_date'),
      ]);

      const brandIds = [...new Set(campaigns.map(c => c.brand_id))];
      const brands = await fetchRelatedByIds(base44.entities.Brand, brandIds);

      return { myApplications, campaigns, brands };
    },
    enabled: !!creatorId,
    ...QUERY_CONFIG,
  });
}

// ─── MUTATIONS ───

export function useApproveMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deliveryId) => {
      const response = await base44.functions.invoke('approveDelivery', { delivery_id: deliveryId });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao aprovar entrega');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useContestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deliveryId, reason }) => {
      const response = await base44.functions.invoke('contestDelivery', { delivery_id: deliveryId, reason });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao contestar entrega');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

export function useAcceptApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, agreedRate }) => {
      const response = await base44.functions.invoke('acceptApplication', {
        application_id: applicationId,
        agreed_rate: agreedRate ? parseFloat(agreedRate) : null,
      });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao aceitar candidatura');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

export function useRejectApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, rejectionReason }) => {
      await base44.entities.Application.update(applicationId, {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useWithdrawApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId) => {
      await base44.entities.Application.update(applicationId, { status: 'withdrawn' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useApplyToCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, message, proposedRate }) => {
      const response = await base44.functions.invoke('applyToCampaign', {
        campaign_id: campaignId,
        message,
        proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
      });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao candidatar-se');
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useSubmitDeliveryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deliveryId, data }) => {
      await base44.entities.Delivery.update(deliveryId, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        ...data,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}