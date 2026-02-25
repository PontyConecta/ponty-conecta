import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { toast } from '@/components/utils/toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatCurrencyRange } from '../components/utils/formatters';
import { validateTransition } from '../components/utils/stateTransitions';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchFilter from '../components/common/SearchFilter';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaywallModal from '@/components/PaywallModal';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateBrandProfile } from '@/components/utils/profileValidation';
import { 
  Plus, Megaphone, Calendar, DollarSign, Users, Edit, Pause, Play,
  Gift, Package, Target, MoreVertical, XCircle, CheckCircle2, Ban
} from 'lucide-react';
import { motion } from 'framer-motion';
import CampaignCreateMultiStep from '@/components/campaign/CampaignCreateMultiStep';

export default function CampaignManager() {
  const { user, profile: brand } = useAuth();
  const { isSubscribed } = useSubscription();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!brand) {
      setLoading(false);
      return;
    }

    try {
      // Validar completude do perfil
      const validation = validateBrandProfile(brand);
      setProfileValidation(validation);
      
      const campaignsData = await base44.entities.Campaign.filter({ brand_id: brand.id }, '-created_date');
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (campaign) => {
    setEditingCampaign(campaign);
    setIsCreateOpen(true);
  };

  const updateCampaignStatus = async (campaignId, newStatus) => {
    if (!isSubscribed && newStatus === 'active') {
      setShowPaywall(true);
      return;
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Valida transição
    const validation = validateTransition('campaign', campaign, newStatus);
    if (!validation.valid) {
      toast.error(validation.error || validation.errors?.[0]);
      return;
    }

    try {
      await base44.entities.Campaign.update(campaignId, { status: newStatus });
      toast.success('Status da campanha atualizado!');
      await loadData();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Erro ao atualizar status da campanha');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });



  const getRemunerationIcon = (type) => {
    switch (type) {
      case 'barter': return Gift;
      case 'mixed': return Package;
      default: return DollarSign;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Multi-step creation/editing view
  if (isCreateOpen) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {editingCampaign ? 'Atualize os dados da campanha' : 'Preencha os dados para criar sua campanha'}
          </p>
        </div>
        <CampaignCreateMultiStep
          brandId={brand.id}
          editingCampaign={editingCampaign}
          onClose={() => { setIsCreateOpen(false); setEditingCampaign(null); }}
          onSaved={() => { setIsCreateOpen(false); setEditingCampaign(null); loadData(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="mt-1 text-muted-foreground">Gerencie suas campanhas</p>
        </div>
        
        <Button 
          className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm min-h-[44px]"
          onClick={() => { 
            if (!profileValidation.isComplete) {
              toast.error('Complete seu perfil antes de criar campanhas');
              return;
            }
            if (!isSubscribed) {
              setShowPaywall(true);
            } else {
              setEditingCampaign(null);
              setIsCreateOpen(true); 
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="brand"
        />
      )}

      {/* Filters */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar campanhas..."
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="applications_closed">Inscrições Fechadas</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign, index) => {
            const RemunerationIcon = getRemunerationIcon(campaign.remuneration_type);
            
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Cover Image */}
                      {campaign.cover_image_url && (
                        <div className="lg:w-24 lg:h-24 w-full h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold truncate">
                              {campaign.title}
                            </h3>
                            <StatusBadge type="campaign" status={campaign.status} />
                          </div>
                          
                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px]">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {campaign.status === 'draft' && (
                                <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'active')}>
                                  <Play className="w-4 h-4 mr-2 text-emerald-600" />
                                  Publicar
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'active' && (
                                <>
                                  <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'paused')}>
                                    <Pause className="w-4 h-4 mr-2 text-orange-600" />
                                    Pausar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'applications_closed')}>
                                    <XCircle className="w-4 h-4 mr-2 text-blue-600" />
                                    Fechar Inscrições
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'completed')}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-violet-600" />
                                    Marcar como Concluída
                                  </DropdownMenuItem>
                                </>
                              )}
                              {campaign.status === 'paused' && (
                                <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'active')}>
                                  <Play className="w-4 h-4 mr-2 text-emerald-600" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                              {campaign.status === 'applications_closed' && (
                                <>
                                  <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'active')}>
                                    <Play className="w-4 h-4 mr-2 text-emerald-600" />
                                    Reabrir Inscrições
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateCampaignStatus(campaign.id, 'completed')}>
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-violet-600" />
                                    Marcar como Concluída
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => updateCampaignStatus(campaign.id, 'cancelled')}
                                className="text-red-600"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <p className="text-sm line-clamp-2 mb-3 text-muted-foreground">
                          {campaign.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.slots_filled || 0}/{campaign.slots_total || 1}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(campaign.deadline)}
                          </span>
                          <span className="flex items-center gap-1">
                            <RemunerationIcon className="w-4 h-4" />
                            {campaign.remuneration_type === 'cash' && formatCurrencyRange(campaign.budget_min, campaign.budget_max)}
                            {campaign.remuneration_type === 'barter' && 'Permuta'}
                            {campaign.remuneration_type === 'mixed' && 'Misto'}
                          </span>
                          {campaign.total_applications > 0 && (
                            <span className="flex items-center gap-1 text-indigo-600">
                              <Target className="w-4 h-4" />
                              {campaign.total_applications} candidaturas
                            </span>
                          )}
                        </div>
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
            <Megaphone className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Nenhuma campanha encontrada' 
                : 'Nenhuma campanha criada'}
            </h3>
            <p className="mb-6 text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Crie sua primeira campanha para conectar com criadores'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
              onClick={() => {
                if (!profileValidation.isComplete) {
                  toast.error('Complete seu perfil antes de criar campanhas');
                  return;
                }
                if (!isSubscribed) {
                  setShowPaywall(true);
                } else {
                  setIsCreateOpen(true);
                }
              }} 
              className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Recurso Premium"
        description="Você precisa de uma assinatura ativa para criar e publicar campanhas."
        feature="Criar campanhas ilimitadas"
        isAuthenticated={true}
      />
    </div>
  );
}