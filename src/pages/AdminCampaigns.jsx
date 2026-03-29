import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { downloadBlob } from '@/lib/platform';
import { 
  Search, 
  Download, 
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Pencil,
  Save,
  X
} from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import BrandProfileModal from '@/components/modals/BrandProfileModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCampaigns() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewingBrand, setViewingBrand] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const [campaignsData, brandsData] = await Promise.all([
        base44.entities.Campaign.list('-created_date', 500),
        base44.entities.Brand.list('-created_date', 500)
      ]);
      setCampaigns(campaignsData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Exportando dados...');
      const response = await base44.functions.invoke('adminExportData', { exportType: 'campaigns' });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      downloadBlob(blob, 'campaigns_export.csv');
      
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.company_name || 'Marca Desconhecida';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
      under_review: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Pausada', className: 'bg-orange-100 text-orange-700' },
      applications_closed: { label: 'Fechada', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-700' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={`${config.className} border-0`}>{config.label}</Badge>;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBrandName(campaign.brand_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation Header */}
      <AdminHeader currentPageName="AdminCampaigns" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Todas as Campanhas</h1>
          <p className="mt-1 text-muted-foreground">{filteredCampaigns.length} campanhas encontradas</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="applications_closed">Fechada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="bg-card border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold truncate text-foreground">
                      {campaign.title}
                    </h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  
                  <p className="text-sm line-clamp-2 mb-4 text-muted-foreground">
                    {campaign.description}
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const b = brands.find(br => br.id === campaign.brand_id);
                        b && setViewingBrand(b);
                      }}
                      className="text-primary hover:underline font-medium text-left"
                    >
                      {getBrandName(campaign.brand_id)}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Prazo: {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {campaign.total_applications || 0} candidaturas
                    </span>
                  </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    {campaign.remuneration_type === 'cash' ? '💵 Pago' : 
                     campaign.remuneration_type === 'barter' ? '🎁 Permuta' : '📦 Misto'}
                  </Badge>
                  {campaign.budget_min && campaign.budget_max && (
                    <Badge variant="outline" className="text-xs">
                      R$ {campaign.budget_min} - R$ {campaign.budget_max}
                    </Badge>
                  )}
                  {campaign.featured && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">⭐ Destaque</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                   Criada em {campaign.created_date ? new Date(campaign.created_date).toLocaleDateString('pt-BR') : '—'}
                  </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Details Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => { if (!open) { setSelectedCampaign(null); setEditing(false); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editing ? 'Editando Campanha' : selectedCampaign?.title}</DialogTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditing(true);
                  setEditData({
                    title: selectedCampaign.title || '',
                    description: selectedCampaign.description || '',
                    deadline: selectedCampaign.deadline || '',
                    status: selectedCampaign.status || 'draft',
                  });
                }}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedCampaign && editing ? (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input value={editData.title} onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} className="mt-1 min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Deadline</label>
                  <Input type="date" value={editData.deadline} onChange={(e) => setEditData(d => ({ ...d, deadline: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="under_review">Em Análise</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await base44.entities.Campaign.update(selectedCampaign.id, editData);
                      const user = await base44.auth.me();
                      await base44.entities.AuditLog.create({
                        admin_id: user.id, admin_email: user.email,
                        action: 'campaign_status_change',
                        target_entity_id: selectedCampaign.id,
                        details: `Campanha "${editData.title}" editada pelo admin. Status: ${editData.status}`,
                        timestamp: new Date().toISOString(),
                      });
                      toast.success('Campanha atualizada');
                      setEditing(false);
                      setSelectedCampaign(null);
                      loadCampaigns();
                    } catch (err) {
                      console.error(err);
                      toast.error('Erro ao salvar campanha');
                    } finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : selectedCampaign && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Informações Básicas</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Marca:</span>
                    <button
                      onClick={() => {
                        const b = brands.find(br => br.id === selectedCampaign.brand_id);
                        b && setViewingBrand(b);
                      }}
                      className="font-medium text-primary hover:underline text-left mt-1 block"
                    >
                      {getBrandName(selectedCampaign.brand_id)}
                    </button>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prazo de Entrega:</span>
                    <p className="font-medium">
                      {selectedCampaign.deadline ? new Date(selectedCampaign.deadline).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prazo para Candidaturas:</span>
                    <p className="font-medium">
                      {selectedCampaign.application_deadline 
                        ? new Date(selectedCampaign.application_deadline).toLocaleDateString('pt-BR')
                        : 'Não definido'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Descrição</h4>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {selectedCampaign.description}
                </p>
              </div>

              {selectedCampaign.requirements && (
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Requisitos</h4>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {selectedCampaign.requirements}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Remuneração</h4>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-muted-foreground">Tipo:</span>{' '}
                    <Badge variant="outline">
                      {selectedCampaign.remuneration_type === 'cash' ? 'Pagamento' : 
                       selectedCampaign.remuneration_type === 'barter' ? 'Permuta' : 'Misto'}
                    </Badge>
                  </p>
                  {selectedCampaign.budget_min && selectedCampaign.budget_max && (
                    <p>
                      <span className="text-muted-foreground">Orçamento:</span>{' '}
                      R$ {selectedCampaign.budget_min} - R$ {selectedCampaign.budget_max}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedCampaign.total_applications || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Total de Candidaturas</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {selectedCampaign.slots_filled || 0}/{selectedCampaign.slots_total || 1}
                      </div>
                      <div className="text-xs text-muted-foreground">Vagas Preenchidas</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {viewingBrand && (
        <BrandProfileModal
          brand={viewingBrand}
          isOpen={!!viewingBrand}
          onClose={() => setViewingBrand(null)}
        />
      )}
    </div>
  );
}