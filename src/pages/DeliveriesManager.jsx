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
import { toast } from 'sonner';
import { useAuth } from '../components/contexts/AuthContext';
import { useDeliveriesQuery, useApproveMutation, useContestMutation } from '../components/hooks/useEntityQuery';

export default function DeliveriesManager() {
  const { user, profile: authProfile, profileType } = useAuth();

  const { data, isLoading } = useDeliveriesQuery('brand', authProfile?.id);
  const deliveries = data?.deliveries || [];
  const campaigns = data?.campaigns || {};
  const creators = data?.creators || {};

  const approveMutation = useApproveMutation();
  const contestMutation = useContestMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [contestReason, setContestReason] = useState('');

  const processing = approveMutation.isPending || contestMutation.isPending;

  const handleApprove = async () => {
    if (!selectedDelivery) return;
    try {
      await approveMutation.mutateAsync(selectedDelivery.id);
      toast.success('Entrega aprovada com sucesso!');
      setSelectedDelivery(null);
    } catch (error) {
      toast.error(error.message || 'Erro ao aprovar entrega.');
    }
  };

  const handleContest = async () => {
    if (!selectedDelivery || !contestReason) return;
    try {
      await contestMutation.mutateAsync({ deliveryId: selectedDelivery.id, reason: contestReason });
      toast.success('Entrega contestada. Disputa aberta.');
      setSelectedDelivery(null);
      setContestReason('');
    } catch (error) {
      toast.error(error.message || 'Erro ao contestar entrega.');
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Entregas de Criadores</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {filteredDeliveries.length} entregas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Creator Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={creator?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {creator?.display_name?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {creator?.display_name || 'Criador'}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {campaign?.title || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}
                        </div>
                        {delivery.proof_urls?.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
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
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-12 text-center">
            <FileCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-muted-foreground">
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
                <div className="p-4 bg-muted rounded-xl">
                  <Label className="text-sm text-muted-foreground">Campanha</Label>
                  <p className="font-medium">
                    {campaigns[selectedDelivery.campaign_id]?.title}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <Label className="text-sm text-muted-foreground">Criador</Label>
                  <p className="font-medium">
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
                  <Label className="text-sm text-muted-foreground">Arquivos de Prova</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {selectedDelivery.proof_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm truncate">Arquivo {i + 1}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Content URLs */}
              {selectedDelivery.content_urls?.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Links do Conteúdo</Label>
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
                  <Label className="text-sm text-muted-foreground">Observações do Criador</Label>
                  <p className="mt-1 whitespace-pre-wrap">
                    {selectedDelivery.proof_notes}
                  </p>
                </div>
              )}

              {/* Deadline Status */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Prazo de Entrega</Label>
                  <p className="font-medium">
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
                  <p className="text-sm text-muted-foreground">
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
                      onClick={handleContest}
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
                    <p className="text-xs text-muted-foreground mt-1">
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