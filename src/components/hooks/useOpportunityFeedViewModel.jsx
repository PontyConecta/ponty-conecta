import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { validateCreatorProfile } from '../utils/profileValidation';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useApplyToCampaignMutation } from './useEntityQuery';
import { useOpportunitiesPaginated } from './useOpportunitiesPaginated';

export function useOpportunityFeedViewModel(authProfile, profileType) {
  const queryClient = useQueryClient();
  const creator = authProfile;
  const creatorId = profileType === 'creator' ? authProfile?.id : null;
  const { isSubscribed } = useSubscription();
  const profileValidation = authProfile ? validateCreatorProfile(authProfile) : { isComplete: true, missingFields: [] };

  // Paginated data
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOpportunitiesPaginated(creatorId);

  // Flatten all pages into single arrays/maps with deduplication by campaign.id
  const { campaigns, brands, appliedCampaignIds } = useMemo(() => {
    if (!infiniteData?.pages) return { campaigns: [], brands: {}, appliedCampaignIds: new Set() };
    const seenIds = new Set();
    const allCampaigns = [];
    const allBrands = {};
    const allAppliedIds = new Set();
    for (const page of infiniteData.pages) {
      for (const campaign of page.campaigns) {
        if (!seenIds.has(campaign.id)) {
          seenIds.add(campaign.id);
          allCampaigns.push(campaign);
        }
      }
      Object.assign(allBrands, page.brands);
      for (const app of page.myApplications) {
        allAppliedIds.add(app.campaign_id);
      }
    }
    return { campaigns: allCampaigns, brands: allBrands, appliedCampaignIds: allAppliedIds };
  }, [infiniteData]);

  const applyMutation = useApplyToCampaignMutation();
  const applying = applyMutation.isPending;

  // Filters — on change, reset paginated cache so it re-fetches from offset 0
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRemuneration, setFilterRemuneration] = useState('all');

  // Note: filters are client-side only (search/platform/remuneration), so we don't
  // reset the infinite query on filter change. The auto-fetch effect below handles
  // loading more pages when client-side filters produce empty visible results.

  // Dialog state
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Filtered campaigns (memoized, client-side on loaded pages)
  // Featured campaigns are sorted first, then by recency within each group
  const filteredCampaigns = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = campaigns.filter(c => {
      const matchesSearch = !searchTerm ||
        c.title?.toLowerCase().includes(lowerSearch) ||
        c.description?.toLowerCase().includes(lowerSearch);
      const matchesPlatform = filterPlatform === 'all' || c.platforms?.includes(filterPlatform);
      const matchesRemuneration = filterRemuneration === 'all' || c.remuneration_type === filterRemuneration;
      return matchesSearch && matchesPlatform && matchesRemuneration;
    });
    // Sort: featured first, then by created_date descending within each group
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [campaigns, searchTerm, filterPlatform, filterRemuneration]);

  // Auto-fetch more pages when client-side filters produce empty results but server has more
  const autoFetchRef = useRef(false);
  useEffect(() => {
    if (
      !isLoading &&
      !isFetchingNextPage &&
      hasNextPage &&
      filteredCampaigns.length === 0 &&
      campaigns.length > 0 &&
      !autoFetchRef.current
    ) {
      autoFetchRef.current = true;
      fetchNextPage().finally(() => { autoFetchRef.current = false; });
    }
  }, [isLoading, isFetchingNextPage, hasNextPage, filteredCampaigns.length, campaigns.length, fetchNextPage]);

  // Applied check (memoized set)
  const hasApplied = useCallback((campaignId) => appliedCampaignIds.has(campaignId), [appliedCampaignIds]);

  // Dialog handlers
  const openCampaignDetails = useCallback((campaign) => {
    setSelectedCampaign(campaign);
    setViewingDetails(true);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedCampaign(null);
    setViewingDetails(false);
    setApplicationMessage('');
    setProposedRate('');
  }, []);

  const startApplication = useCallback(() => {
    if (!profileValidation.isComplete) {
      toast.error('Complete seu perfil antes de se candidatar', {
        description: 'Preencha os campos obrigatórios no seu perfil',
      });
      return;
    }
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    setViewingDetails(false);
  }, [profileValidation.isComplete, isSubscribed]);

  const handleApply = useCallback(async () => {
    if (!creator || !selectedCampaign) return;
    if (!profileValidation.isComplete) {
      toast.error('Complete seu perfil antes de se candidatar', {
        description: 'Preencha os campos obrigatórios no seu perfil',
      });
      return;
    }
    if (!isSubscribed) { setShowPaywall(true); return; }
    try {
      await applyMutation.mutateAsync({
        campaignId: selectedCampaign.id,
        message: applicationMessage,
        proposedRate,
        creatorId: creator?.id,
      });
      toast.success('Candidatura enviada com sucesso!');
      closeDialog();
    } catch (error) {
      toast.error(error.message || 'Erro ao candidatar-se. Tente novamente.');
    }
  }, [creator, selectedCampaign, profileValidation.isComplete, isSubscribed, applicationMessage, proposedRate, applyMutation, closeDialog]);

  // Load more (infinite scroll trigger)
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      return fetchNextPage();
    }
    return Promise.resolve();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['opportunities-paginated'] }).finally(() => setRefreshing(false));
  }, [refreshing, queryClient]);

  return {
    // Data
    isLoading,
    brands,
    filteredCampaigns,
    // Pagination
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    handleLoadMore,
    // State
    isSubscribed,
    profileValidation,
    // Filters
    searchTerm, setSearchTerm,
    filterPlatform, setFilterPlatform,
    filterRemuneration, setFilterRemuneration,
    // Dialog
    selectedCampaign,
    viewingDetails, setViewingDetails,
    applicationMessage, setApplicationMessage,
    proposedRate, setProposedRate,
    showPaywall, setShowPaywall,
    applying,
    // Handlers
    hasApplied,
    openCampaignDetails,
    closeDialog,
    startApplication,
    handleApply,
    // Refresh
    refreshing,
    handleRefresh,
  };
}