import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { usePagination } from './usePagination';
import {
  useApplicationsQuery,
  useAcceptApplicationMutation,
  useRejectApplicationMutation,
  useWithdrawApplicationMutation,
} from './useEntityQuery';

export function useApplicationsViewModel(profileType, profile) {
  const profileId = profile?.id;

  // Data fetching
  const { data, isLoading } = useApplicationsQuery(profileType, profileId);
  const applications = data?.applications || [];
  const campaigns = data?.campaigns || {};
  const creators = data?.creators || {};
  const brands = data?.brands || {};

  // Mutations
  const acceptMutation = useAcceptApplicationMutation();
  const rejectMutation = useRejectApplicationMutation();
  const withdrawMutation = useWithdrawApplicationMutation();
  const processing = acceptMutation.isPending || rejectMutation.isPending;

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterCampaign, setFilterCampaign] = useState('all');

  // Dialog state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [dialogMode, setDialogMode] = useState(null); // 'view' | 'decide'
  const [rejectionReason, setRejectionReason] = useState('');
  const [agreedRate, setAgreedRate] = useState('');

  // Pagination
  const pagination = usePagination(20);

  // Campaign list (memoized for filter dropdown)
  const campaignList = useMemo(() => Object.values(campaigns), [campaigns]);

  // Filtered applications (memoized)
  const filteredApplications = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return applications.filter(a => {
      const creator = creators[a.creator_id];
      const campaign = campaigns[a.campaign_id];
      const brand = brands[a.brand_id];

      const matchesSearch = !searchTerm || (
        profileType === 'brand'
          ? (creator?.display_name?.toLowerCase().includes(lowerSearch) ||
             campaign?.title?.toLowerCase().includes(lowerSearch))
          : (campaign?.title?.toLowerCase().includes(lowerSearch) ||
             brand?.company_name?.toLowerCase().includes(lowerSearch))
      );

      const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchesCampaign = filterCampaign === 'all' || a.campaign_id === filterCampaign;

      return matchesSearch && matchesStatus && (profileType === 'brand' ? matchesCampaign : true);
    });
  }, [applications, creators, campaigns, brands, searchTerm, filterStatus, filterCampaign, profileType]);

  // Paginated results (memoized)
  const paginatedApplications = useMemo(
    () => pagination.paginate(filteredApplications),
    [pagination.paginate, filteredApplications]
  );
  const totalPages = useMemo(
    () => pagination.totalPages(filteredApplications.length),
    [pagination.totalPages, filteredApplications.length]
  );

  // Reset pagination when filters change
  useEffect(() => {
    pagination.reset();
  }, [searchTerm, filterStatus, filterCampaign]);

  // Dialog handlers
  const openView = useCallback((application) => {
    setSelectedApplication(application);
    setDialogMode('view');
  }, []);

  const openDecision = useCallback((application) => {
    setSelectedApplication(application);
    setAgreedRate(application.proposed_rate?.toString() || '');
    setRejectionReason('');
    setDialogMode('decide');
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedApplication(null);
    setDialogMode(null);
    setAgreedRate('');
    setRejectionReason('');
  }, []);

  // Mutation handlers
  const handleAccept = useCallback(async () => {
    if (!selectedApplication) return;
    try {
      await acceptMutation.mutateAsync({
        applicationId: selectedApplication.id,
        agreedRate,
        profileType,
        profileId,
      });
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success('Match! Candidatura aceita com sucesso 🎉');
      closeDialog();
    } catch (error) {
      toast.error(error.message || 'Erro ao aceitar candidatura.');
    }
  }, [selectedApplication, agreedRate, profileType, profileId, acceptMutation, closeDialog]);

  const handleReject = useCallback(async () => {
    if (!selectedApplication) return;
    try {
      await rejectMutation.mutateAsync({
        applicationId: selectedApplication.id,
        rejectionReason,
        profileType,
        profileId,
      });
      closeDialog();
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  }, [selectedApplication, rejectionReason, profileType, profileId, rejectMutation, closeDialog]);

  const handleWithdraw = useCallback(async (applicationId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta candidatura?')) return;
    try {
      await withdrawMutation.mutateAsync({ applicationId, profileType, profileId });
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  }, [profileType, profileId, withdrawMutation]);

  return {
    // Data
    isLoading,
    campaigns,
    creators,
    brands,
    filteredApplications,
    paginatedApplications,
    campaignList,
    // Pagination
    pagination,
    totalPages,
    // Filters
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterCampaign, setFilterCampaign,
    // Dialog
    selectedApplication,
    dialogMode,
    rejectionReason, setRejectionReason,
    agreedRate, setAgreedRate,
    processing,
    // Handlers
    openView,
    openDecision,
    closeDialog,
    handleAccept,
    handleReject,
    handleWithdraw,
  };
}