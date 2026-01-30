import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
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

export default function AdminCampaigns() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const [campaignsData, brandsData] = await Promise.all([
        base44.entities.Campaign.list('-created_date'),
        base44.entities.Brand.list()
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaigns_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
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
      draft: { label: 'Rascunho', className: 'bg-slate-100 text-slate-700' },
      under_review: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Pausada', className: 'bg-orange-100 text-orange-700' },
      applications_closed: { label: 'Fechada', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Concluída', className: 'bg-indigo-100 text-indigo-700' },
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Todas as Campanhas</h1>
          <p className="text-slate-600 mt-1">{filteredCampaigns.length} campanhas encontradas</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {campaign.title}
                    </h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                    {campaign.description}
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {getBrandName(campaign.brand_id)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        Prazo: {new Date(campaign.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
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
                    <span className="text-xs text-slate-500">
                      Criada em {new Date(campaign.created_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCampaign(campaign)}
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
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Informações Básicas</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Marca:</span>
                    <p className="font-medium">{getBrandName(selectedCampaign.brand_id)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Prazo de Entrega:</span>
                    <p className="font-medium">
                      {new Date(selectedCampaign.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Prazo para Candidaturas:</span>
                    <p className="font-medium">
                      {selectedCampaign.application_deadline 
                        ? new Date(selectedCampaign.application_deadline).toLocaleDateString('pt-BR')
                        : 'Não definido'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Descrição</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {selectedCampaign.description}
                </p>
              </div>

              {selectedCampaign.requirements && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Requisitos</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedCampaign.requirements}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Remuneração</h4>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-slate-600">Tipo:</span>{' '}
                    <Badge variant="outline">
                      {selectedCampaign.remuneration_type === 'cash' ? 'Pagamento' : 
                       selectedCampaign.remuneration_type === 'barter' ? 'Permuta' : 'Misto'}
                    </Badge>
                  </p>
                  {selectedCampaign.budget_min && selectedCampaign.budget_max && (
                    <p>
                      <span className="text-slate-600">Orçamento:</span>{' '}
                      R$ {selectedCampaign.budget_min} - R$ {selectedCampaign.budget_max}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-slate-900">
                        {selectedCampaign.total_applications || 0}
                      </div>
                      <div className="text-xs text-slate-600">Total de Candidaturas</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-slate-900">
                        {selectedCampaign.slots_filled || 0}/{selectedCampaign.slots_total || 1}
                      </div>
                      <div className="text-xs text-slate-600">Vagas Preenchidas</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}