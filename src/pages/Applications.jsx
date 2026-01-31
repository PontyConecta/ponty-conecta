import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
  DollarSign,
  Eye,
  Building2,
  Calendar,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { validateTransition } from '../components/utils/stateTransitions';
import { toast } from 'sonner';

export default function Applications() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [applications, setApplications] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [creators, setCreators] = useState({});
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [agreedRate, setAgreedRate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
        await loadBrandApplications(brands[0]);
      } else if (creators.length > 0) {
        setProfile(creators[0]);
        setProfileType('creator');
        await loadCreatorApplications(creators[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrandApplications = async (brand) => {
    const [applicationsData, campaignsData] = await Promise.all([
      base44.entities.Application.filter({ brand_id: brand.id }, '-created_date'),
      base44.entities.Campaign.filter({ brand_id: brand.id })
    ]);
    
    setApplications(applicationsData);
    
    const campaignsMap = {};
    campaignsData.forEach(c => { campaignsMap[c.id] = c; });
    setCampaigns(campaignsMap);

    // Batch fetch creators for better performance
    const creatorIds = [...new Set(applicationsData.map(a => a.creator_id))];
    if (creatorIds.length > 0) {
      const allCreators = await base44.entities.Creator.list();
      const creatorsMap = {};
      allCreators.filter(c => creatorIds.includes(c.id)).forEach(c => { creatorsMap[c.id] = c; });
      setCreators(creatorsMap);
    }
  };

  const loadCreatorApplications = async (creator) => {
    const applicationsData = await base44.entities.Application.filter(
      { creator_id: creator.id }, 
      '-created_date'
    );
    setApplications(applicationsData);

    // Batch fetch campaigns and brands for better performance
    const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id))];
    const brandIds = [...new Set(applicationsData.map(a => a.brand_id))];
    
    const [allCampaigns, allBrands] = await Promise.all([
      campaignIds.length > 0 ? base44.entities.Campaign.list() : Promise.resolve([]),
      brandIds.length > 0 ? base44.entities.Brand.list() : Promise.resolve([])
    ]);
    
    const campaignsMap = {};
    allCampaigns.filter(c => campaignIds.includes(c.id)).forEach(c => { campaignsMap[c.id] = c; });
    setCampaigns(campaignsMap);
    
    const brandsMap = {};
    allBrands.filter(b => brandIds.includes(b.id)).forEach(b => { brandsMap[b.id] = b; });
    setBrands(brandsMap);
  };

  const handleAccept = async () => {
    if (!selectedApplication) return;
    
    const campaign = campaigns[selectedApplication.campaign_id];
    
    // Valida transição de estado
    const validation = validateTransition('application', selectedApplication, 'accepted', { campaign });
    if (!validation.valid) {
      toast.error(validation.error || validation.errors?.[0]);
      return;
    }

    setProcessing(true);
    
    try {
      const currentSlotsFilled = campaign.slots_filled || 0;

      const rate = agreedRate ? parseFloat(agreedRate) : selectedApplication.proposed_rate;

      await base44.entities.Application.update(selectedApplication.id, {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        agreed_rate: rate
      });

      await base44.entities.Campaign.update(campaign.id, {
        slots_filled: currentSlotsFilled + 1
      });

      await base44.entities.Delivery.create({
        application_id: selectedApplication.id,
        campaign_id: campaign.id,
        creator_id: selectedApplication.creator_id,
        brand_id: profile.id,
        status: 'pending',
        deadline: campaign.deadline
      });

      await loadData();
      setSelectedApplication(null);
      setAgreedRate('');
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Erro ao aceitar candidatura. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    setProcessing(true);
    
    try {
      await base44.entities.Application.update(selectedApplication.id, {
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      });

      await loadData();
      setSelectedApplication(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta candidatura?')) return;
    
    try {
      await base44.entities.Application.update(applicationId, {
        status: 'withdrawn'
      });
      await loadData();
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: profileType === 'brand' ? 'Pendente' : 'Aguardando', color: 'bg-amber-100 text-amber-700', icon: Clock },
      accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: XCircle },
      withdrawn: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700', icon: XCircle },
      completed: { label: 'Concluída', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 }
    };
    return configs[status] || configs.pending;
  };

  const filteredApplications = applications.filter(a => {
    const creator = creators[a.creator_id];
    const campaign = campaigns[a.campaign_id];
    const brand = brands[a.brand_id];
    
    const matchesSearch = profileType === 'brand'
      ? creator?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      : campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesCampaign = filterCampaign === 'all' || a.campaign_id === filterCampaign;
    
    return matchesSearch && matchesStatus && (profileType === 'brand' ? matchesCampaign : true);
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const campaignList = Object.values(campaigns);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {profileType === 'brand' ? 'Candidaturas' : 'Minhas Candidaturas'}
        </h1>
        <p className="text-slate-600 mt-1">
          {filteredApplications.length} candidaturas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={profileType === 'brand' ? "Buscar por criador ou campanha..." : "Buscar por campanha ou marca..."}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pending">{profileType === 'brand' ? 'Pendentes' : 'Aguardando'}</SelectItem>
                  <SelectItem value="accepted">Aceitas</SelectItem>
                  <SelectItem value="rejected">Recusadas</SelectItem>
                  {profileType === 'creator' && <SelectItem value="withdrawn">Canceladas</SelectItem>}
                </SelectContent>
              </Select>
              {profileType === 'brand' && (
                <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Campanhas</SelectItem>
                    {campaignList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application, index) => {
            const creator = creators[application.creator_id];
            const campaign = campaigns[application.campaign_id];
            const brand = brands[application.brand_id];
            const statusConfig = getStatusConfig(application.status);

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
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
                              <h3 className="font-semibold text-slate-900 truncate">
                                {creator?.display_name || 'Criador'}
                              </h3>
                              <p className="text-sm text-slate-500 truncate">
                                Campanha: {campaign?.title || '-'}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {creator?.niche?.slice(0, 3).map((n, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                                ))}
                              </div>
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
                              <h3 className="font-semibold text-slate-900 truncate">
                                {campaign?.title || 'Campanha'}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {brand?.company_name || 'Marca'}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {campaign?.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '-'}
                                </span>
                                {application.proposed_rate && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    R$ {application.proposed_rate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Application Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {profileType === 'brand' && application.proposed_rate && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <DollarSign className="w-4 h-4" />
                            R$ {application.proposed_rate}
                          </div>
                        )}
                        <div className="text-slate-500">
                          {new Date(application.created_date).toLocaleDateString('pt-BR')}
                        </div>
                        <Badge className={`${statusConfig.color} border-0`}>
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        
                        {profileType === 'brand' && application.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(application);
                              setAgreedRate(application.proposed_rate?.toString() || '');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                        )}

                        {profileType === 'creator' && application.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdraw(application.id)}
                            className="text-slate-600"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Message Preview */}
                    {application.message && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {application.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {application.status === 'rejected' && application.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Motivo:</strong> {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Agreed Rate */}
                    {application.status === 'accepted' && application.agreed_rate && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-emerald-700">
                          <strong>Valor Acordado:</strong> R$ {application.agreed_rate}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            {profileType === 'brand' ? (
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            ) : (
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma candidatura encontrada
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : profileType === 'brand'
                  ? 'As candidaturas aparecerão aqui quando criadores se aplicarem às suas campanhas'
                  : 'Suas candidaturas aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Dialog - Brand View */}
      {profileType === 'brand' && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Candidatura</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={creators[selectedApplication.creator_id]?.avatar_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                      {creators[selectedApplication.creator_id]?.display_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {creators[selectedApplication.creator_id]?.display_name || 'Criador'}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {creators[selectedApplication.creator_id]?.bio?.slice(0, 100)}...
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-slate-500">Campanha</Label>
                  <p className="font-medium text-slate-900">
                    {campaigns[selectedApplication.campaign_id]?.title}
                  </p>
                </div>

                {selectedApplication.message && (
                  <div>
                    <Label className="text-sm text-slate-500">Mensagem</Label>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                      {selectedApplication.message}
                    </p>
                  </div>
                )}

                {selectedApplication.proposed_rate && (
                  <div>
                    <Label className="text-sm text-slate-500">Valor Proposto</Label>
                    <p className="text-lg font-semibold text-emerald-600">
                      R$ {selectedApplication.proposed_rate}
                    </p>
                  </div>
                )}

                {selectedApplication.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label>Valor Acordado (R$)</Label>
                      <Input
                        type="number"
                        value={agreedRate}
                        onChange={(e) => setAgreedRate(e.target.value)}
                        placeholder={selectedApplication.proposed_rate?.toString() || '0'}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleAccept}
                        disabled={processing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceitar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (rejectionReason || window.confirm('Deseja realmente recusar esta candidatura?')) {
                            handleReject();
                          }
                        }}
                        disabled={processing}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Recusar
                      </Button>
                    </div>

                    <div>
                      <Label>Motivo da Recusa (opcional)</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explique brevemente o motivo..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {selectedApplication.status !== 'pending' && (
                  <div className="flex items-center justify-center pt-4 border-t">
                    <Badge className={`${getStatusConfig(selectedApplication.status).color} border-0`}>
                      {React.createElement(getStatusConfig(selectedApplication.status).icon, { className: "w-3 h-3 mr-1" })}
                      {getStatusConfig(selectedApplication.status).label}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Application Detail Dialog - Creator View */}
      {profileType === 'creator' && selectedApplication && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Candidatura</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-900">
                  {campaigns[selectedApplication.campaign_id]?.title}
                </h4>
                <p className="text-sm text-slate-500">
                  {brands[selectedApplication.brand_id]?.company_name}
                </p>
              </div>

              {selectedApplication.message && (
                <div>
                  <Label className="text-sm text-slate-500">Sua Mensagem</Label>
                  <p className="text-slate-700 mt-1">
                    {selectedApplication.message}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center pt-4">
                <Badge className={`${getStatusConfig(selectedApplication.status).color} border-0 text-base px-4 py-2`}>
                  {React.createElement(getStatusConfig(selectedApplication.status).icon, { className: "w-4 h-4 mr-2" })}
                  {getStatusConfig(selectedApplication.status).label}
                </Badge>
              </div>

              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Motivo:</strong> {selectedApplication.rejection_reason}
                  </p>
                </div>
              )}

              {selectedApplication.status === 'accepted' && selectedApplication.agreed_rate && (
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    <strong>Valor Acordado:</strong> R$ {selectedApplication.agreed_rate}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}