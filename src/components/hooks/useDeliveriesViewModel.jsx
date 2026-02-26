import { useState, useMemo, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deliverySchema, validate } from '../utils/validationSchemas';
import { validateTransition } from '../utils/stateTransitions';
import { useDeliveriesQuery, useApproveMutation, useContestMutation, useSubmitDeliveryMutation } from './useEntityQuery';
import { usePagination } from './usePagination';

export function useDeliveriesViewModel(profileType, profileId) {
  const queryClient = useQueryClient();

  // Data
  const { data, isLoading } = useDeliveriesQuery(profileType, profileId);
  const deliveries = data?.deliveries || [];
  const campaigns = data?.campaigns || {};
  const creators = data?.creators || {};
  const brands = data?.brands || {};

  // Mutations
  const approveMutation = useApproveMutation();
  const contestMutation = useContestMutation();
  const submitDeliveryMutation = useSubmitDeliveryMutation();
  const processing = approveMutation.isPending || contestMutation.isPending;
  const submitting = submitDeliveryMutation.isPending;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('submitted');
  const pagination = usePagination(20);

  // Dialog state
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [proofUrls, setProofUrls] = useState([]);
  const [contentUrls, setContentUrls] = useState(['']);
  const [proofNotes, setProofNotes] = useState('');

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Reset pagination on filter change
  useEffect(() => {
    pagination.reset();
  }, [searchTerm, filterStatus]);

  // Filtered + paginated (memoized)
  const filteredDeliveries = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return deliveries.filter(d => {
      const matchesSearch = !searchTerm || (
        profileType === 'brand'
          ? creators[d.creator_id]?.display_name?.toLowerCase().includes(lowerSearch) ||
            campaigns[d.campaign_id]?.title?.toLowerCase().includes(lowerSearch)
          : campaigns[d.campaign_id]?.title?.toLowerCase().includes(lowerSearch) ||
            brands[d.brand_id]?.company_name?.toLowerCase().includes(lowerSearch)
      );
      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [deliveries, searchTerm, filterStatus, profileType, campaigns, creators, brands]);

  const paginatedDeliveries = useMemo(
    () => pagination.paginate(filteredDeliveries),
    [filteredDeliveries, pagination.currentPage, pagination.pageSize]
  );
  const totalPages = pagination.totalPages(filteredDeliveries.length);

  // Brand actions
  const handleApprove = useCallback(async () => {
    if (!selectedDelivery) return;
    try {
      await approveMutation.mutateAsync({ deliveryId: selectedDelivery.id, profileType, profileId });
      toast.success('Entrega aprovada com sucesso!');
      setSelectedDelivery(null);
    } catch (error) {
      toast.error(error.message || 'Erro ao aprovar entrega.');
    }
  }, [selectedDelivery, profileType, profileId, approveMutation]);

  const handleContest = useCallback(async (reason) => {
    if (!selectedDelivery || !reason) {
      toast.error('Preencha o motivo da contestação');
      return;
    }
    const validation = validateTransition('delivery', { ...selectedDelivery, contest_reason: reason }, 'in_dispute');
    if (!validation.valid) {
      toast.error(validation.error || validation.errors?.[0]);
      return;
    }
    try {
      await contestMutation.mutateAsync({ deliveryId: selectedDelivery.id, reason, profileType, profileId });
      toast.success('Entrega contestada. Disputa aberta.');
      setSelectedDelivery(null);
    } catch (error) {
      toast.error(error.message || 'Erro ao contestar entrega.');
    }
  }, [selectedDelivery, profileType, profileId, contestMutation]);

  // Creator actions
  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProofUrls(prev => [...prev, file_url]);
    }
  }, []);

  const handleSubmitDelivery = useCallback(async () => {
    if (!selectedDelivery) return;
    const validContentUrls = contentUrls.filter(url => url.trim());
    const deliveryData = { proof_urls: proofUrls, content_urls: validContentUrls, proof_notes: proofNotes };
    const validation = validate(deliverySchema, deliveryData);
    if (!validation.success) { toast.error(Object.values(validation.errors)[0]); return; }
    const transitionValidation = validateTransition('delivery', selectedDelivery, 'submitted');
    if (!transitionValidation.valid) { toast.error(transitionValidation.error || transitionValidation.errors?.[0]); return; }
    try {
      await submitDeliveryMutation.mutateAsync({
        deliveryId: selectedDelivery.id,
        data: { ...deliveryData, on_time: selectedDelivery.deadline ? new Date() <= new Date(selectedDelivery.deadline) : true },
        profileType,
        profileId,
      });
      closeSubmitDialog();
    } catch (error) {
      console.error('Error submitting delivery:', error);
    }
  }, [selectedDelivery, contentUrls, proofUrls, proofNotes, profileType, profileId, submitDeliveryMutation]);

  const openSubmitDialog = useCallback((delivery) => {
    setSelectedDelivery(delivery);
    setProofUrls(delivery.proof_urls || []);
    setContentUrls(delivery.content_urls?.length ? delivery.content_urls : ['']);
    setProofNotes(delivery.proof_notes || '');
  }, []);

  const closeSubmitDialog = useCallback(() => {
    setSelectedDelivery(null);
    setProofUrls([]);
    setContentUrls(['']);
    setProofNotes('');
  }, []);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['deliveries', profileType, profileId] })
      .finally(() => setRefreshing(false));
  }, [refreshing, queryClient, profileType, profileId]);

  return {
    // Data
    isLoading,
    campaigns,
    creators,
    brands,
    filteredDeliveries,
    paginatedDeliveries,
    totalPages,
    // Filters
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    pagination,
    // Dialog
    selectedDelivery, setSelectedDelivery,
    proofUrls, setProofUrls,
    contentUrls, setContentUrls,
    proofNotes, setProofNotes,
    // Actions
    processing,
    submitting,
    refreshing,
    handleApprove,
    handleContest,
    handleFileUpload,
    handleSubmitDelivery,
    openSubmitDialog,
    closeSubmitDialog,
    handleRefresh,
  };
}