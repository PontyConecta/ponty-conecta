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
  Eye,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import BrandProfileModal from '@/components/modals/BrandProfileModal';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import PaywallModal from '@/components/PaywallModal';

export default function MyDeliveries() {
  const { user, profile: authProfile, profileType, loading: authLoading } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
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
  const [vouchers, setVouchers] = useState({});

  useEffect(() => {
    if (!authLoading && profileType && profileType !== 'creator') {
      navigate(createPageUrl('Home'));
      return;
    }
    if (authProfile && profileType === 'creator') {
      setCreator(authProfile);
      loadPageData(authProfile);
    }
  }, [authProfile, profileType, authLoading]);

  const loadData = () => loadPageData(authProfile);

  const loadPageData = async (creatorProfile) => {
    if (!creatorProfile) return;
    let loadedDeliveries = [];
    try {
      const deliveriesData = await base44.entities.Delivery.filter(
        { creator_id: creatorProfile.id }, 
        '-created_date',
        500
      );
      loadedDeliveries = deliveriesData;
      setDeliveries(deliveriesData);
...
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar entregas.');
    } finally {
      setLoading(false);

      // Deep-link: open delivery from URL param
      const params = new URLSearchParams(window.location.search);
      const targetAppId = params.get('applicationId');
      if (targetAppId && loadedDeliveries.length > 0) {
        const target = loadedDeliveries.find(d => d.application_id === targetAppId);
        if (target) openSubmitDialog(target);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'];
    
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} excede o limite de 10MB`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Tipo de arquivo não permitido: ${file.name}`);
        continue;
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setProofUrls(prev => [...prev, file_url]);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Erro ao enviar arquivo. Tente novamente.');
      }
    }
  };

  const handleSubmitDelivery = async () => {
    if (!selectedDelivery) return;
    
    if (proofUrls.length === 0) {
      alert('É obrigatório anexar pelo menos uma prova da entrega (screenshot, foto, etc).');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const validContentUrls = contentUrls.filter(url => url.trim());
      
      await base44.functions.invoke('submitDelivery', {
        delivery_id: selectedDelivery.id,
        proof_urls: proofUrls,
        content_urls: validContentUrls,
        proof_notes: proofNotes,
      });

      toast.success('Entrega enviada com sucesso!');
      await loadData();
      closeSubmitDialog();
    } catch (error) {
      console.error('Error submitting delivery:', error);
      toast.error('Erro ao enviar entrega. Tente novamente.');
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
      resolved: { label: 'Resolvida', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 },
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight">Minhas Entregas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {filteredDeliveries.length} entregas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
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
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {campaign?.title || 'Campanha'}
                          </h3>
                          <button onClick={(e) => { e.stopPropagation(); brand && setSelectedBrand(brand); }} className="text-sm text-primary hover:underline text-left">
                            {brand?.company_name || 'Marca'}
                          </button>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                              <Calendar className="w-4 h-4" />
                              {delivery.deadline ? new Date(delivery.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
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
                          className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]"
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
                      {['approved', 'contested', 'in_dispute', 'resolved', 'closed'].includes(delivery.status) && (
                        <Button variant="outline" size="sm" onClick={() => openSubmitDialog(delivery)} className="min-h-[44px]">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
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

                    {/* Voucher */}
                    {delivery.status === 'approved' && vouchers[delivery.id] && (
                      <div className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-accent">Voucher Recebido</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{vouchers[delivery.id].benefit_description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="text-xs font-mono bg-card px-2 py-1 rounded border font-bold tracking-wider">
                            {vouchers[delivery.id].code}
                          </code>
                          <Badge variant="outline" className="text-[10px]">
                            {vouchers[delivery.id].status === 'redeemed' ? 'Utilizado' : 'Disponível'}
                          </Badge>
                        </div>
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
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhuma entrega encontrada' : 'Suas entregas aprovadas aparecem aqui 🎯'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Quando suas candidaturas forem aceitas, as entregas aparecerão aqui.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Brand Profile Modal */}
      <Dialog open={!!selectedBrand} onOpenChange={(v) => { if (!v) setSelectedBrand(null); }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBrand?.company_name}</DialogTitle>
          </DialogHeader>
          {selectedBrand && (
            <BrandProfileModal
              brand={selectedBrand}
              isSubscribed={isSubscribed}
              onPaywall={() => { setSelectedBrand(null); setShowPaywall(true); }}
              onMessage={(b) => {
                setSelectedBrand(null);
                navigate(createPageUrl('InboxThread') + `?recipientId=${b.user_id}&recipientName=${encodeURIComponent(b.company_name || 'Marca')}`);
              }}
              onViewCampaign={(campaign) => {
                setSelectedBrand(null);
                navigate(createPageUrl('OpportunityFeed') + `?campaignId=${campaign.id}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} title="Recurso Premium" description="Assine para desbloquear contato completo das marcas." feature="Contato de marcas" isAuthenticated={true} />

      {/* Submit Delivery Dialog */}
      <Dialog open={!!selectedDelivery} onOpenChange={() => closeSubmitDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDelivery?.status === 'pending' ? 'Enviar Entrega' : 'Detalhes da Entrega'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDelivery && (
            selectedDelivery.status !== 'pending' ? (
              /* Read-only view for non-pending deliveries */
              <div className="space-y-6 py-4">
                <div className="p-4 rounded-xl">
                  <h4 className="font-semibold">{campaigns[selectedDelivery.campaign_id]?.title}</h4>
                  <button
                    onClick={() => {
                      const b = brands[selectedDelivery.brand_id];
                      b && setSelectedBrand(b);
                    }}
                    className="text-sm text-primary hover:underline text-left mt-0.5"
                  >
                    {brands[selectedDelivery.brand_id]?.company_name}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusConfig(selectedDelivery.status).color} border-0`}>
                    {getStatusConfig(selectedDelivery.status).label}
                  </Badge>
                </div>

                {proofUrls.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Provas enviadas</Label>
                    <div className="mt-2 space-y-2">
                      {proofUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 text-sm">
                          <ExternalLink className="w-4 h-4 text-primary" />
                          Arquivo {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {contentUrls.filter(u => u.trim()).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Links do conteúdo</Label>
                    <div className="mt-2 space-y-2">
                      {contentUrls.filter(u => u.trim()).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                          <ExternalLink className="w-4 h-4" />
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {proofNotes && (
                  <div>
                    <Label className="text-sm font-medium">Observações</Label>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{proofNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Submit form for pending deliveries */
              <div className="space-y-6 py-4">
                <div className="p-4 rounded-xl">
                  <h4 className="font-semibold">{campaigns[selectedDelivery.campaign_id]?.title}</h4>
                  <button
                    onClick={() => {
                      const b = brands[selectedDelivery.brand_id];
                      b && setSelectedBrand(b);
                    }}
                    className="text-sm text-primary hover:underline text-left mt-0.5"
                  >
                    {brands[selectedDelivery.brand_id]?.company_name}
                  </button>
                </div>

                {campaigns[selectedDelivery.campaign_id]?.proof_requirements && (
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <Label className="text-sm text-amber-700 font-medium">Requisitos de Prova</Label>
                    <p className="text-amber-800 mt-1">
                      {campaigns[selectedDelivery.campaign_id].proof_requirements}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Arquivos de Prova (Screenshots, etc.)</Label>
                  <div className="mt-2 space-y-2">
                    {proofUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                        <span className="text-sm truncate flex-1">Arquivo {i + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => setProofUrls(prev => prev.filter((_, idx) => idx !== i))} className="h-8 w-8">
                          <X className="w-4 h-4" />
                        </Button>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                      </div>
                    ))}
                    <label className="cursor-pointer">
                      <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                      <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Clique para fazer upload</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Links do Conteúdo Publicado</Label>
                  <div className="mt-2 space-y-2">
                    {contentUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                          <Input value={url} onChange={(e) => { const newUrls = [...contentUrls]; newUrls[i] = e.target.value; setContentUrls(newUrls); }} placeholder="https://instagram.com/p/..." className="pl-10" />
                        </div>
                        {contentUrls.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => setContentUrls(prev => prev.filter((_, idx) => idx !== i))}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setContentUrls(prev => [...prev, ''])}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Link
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Observações (opcional)</Label>
                  <Textarea value={proofNotes} onChange={(e) => setProofNotes(e.target.value)} placeholder="Informações adicionais sobre a entrega..." className="mt-2" />
                </div>

                <div className="pt-4 border-t">
                  <div className={`p-3 rounded-lg mb-3 ${proofUrls.length === 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <p className={`text-sm font-medium ${proofUrls.length === 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {proofUrls.length === 0 ? '⚠️ Você precisa anexar pelo menos uma prova para enviar' : '✓ Prova anexada'}
                    </p>
                  </div>
                  <Button onClick={handleSubmitDelivery} disabled={submitting || proofUrls.length === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Enviar para Avaliação</>}
                  </Button>
                  <p className="text-xs text-center mt-2">Certifique-se de que a entrega atende todos os requisitos antes de enviar.</p>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}