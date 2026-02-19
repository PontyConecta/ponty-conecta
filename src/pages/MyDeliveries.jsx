import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  Calendar,
  AlertTriangle,
  Upload,
  Send,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  X,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyDeliveries() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [proofUrls, setProofUrls] = useState([]);
  const [contentUrls, setContentUrls] = useState(['']);
  const [proofNotes, setProofNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        setCreator(creators[0]);
        
        const deliveriesData = await base44.entities.Delivery.filter(
          { creator_id: creators[0].id }, 
          '-created_date'
        );
        setDeliveries(deliveriesData);

        // Load campaigns
        const campaignIds = [...new Set(deliveriesData.map(d => d.campaign_id))];
        const campaignsData = await Promise.all(campaignIds.map(id =>
          base44.entities.Campaign.filter({ id })
        ));
        const campaignsMap = {};
        campaignsData.flat().forEach(c => { campaignsMap[c.id] = c; });
        setCampaigns(campaignsMap);

        // Load brands
        const brandIds = [...new Set(deliveriesData.map(d => d.brand_id))];
        const brandsData = await Promise.all(brandIds.map(id =>
          base44.entities.Brand.filter({ id })
        ));
        const brandsMap = {};
        brandsData.flat().forEach(b => { brandsMap[b.id] = b; });
        setBrands(brandsMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    // Mandatory proof validation
    if (proofUrls.length === 0) {
      alert('É obrigatório anexar pelo menos uma prova da entrega (screenshot, foto, etc).');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const validContentUrls = contentUrls.filter(url => url.trim());
      
      await base44.entities.Delivery.update(selectedDelivery.id, {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        proof_urls: proofUrls,
        content_urls: validContentUrls,
        proof_notes: proofNotes,
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

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Aguardando', color: 'bg-slate-100 text-slate-700', icon: Clock },
      submitted: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Eye },
      approved: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      contested: { label: 'Contestada', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      in_dispute: { label: 'Em Disputa', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      resolved: { label: 'Resolvida', color: 'bg-violet-100 text-violet-700', icon: CheckCircle2 },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700', icon: CheckCircle2 }
    };
    return configs[status] || configs.pending;
  };

  const filteredDeliveries = deliveries.filter(d => {
    const campaign = campaigns[d.campaign_id];
    const brand = brands[d.brand_id];
    
    const matchesSearch = campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Minhas Entregas</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {filteredDeliveries.length} entregas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por campanha ou marca..."
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      {filteredDeliveries.length > 0 ? (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery, index) => {
            const campaign = campaigns[delivery.campaign_id];
            const brand = brands[delivery.brand_id];
            const statusConfig = getStatusConfig(delivery.status);
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
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Brand & Campaign */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
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
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                              <Calendar className="w-4 h-4" />
                              {delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR') : '-'}
                              {isOverdue && <span className="font-medium">(Atrasado!)</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-wrap items-center gap-4">
                        <Badge className={`${statusConfig.color} border-0`}>
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Actions */}
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
                    </div>

                    {/* Requirements Preview */}
                    {campaign?.proof_requirements && delivery.status === 'pending' && (
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
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Suas entregas aparecerão aqui quando suas candidaturas forem aceitas'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Delivery Dialog */}
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
                <p className="text-sm text-slate-500">
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
                          <X className="w-4 h-4" />
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
                          <X className="w-4 h-4" />
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
                  <p className="text-xs text-slate-500 text-center mt-2">
                    Certifique-se de que a entrega atende todos os requisitos antes de enviar.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}