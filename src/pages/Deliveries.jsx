import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  FileCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Flag,
  Building2,
  Upload,
  Send,
  Link as LinkIcon,
  Plus,
  X as XIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { deliverySchema, validate } from '../components/utils/validationSchemas';
import { validateTransition } from '../components/utils/stateTransitions';
import { toast } from 'sonner';
import { formatDate } from '../components/utils/formatters';
import { arrayToMap } from '../components/utils/entityHelpers';
import { usePagination } from '../components/hooks/usePagination';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchFilter from '../components/common/SearchFilter';
import Pagination from '../components/common/Pagination';

export default function Deliveries() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [creators, setCreators] = useState({});
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [contestReason, setContestReason] = useState('');
  
  // Creator submission state
  const [proofUrls, setProofUrls] = useState([]);
  const [contentUrls, setContentUrls] = useState(['']);
  const [proofNotes, setProofNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Paginação
  const pagination = usePagination(20);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [brands, creators] = await Promise.all([
        base44.entities.Brand.filter({ user_id: userData.id }),
        base44.entities.Creator.filter({ user_id: userData.id })
      ]);

      if (brands.length > 0) {
        setProfile(brands[0]);
        setProfileType('brand');
        await loadBrandDeliveries(brands[0]);
      } else if (creators.length > 0) {
        setProfile(creators[0]);
        setProfileType('creator');
        await loadCreatorDeliveries(creators[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async (e) => {
    const startY = e.touches[0].clientY;
    
    const handleMove = (e) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100 && window.scrollY === 0 && !refreshing) {
        setRefreshing(true);
        loadData(true);
        document.removeEventListener('touchmove', handleMove);
      }
    };
    
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleMove);
    }, { once: true });
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleRefresh);
    return () => document.removeEventListener('touchstart', handleRefresh);
  }, [refreshing]);

  const loadBrandDeliveries = async (brand) => {
    const [deliveriesData, campaignsData] = await Promise.all([
      base44.entities.Delivery.filter({ brand_id: brand.id }, '-created_date'),
      base44.entities.Campaign.filter({ brand_id: brand.id })
    ]);
    
    setDeliveries(deliveriesData);
    setCampaigns(arrayToMap(campaignsData));

    // Batch fetch creators for better performance
    const creatorIds = [...new Set(deliveriesData.map(d => d.creator_id))];
    if (creatorIds.length > 0) {
      const allCreators = await base44.entities.Creator.list();
      setCreators(arrayToMap(allCreators.filter(c => creatorIds.includes(c.id))));
    }
  };

  const loadCreatorDeliveries = async (creator) => {
    const deliveriesData = await base44.entities.Delivery.filter(
      { creator_id: creator.id }, 
      '-created_date'
    );
    setDeliveries(deliveriesData);

    // Batch fetch campaigns and brands for better performance
    const campaignIds = [...new Set(deliveriesData.map(d => d.campaign_id))];
    const brandIds = [...new Set(deliveriesData.map(d => d.brand_id))];
    
    const [allCampaigns, allBrands] = await Promise.all([
      campaignIds.length > 0 ? base44.entities.Campaign.list() : Promise.resolve([]),
      brandIds.length > 0 ? base44.entities.Brand.list() : Promise.resolve([])
    ]);
    
    setCampaigns(arrayToMap(allCampaigns.filter(c => campaignIds.includes(c.id))));
    setBrands(arrayToMap(allBrands.filter(b => brandIds.includes(b.id))));
  };

  // Brand actions
  const handleApprove = async () => {
    if (!selectedDelivery) return;

    // Valida transição
    const validation = validateTransition('delivery', selectedDelivery, 'approved');
    if (!validation.valid) {
      toast.error(validation.error || validation.errors?.[0]);
      return;
    }

    setProcessing(true);
    
    try {
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        on_time: selectedDelivery.deadline ? new Date() <= new Date(selectedDelivery.deadline) : true
      });

      await base44.entities.Application.update(selectedDelivery.application_id, {
        status: 'completed'
      });

      const creator = creators[selectedDelivery.creator_id];
      if (creator) {
        await base44.entities.Creator.update(creator.id, {
          completed_campaigns: (creator.completed_campaigns || 0) + 1
        });
      }

      await loadData();
      setSelectedDelivery(null);
    } catch (error) {
      console.error('Error approving delivery:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleContest = async () => {
    if (!selectedDelivery || !contestReason) {
      toast.error('Preencha o motivo da contestação');
      return;
    }

    // Valida transição
    const validation = validateTransition('delivery', { ...selectedDelivery, contest_reason: contestReason }, 'in_dispute');
    if (!validation.valid) {
      toast.error(validation.error || validation.errors?.[0]);
      return;
    }

    setProcessing(true);
    
    try {
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'in_dispute',
        contested_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        contest_reason: contestReason
      });

      await base44.entities.Dispute.create({
        delivery_id: selectedDelivery.id,
        campaign_id: selectedDelivery.campaign_id,
        brand_id: profile.id,
        creator_id: selectedDelivery.creator_id,
        raised_by: 'brand',
        reason: contestReason,
        status: 'open',
        brand_statement: contestReason
      });

      await loadData();
      setSelectedDelivery(null);
      setContestReason('');
    } catch (error) {
      console.error('Error contesting delivery:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Creator actions
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setProofUrls(prev => [...prev, file_url]);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleSubmitDelivery = async () => {
    if (!selectedDelivery) return;
    
    const validContentUrls = contentUrls.filter(url => url.trim());
    
    // Valida dados
    const deliveryData = {
      proof_urls: proofUrls,
      content_urls: validContentUrls,
      proof_notes: proofNotes
    };
    
    const validation = validate(deliverySchema, deliveryData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    // Valida transição
    const transitionValidation = validateTransition('delivery', selectedDelivery, 'submitted');
    if (!transitionValidation.valid) {
      toast.error(transitionValidation.error || transitionValidation.errors?.[0]);
      return;
    }
    
    setSubmitting(true);
    
    try {
      
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        ...deliveryData,
        on_time: selectedDelivery.deadline ? new Date() <= new Date(selectedDelivery.deadline) : true
      });

      await loadData();
      closeSubmitDialog();
    } catch (error) {
      console.error('Error submitting delivery:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitDialog = (delivery) => {
    setSelectedDelivery(delivery);
    setProofUrls(delivery.proof_urls || []);
    setContentUrls(delivery.content_urls?.length ? delivery.content_urls : ['']);
    setProofNotes(delivery.proof_notes || '');
  };

  const closeSubmitDialog = () => {
    setSelectedDelivery(null);
    setProofUrls([]);
    setContentUrls(['']);
    setProofNotes('');
  };



  const filteredDeliveries = deliveries.filter(d => {
    const creator = creators[d.creator_id];
    const campaign = campaigns[d.campaign_id];
    const brand = brands[d.brand_id];
    
    const matchesSearch = profileType === 'brand'
      ? creator?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      : campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Aplica paginação
  const paginatedDeliveries = pagination.paginate(filteredDeliveries);
  const totalPages = pagination.totalPages(filteredDeliveries.length);

  // Reset pagination quando filtros mudam
  useEffect(() => {
    pagination.reset();
  }, [searchTerm, filterStatus]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {profileType === 'brand' ? 'Entregas' : 'Minhas Entregas'}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {filteredDeliveries.length} entregas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <SearchFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={profileType === 'brand' ? "Buscar por criador ou campanha..." : "Buscar por campanha ou marca..."}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="submitted">Enviadas</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="contested">Contestadas</SelectItem>
                <SelectItem value="in_dispute">Em Disputa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      {filteredDeliveries.length > 0 ? (
        <div className="space-y-4">
          {paginatedDeliveries.map((delivery, index) => {
            const creator = creators[delivery.creator_id];
            const campaign = campaigns[delivery.campaign_id];
            const brand = brands[delivery.brand_id];
            const isOverdue = delivery.deadline && new Date() > new Date(delivery.deadline) && delivery.status === 'pending';

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Profile Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {profileType === 'brand' ? (
                          <>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={creator?.avatar_url} />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {creator?.display_name?.[0] || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {creator?.display_name || 'Criador'}
                              </h3>
                              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                                {campaign?.title || '-'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            {brand?.logo_url ? (
                              <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {campaign?.title || 'Campanha'}
                              </h3>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {brand?.company_name || 'Marca'}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-[--ts]'}`}>
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(delivery.deadline)}
                                  {isOverdue && <span className="font-medium">(Atrasado!)</span>}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Delivery Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {profileType === 'brand' && (
                          <>
                            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <Calendar className="w-4 h-4" />
                              {formatDate(delivery.deadline)}
                            </div>
                            {delivery.proof_urls?.length > 0 && (
                              <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <ImageIcon className="w-4 h-4" />
                                {delivery.proof_urls.length} arquivo(s)
                              </div>
                            )}
                          </>
                        )}
                        <StatusBadge type="delivery" status={delivery.status} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {profileType === 'brand' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDelivery(delivery)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            {delivery.status === 'submitted' && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedDelivery(delivery)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Avaliar
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {delivery.status === 'pending' && (
                              <Button
                                onClick={() => openSubmitDialog(delivery)}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Entrega
                              </Button>
                            )}
                            {delivery.status === 'submitted' && (
                              <Button
                                variant="outline"
                                onClick={() => openSubmitDialog(delivery)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Entrega
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Requirements Preview (Creator) */}
                    {profileType === 'creator' && campaign?.proof_requirements && delivery.status === 'pending' && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Requisitos:</strong> {campaign.proof_requirements.slice(0, 150)}...
                        </p>
                      </div>
                    )}

                    {/* Contest Reason */}
                    {delivery.status === 'contested' && delivery.contest_reason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Motivo da contestação:</strong> {delivery.contest_reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                totalItems={filteredDeliveries.length}
                pageSize={pagination.pageSize}
                onPageChange={pagination.goToPage}
                onPageSizeChange={(size) => {
                  pagination.setPageSize(size);
                  pagination.reset();
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            {profileType === 'brand' ? (
              <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            ) : (
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma entrega encontrada
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : profileType === 'brand'
                  ? 'As entregas aparecerão aqui quando criadores submeterem seus trabalhos'
                  : 'Suas entregas aparecerão aqui quando suas candidaturas forem aceitas'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Brand Delivery Dialog */}
      {profileType === 'brand' && selectedDelivery && (
        <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Entrega</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Campaign & Creator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm text-[--ts]">Campanha</Label>
                  <p className="font-medium text-slate-900">
                    {campaigns[selectedDelivery.campaign_id]?.title}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm text-[--ts]">Criador</Label>
                  <p className="font-medium text-slate-900">
                    {creators[selectedDelivery.creator_id]?.display_name}
                  </p>
                </div>
              </div>

              {/* Proof Requirements */}
              {campaigns[selectedDelivery.campaign_id]?.proof_requirements && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <Label className="text-sm text-amber-700 font-medium">Requisitos de Prova</Label>
                  <p className="text-amber-800 mt-1">
                    {campaigns[selectedDelivery.campaign_id].proof_requirements}
                  </p>
                </div>
              )}

              {/* Proof Files */}
              {selectedDelivery.proof_urls?.length > 0 && (
                <div>
                  <Label className="text-sm text-[--ts]">Arquivos de Prova</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {selectedDelivery.proof_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-700 truncate">Arquivo {i + 1}</span>
                        <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Content URLs */}
              {selectedDelivery.content_urls?.length > 0 && (
                <div>
                  <Label className="text-sm text-[--ts]">Links do Conteúdo</Label>
                  <div className="space-y-2 mt-2">
                    {selectedDelivery.content_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm truncate">{url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Notes */}
              {selectedDelivery.proof_notes && (
                <div>
                  <Label className="text-sm text-[--ts]">Observações do Criador</Label>
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                    {selectedDelivery.proof_notes}
                  </p>
                </div>
              )}

              {/* Deadline Status */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm text-[--ts]">Prazo de Entrega</Label>
                  <p className="font-medium text-slate-900">
                    {selectedDelivery.deadline 
                      ? new Date(selectedDelivery.deadline).toLocaleDateString('pt-BR', { 
                          day: '2-digit', month: 'long', year: 'numeric' 
                        })
                      : '-'
                    }
                  </p>
                </div>
                {selectedDelivery.submitted_at && selectedDelivery.deadline && (
                  <Badge className={
                    new Date(selectedDelivery.submitted_at) <= new Date(selectedDelivery.deadline)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }>
                    {new Date(selectedDelivery.submitted_at) <= new Date(selectedDelivery.deadline)
                      ? 'No prazo'
                      : 'Atrasada'}
                  </Badge>
                )}
              </div>

              {/* Actions for Submitted Deliveries */}
              {selectedDelivery.status === 'submitted' && (
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-sm text-slate-600">
                    Avalie a entrega com base nos <strong>critérios definidos na campanha</strong>. 
                    Contestações só devem ser feitas quando a entrega não cumpre os requisitos objetivos.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Aprovar Entrega
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {}}
                      disabled={processing || !contestReason}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Contestar
                    </Button>
                  </div>

                  <div>
                    <Label>Motivo da Contestação</Label>
                    <Textarea
                      value={contestReason}
                      onChange={(e) => setContestReason(e.target.value)}
                      placeholder="Descreva objetivamente por que a entrega não atende aos requisitos..."
                      className="mt-2"
                    />
                    <p className="text-xs text-[--ts] mt-1">
                      A contestação abrirá uma disputa que será analisada pela plataforma.
                    </p>
                  </div>

                  {contestReason && (
                    <Button
                      onClick={handleContest}
                      disabled={processing}
                      variant="destructive"
                      className="w-full"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <Flag className="w-4 h-4 mr-2" />
                          Confirmar Contestação
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Contest Reason Display */}
              {selectedDelivery.status === 'contested' && selectedDelivery.contest_reason && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <Label className="text-sm text-red-700 font-medium">Motivo da Contestação</Label>
                  <p className="text-red-800 mt-1">{selectedDelivery.contest_reason}</p>
                </div>
              )}

              {/* Status Display */}
              {selectedDelivery.status !== 'submitted' && (
               <div className="flex items-center justify-center pt-4 border-t">
                 <StatusBadge type="delivery" status={selectedDelivery.status} className="text-base px-4 py-2" />
               </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Creator Submit Dialog */}
      {profileType === 'creator' && (
        <Dialog open={!!selectedDelivery} onOpenChange={() => closeSubmitDialog()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDelivery?.status === 'pending' ? 'Enviar Entrega' : 'Detalhes da Entrega'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDelivery && (
              <div className="space-y-6 py-4">
                {/* Campaign Info */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900">
                    {campaigns[selectedDelivery.campaign_id]?.title}
                  </h4>
                  <p className="text-sm text-[--ts]">
                    {brands[selectedDelivery.brand_id]?.company_name}
                  </p>
                </div>

                {/* Proof Requirements */}
                {campaigns[selectedDelivery.campaign_id]?.proof_requirements && (
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <Label className="text-sm text-amber-700 font-medium">Requisitos de Prova</Label>
                    <p className="text-amber-800 mt-1">
                      {campaigns[selectedDelivery.campaign_id].proof_requirements}
                    </p>
                  </div>
                )}

                {/* Proof Files Upload */}
                <div>
                  <Label>Arquivos de Prova (Screenshots, etc.)</Label>
                  <div className="mt-2 space-y-2">
                    {proofUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600 truncate flex-1">Arquivo {i + 1}</span>
                        {selectedDelivery.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setProofUrls(prev => prev.filter((_, idx) => idx !== i))}
                            className="h-8 w-8"
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      </div>
                    ))}
                    
                    {selectedDelivery.status === 'pending' && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-orange-400 transition-colors">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-sm text-slate-600">Clique para fazer upload</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Content URLs */}
                <div>
                  <Label>Links do Conteúdo Publicado</Label>
                  <div className="mt-2 space-y-2">
                    {contentUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...contentUrls];
                              newUrls[i] = e.target.value;
                              setContentUrls(newUrls);
                            }}
                            placeholder="https://instagram.com/p/..."
                            className="pl-10"
                            disabled={selectedDelivery.status !== 'pending'}
                          />
                        </div>
                        {selectedDelivery.status === 'pending' && contentUrls.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setContentUrls(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {selectedDelivery.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setContentUrls(prev => [...prev, ''])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Link
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                    placeholder="Informações adicionais sobre a entrega..."
                    className="mt-2"
                    disabled={selectedDelivery.status !== 'pending'}
                  />
                </div>

                {/* Submit Button */}
                {selectedDelivery.status === 'pending' && (
                  <div className="pt-4 border-t">
                    <div className={`p-3 rounded-lg mb-3 ${proofUrls.length === 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      <p className={`text-sm font-medium ${proofUrls.length === 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {proofUrls.length === 0 
                          ? '⚠️ Você precisa anexar pelo menos uma prova para enviar' 
                          : '✓ Prova anexada'}
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitDelivery}
                      disabled={submitting || proofUrls.length === 0}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar para Avaliação
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-[--ts] text-center mt-2">
                      Certifique-se de que a entrega atende todos os requisitos antes de enviar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}