import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  FileText,
  ExternalLink,
  Scale,
  Gavel,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminDisputes() {
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [deliveries, setDeliveries] = useState({});
  const [campaigns, setCampaigns] = useState({});
  const [brands, setBrands] = useState({});
  const [creators, setCreators] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('open');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Check if user is admin
      if (userData.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      // Load disputes
      const disputesData = await base44.entities.Dispute.list('-created_date');
      setDisputes(disputesData);

      // Load related entities
      const deliveryIds = [...new Set(disputesData.map(d => d.delivery_id))];
      const campaignIds = [...new Set(disputesData.map(d => d.campaign_id))];
      const brandIds = [...new Set(disputesData.map(d => d.brand_id))];
      const creatorIds = [...new Set(disputesData.map(d => d.creator_id))];

      const [deliveriesData, campaignsData, brandsData, creatorsData] = await Promise.all([
        Promise.all(deliveryIds.map(id => base44.entities.Delivery.filter({ id }))),
        Promise.all(campaignIds.map(id => base44.entities.Campaign.filter({ id }))),
        Promise.all(brandIds.map(id => base44.entities.Brand.filter({ id }))),
        Promise.all(creatorIds.map(id => base44.entities.Creator.filter({ id })))
      ]);

      const deliveriesMap = {};
      deliveriesData.flat().forEach(d => { deliveriesMap[d.id] = d; });
      setDeliveries(deliveriesMap);

      const campaignsMap = {};
      campaignsData.flat().forEach(c => { campaignsMap[c.id] = c; });
      setCampaigns(campaignsMap);

      const brandsMap = {};
      brandsData.flat().forEach(b => { brandsMap[b.id] = b; });
      setBrands(brandsMap);

      const creatorsMap = {};
      creatorsData.flat().forEach(c => { creatorsMap[c.id] = c; });
      setCreators(creatorsMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar disputas');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution || !resolutionType) return;
    
    setProcessing(true);
    try {
      // Update dispute
      await base44.entities.Dispute.update(selectedDispute.id, {
        status: resolutionType,
        resolution: resolution,
        resolved_by: user.email,
        resolved_at: new Date().toISOString()
      });

      // Update delivery based on resolution
      const delivery = deliveries[selectedDispute.delivery_id];
      if (delivery) {
        const newDeliveryStatus = resolutionType === 'resolved_creator_favor' ? 'approved' : 'closed';
        await base44.entities.Delivery.update(delivery.id, {
          status: 'resolved',
          payment_status: resolutionType === 'resolved_creator_favor' ? 'completed' : 'disputed'
        });
      }

      // Update application if creator won
      if (resolutionType === 'resolved_creator_favor' && delivery) {
        await base44.entities.Application.update(delivery.application_id, {
          status: 'completed'
        });
      }

      await loadData();
      setSelectedDispute(null);
      setResolution('');
      setResolutionType('');
      toast.success('Disputa resolvida com sucesso');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Erro ao resolver disputa');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      open: { label: 'Aberta', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      under_review: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      resolved_brand_favor: { label: 'Favorável à Marca', color: 'bg-indigo-100 text-indigo-700', icon: Building2 },
      resolved_creator_favor: { label: 'Favorável ao Criador', color: 'bg-orange-100 text-orange-700', icon: User },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 }
    };
    return configs[status] || configs.open;
  };

  const filteredDisputes = disputes.filter(d => {
    return filterStatus === 'all' || d.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Painel de Disputas</h1>
          <p className="text-slate-600">Resolver conflitos entre marcas e criadores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {disputes.filter(d => d.status === 'open').length}
            </div>
            <div className="text-sm text-slate-500">Abertas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {disputes.filter(d => d.status === 'under_review').length}
            </div>
            <div className="text-sm text-slate-500">Em Análise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {disputes.filter(d => d.status.includes('resolved')).length}
            </div>
            <div className="text-sm text-slate-500">Resolvidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-600">
              {disputes.length}
            </div>
            <div className="text-sm text-slate-500">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
              <SelectItem value="resolved_brand_favor">Favorável à Marca</SelectItem>
              <SelectItem value="resolved_creator_favor">Favorável ao Criador</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Disputes List */}
      {filteredDisputes.length > 0 ? (
        <div className="space-y-4">
          {filteredDisputes.map((dispute, index) => {
            const brand = brands[dispute.brand_id];
            const creator = creators[dispute.creator_id];
            const campaign = campaigns[dispute.campaign_id];
            const statusConfig = getStatusConfig(dispute.status);

            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-shadow ${dispute.status === 'open' ? 'border-red-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Parties */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          {brand?.logo_url ? (
                            <img src={brand.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{brand?.company_name || 'Marca'}</span>
                        </div>
                        
                        <Scale className="w-5 h-5 text-slate-400" />
                        
                        <div className="flex items-center gap-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={creator?.avatar_url} />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {creator?.display_name?.[0] || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-900">{creator?.display_name || 'Criador'}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-slate-500">
                          {new Date(dispute.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge className={`${statusConfig.color} border-0`}>
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {dispute.raised_by === 'brand' ? 'Pela Marca' : 'Pelo Criador'}
                        </Badge>
                      </div>

                      {/* Action */}
                      <Button
                        variant={dispute.status === 'open' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedDispute(dispute)}
                        className={dispute.status === 'open' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {dispute.status === 'open' ? 'Analisar' : 'Ver'}
                      </Button>
                    </div>

                    {/* Reason Preview */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        <strong>Motivo:</strong> {dispute.reason}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Campanha: {campaign?.title || '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma disputa encontrada
            </h3>
            <p className="text-slate-500">
              {filterStatus !== 'all' ? 'Tente ajustar o filtro' : 'Não há disputas para resolver'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Análise da Disputa
            </DialogTitle>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-6 py-4">
              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {brands[selectedDispute.brand_id]?.logo_url ? (
                        <img src={brands[selectedDispute.brand_id].logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-indigo-600 font-medium">MARCA</p>
                        <p className="font-semibold text-slate-900">
                          {brands[selectedDispute.brand_id]?.company_name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={creators[selectedDispute.creator_id]?.avatar_url} />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {creators[selectedDispute.creator_id]?.display_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-orange-600 font-medium">CRIADOR</p>
                        <p className="font-semibold text-slate-900">
                          {creators[selectedDispute.creator_id]?.display_name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    {campaigns[selectedDispute.campaign_id]?.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    {campaigns[selectedDispute.campaign_id]?.description}
                  </p>
                  
                  {/* Proof Requirements */}
                  {campaigns[selectedDispute.campaign_id]?.proof_requirements && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-900 mb-1">Requisitos de Prova</p>
                      <p className="text-sm text-amber-800">
                        {campaigns[selectedDispute.campaign_id].proof_requirements}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dispute Reason */}
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Motivo da Disputa (por {selectedDispute.raised_by === 'brand' ? 'Marca' : 'Criador'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700">{selectedDispute.reason}</p>
                </CardContent>
              </Card>

              {/* Statements */}
              <div className="grid grid-cols-2 gap-4">
                {selectedDispute.brand_statement && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Posição da Marca</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-700">{selectedDispute.brand_statement}</p>
                    </CardContent>
                  </Card>
                )}
                {selectedDispute.creator_statement && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Posição do Criador</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-700">{selectedDispute.creator_statement}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Delivery Proof */}
              {deliveries[selectedDispute.delivery_id] && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500">Provas Enviadas pelo Criador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deliveries[selectedDispute.delivery_id].proof_urls?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {deliveries[selectedDispute.delivery_id].proof_urls.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200"
                          >
                            <FileText className="w-4 h-4" />
                            Arquivo {i + 1}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                    {deliveries[selectedDispute.delivery_id].content_urls?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Links do conteúdo:</p>
                        {deliveries[selectedDispute.delivery_id].content_urls.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {url}
                          </a>
                        ))}
                      </div>
                    )}
                    {deliveries[selectedDispute.delivery_id].proof_notes && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-700">
                          {deliveries[selectedDispute.delivery_id].proof_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Evidence */}
              {selectedDispute.evidence_urls?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500">Evidências Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedDispute.evidence_urls.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200"
                        >
                          <FileText className="w-4 h-4" />
                          Evidência {i + 1}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resolution (only for open disputes) */}
              {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-emerald-600" />
                      Resolução
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Decisão *</Label>
                      <Select value={resolutionType} onValueChange={setResolutionType}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione a decisão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resolved_creator_favor">
                            ✅ Favorável ao Criador (aprovar entrega)
                          </SelectItem>
                          <SelectItem value="resolved_brand_favor">
                            ⚠️ Favorável à Marca (rejeitar entrega)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Justificativa *</Label>
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Explique a decisão baseando-se nos requisitos da campanha e nas provas apresentadas..."
                        className="mt-2 min-h-[120px]"
                      />
                    </div>

                    <Button
                      onClick={handleResolve}
                      disabled={processing || !resolution || !resolutionType}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Gavel className="w-4 h-4 mr-2" />
                          Emitir Decisão
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Resolution Display (for resolved disputes) */}
              {selectedDispute.resolution && (
                <Card className="border-emerald-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-600">Decisão Final</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 mb-2">{selectedDispute.resolution}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Por: {selectedDispute.resolved_by}</span>
                      <span>Em: {selectedDispute.resolved_at ? new Date(selectedDispute.resolved_at).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}