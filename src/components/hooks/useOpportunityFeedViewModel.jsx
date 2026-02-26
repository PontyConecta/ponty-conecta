import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { validateCreatorProfile } from '../utils/profileValidation';
import { isProfileSubscribed } from '../utils/subscriptionUtils';
import { useOpportunitiesQuery, useApplyToCampaignMutation } from './useEntityQuery';

export function useOpportunityFeedViewModel(authProfile, profileType) {
  const queryClient = useQueryClient();
  const creator = authProfile;
  const isSubscribed = authProfile ? isProfileSubscribed(authProfile) : false;
  const profileValidation = authProfile ? validateCreatorProfile(authProfile) : { isComplete: true, missingFields: [] };

  // Data
  const { data, isLoading } = useOpportunitiesQuery(profileType === 'creator' ? authProfile?.id : null);
  const campaigns = data?.campaigns || [];
  const brands = data?.brands || {};
  const myApplications = data?.myApplications || [];

  const applyMutation = useApplyToCampaignMutation();
  const applying = applyMutation.isPending;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRemuneration, setFilterRemuneration] = useState('all');

  // Dialog state
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Filtered campaigns (memoized)
  const filteredCampaigns = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return campaigns.filter(c => {
      const matchesSearch = !searchTerm ||
        c.title?.toLowerCase().includes(lowerSearch) ||
        c.description?.toLowerCase().includes(lowerSearch);
      const matchesPlatform = filterPlatform === 'all' || c.platforms?.includes(filterPlatform);
      const matchesRemuneration = filterRemuneration === 'all' || c.remuneration_type === filterRemuneration;
      return matchesSearch && matchesPlatform && matchesRemuneration;
    });
  }, [campaigns, searchTerm, filterPlatform, filterRemuneration]);

  // Applied check (memoized set)
  const appliedCampaignIds = useMemo(
    () => new Set(myApplications.map(a => a.campaign_id)),
    [myApplications]
  );
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

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['opportunities'] }).finally(() => setRefreshing(false));
  }, [refreshing, queryClient]);

  return {
    // Data
    isLoading,
    brands,
    filteredCampaigns,
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