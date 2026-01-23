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
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Flag
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeliveriesManager() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [creators, setCreators] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [contestReason, setContestReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        setBrand(brands[0]);
        
        const [deliveriesData, campaignsData] = await Promise.all([
          base44.entities.Delivery.filter({ brand_id: brands[0].id }, '-created_date'),
          base44.entities.Campaign.filter({ brand_id: brands[0].id })
        ]);
        
        setDeliveries(deliveriesData);
        
        const campaignsMap = {};
        campaignsData.forEach(c => { campaignsMap[c.id] = c; });
        setCampaigns(campaignsMap);

        // Load creators
        const creatorIds = [...new Set(deliveriesData.map(d => d.creator_id))];
        const creatorsData = await Promise.all(creatorIds.map(id =>
          base44.entities.Creator.filter({ id })
        ));
        const creatorsMap = {};
        creatorsData.flat().forEach(c => { creatorsMap[c.id] = c; });
        setCreators(creatorsMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDelivery) return;
    setProcessing(true);
    
    try {
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        on_time: selectedDelivery.deadline ? new Date() <= new Date(selectedDelivery.deadline) : true
      });

      // Update application status
      await base44.entities.Application.update(selectedDelivery.application_id, {
        status: 'completed'
      });

      // Update creator stats
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
    if (!selectedDelivery || !contestReason) return;
    setProcessing(true);
    
    try {
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'contested',
        contested_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        contest_reason: contestReason
      });

      // Create dispute record
      await base44.entities.Dispute.create({
        delivery_id: selectedDelivery.id,
        campaign_id: selectedDelivery.campaign_id,
        brand_id: brand.id,
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

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Aguardando', color: 'bg-slate-100 text-slate-700', icon: Clock },
      submitted: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Eye },
      approved: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      contested: { label: 'Contestada', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      in_dispute: { label: 'Em Disputa', color: 'bg-orange-100 text-orange-700', icon: Flag },
      resolved: { label: 'Resolvida', color: 'bg-violet-100 text-violet-700', icon: CheckCircle2 },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 }
    };
    return configs[status] || configs.pending;
  };

  const filteredDeliveries = deliveries.filter(d => {
    const creator = creators[d.creator_id];
    const campaign = campaigns[d.campaign_id];
    
    const matchesSearch = creator?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Entregas</h1>
        <p className="text-slate-600 mt-1">
          {filteredDeliveries.length} entregas encontradas
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
                placeholder="Buscar por criador ou campanha..."
                className="pl-10"
              />
            </div>
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
          {filteredDeliveries.map((delivery, index) => {
            const creator = creators[delivery.creator_id];
            const campaign = campaigns[delivery.campaign_id];
            const statusConfig = getStatusConfig(delivery.status);

            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Creator Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
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
                            {campaign?.title || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}
                        </div>
                        {delivery.proof_urls?.length > 0 && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <ImageIcon className="w-4 h-4" />
                            {delivery.proof_urls.length} arquivo(s)
                          </div>
                        )}
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
                          onClick={() => setSelectedDelivery(delivery)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        
                        {delivery.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Avaliar
                          </Button>
                        )}
                      </div>
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
            <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'As entregas aparecerão aqui quando criadores submeterem seus trabalhos'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delivery Detail Dialog */}
      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Entrega</DialogTitle>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-6 py-4">
              {/* Campaign & Creator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm text-slate-500">Campanha</Label>
                  <p className="font-medium text-slate-900">
                    {campaigns[selectedDelivery.campaign_id]?.title}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <Label className="text-sm text-slate-500">Criador</Label>
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
                  <Label className="text-sm text-slate-500">Arquivos de Prova</Label>
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
                  <Label className="text-sm text-slate-500">Links do Conteúdo</Label>
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
                  <Label className="text-sm text-slate-500">Observações do Criador</Label>
                  <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                    {selectedDelivery.proof_notes}
                  </p>
                </div>
              )}

              {/* Deadline Status */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-sm text-slate-500">Prazo de Entrega</Label>
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
                    <p className="text-xs text-slate-500 mt-1">
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
                  <Badge className={`${getStatusConfig(selectedDelivery.status).color} border-0 text-base px-4 py-2`}>
                    {React.createElement(getStatusConfig(selectedDelivery.status).icon, { className: "w-4 h-4 mr-2" })}
                    {getStatusConfig(selectedDelivery.status).label}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}