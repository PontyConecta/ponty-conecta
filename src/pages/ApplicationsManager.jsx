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
  ExternalLink,
  Star,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ApplicationsManager() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [applications, setApplications] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [creators, setCreators] = useState({});
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

      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        setBrand(brands[0]);
        
        const [applicationsData, campaignsData] = await Promise.all([
          base44.entities.Application.filter({ brand_id: brands[0].id }, '-created_date'),
          base44.entities.Campaign.filter({ brand_id: brands[0].id })
        ]);
        
        setApplications(applicationsData);
        
        const campaignsMap = {};
        campaignsData.forEach(c => { campaignsMap[c.id] = c; });
        setCampaigns(campaignsMap);

        // Load creators
        const creatorIds = [...new Set(applicationsData.map(a => a.creator_id))];
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

  const handleAccept = async () => {
    if (!selectedApplication) return;
    setProcessing(true);
    
    try {
      const response = await base44.functions.invoke('acceptApplication', {
        application_id: selectedApplication.id,
        agreed_rate: agreedRate ? parseFloat(agreedRate) : null
      });

      if (!response.data?.success) {
        toast.error(response.data?.error || 'Erro ao aceitar candidatura');
        return;
      }

      toast.success('Candidatura aceita com sucesso!');
      await loadData();
      setSelectedApplication(null);
      setAgreedRate('');
    } catch (error) {
      console.error('Error accepting application:', error);
      toast.error('Erro ao aceitar candidatura.');
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
      accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: XCircle },
      withdrawn: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700', icon: XCircle },
      completed: { label: 'Concluída', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 }
    };
    const style = styles[status] || styles.pending;
    return (
      <Badge className={`${style.color} border-0`}>
        <style.icon className="w-3 h-3 mr-1" />
        {style.label}
      </Badge>
    );
  };

  const filteredApplications = applications.filter(a => {
    const creator = creators[a.creator_id];
    const campaign = campaigns[a.campaign_id];
    
    const matchesSearch = creator?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesCampaign = filterCampaign === 'all' || a.campaign_id === filterCampaign;
    
    return matchesSearch && matchesStatus && matchesCampaign;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const campaignList = Object.values(campaigns);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Candidaturas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {filteredApplications.length} candidaturas encontradas
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
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="accepted">Aceitas</SelectItem>
                  <SelectItem value="rejected">Recusadas</SelectItem>
                </SelectContent>
              </Select>
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

            return (
              <motion.div
                key={application.id}
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {creator?.display_name || 'Criador'}
                            </h3>
                            {creator?.verified && (
                              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                Verificado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            Campanha: {campaign?.title || '-'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {creator?.niche?.slice(0, 3).map((n, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                            ))}
                            {creator?.profile_size && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {creator.profile_size}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {application.proposed_rate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            R$ {application.proposed_rate}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {new Date(application.created_date).toLocaleDateString('pt-BR')}
                        </div>
                        {getStatusBadge(application.status)}
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
                        
                        {application.status === 'pending' && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Message Preview */}
                    {application.message && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {application.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma candidatura encontrada
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterCampaign !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'As candidaturas aparecerão aqui quando criadores se aplicarem às suas campanhas'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Candidatura</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Creator Profile */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={creators[selectedApplication.creator_id]?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {creators[selectedApplication.creator_id]?.display_name?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">
                    {creators[selectedApplication.creator_id]?.display_name || 'Criador'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {creators[selectedApplication.creator_id]?.bio?.slice(0, 100)}...
                  </p>
                  <div className="flex gap-1 mt-2">
                    {creators[selectedApplication.creator_id]?.platforms?.slice(0, 3).map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{p.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campaign */}
              <div>
                <Label className="text-sm text-muted-foreground">Campanha</Label>
                <p className="font-medium">
                  {campaigns[selectedApplication.campaign_id]?.title}
                </p>
              </div>

              {/* Message */}
              {selectedApplication.message && (
                <div>
                  <Label className="text-sm text-muted-foreground">Mensagem</Label>
                  <p className="mt-1 whitespace-pre-wrap">
                    {selectedApplication.message}
                  </p>
                </div>
              )}

              {/* Proposed Rate */}
              {selectedApplication.proposed_rate && (
                <div>
                  <Label className="text-sm text-muted-foreground">Valor Proposto</Label>
                  <p className="text-lg font-semibold text-emerald-600">
                    R$ {selectedApplication.proposed_rate}
                  </p>
                </div>
              )}

              {/* Actions for Pending Applications */}
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

              {/* Status for Non-Pending */}
              {selectedApplication.status !== 'pending' && (
                <div className="flex items-center justify-center pt-4 border-t">
                  {getStatusBadge(selectedApplication.status)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}