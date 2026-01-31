import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { toast } from '@/components/utils/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrencyRange } from '../components/utils/formatters';
import { campaignSchema, validate } from '../components/utils/validationSchemas';
import { validateTransition } from '../components/utils/stateTransitions';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchFilter from '../components/common/SearchFilter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaywallModal from '@/components/PaywallModal';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateBrandProfile } from '@/components/utils/profileValidation';
import { 
  Plus, 
  Search,
  Megaphone,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Eye,
  Pause,
  Play,
  Loader2,
  Gift,
  Package,
  Target,
  MapPin,
  MoreVertical,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Hash,
  AtSign,
  ListChecks,
  Ban,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CampaignManager() {
  const { user, profile: brand } = useAuth();
  const { isSubscribed } = useSubscription();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    platforms: [],
    content_type: [],
    niche_required: [],
    location: '',
    deadline: '',
    application_deadline: '',
    remuneration_type: 'cash',
    budget_min: '',
    budget_max: '',
    barter_description: '',
    barter_value: '',
    slots_total: 1,
    profile_size_min: '',
    proof_requirements: '',
    target_audience: '',
    content_guidelines: '',
    dos: [''],
    donts: [''],
    hashtags: [''],
    mentions: [''],
    cover_image_url: ''
  });

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads'];
  const contentTypes = ['Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Unboxing', 'Reviews'];
  const niches = ['Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde', 'Viagens', 'Gastronomia'];

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('cover_image_url', file_url);
    } catch (error) {
      console.error('Error uploading cover:', error);
    }
  };

  const handleSubmit = async () => {
    // Verificar se o perfil está completo
    if (!profileValidation.isComplete) {
      toast.error('Complete seu perfil antes de criar campanhas', {
        description: 'Preencha os campos obrigatórios no seu perfil'
      });
      return;
    }
    
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }

    const campaignData = {
      ...formData,
      brand_id: brand.id,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      barter_value: formData.barter_value ? parseFloat(formData.barter_value) : null,
      slots_total: parseInt(formData.slots_total) || 1,
      dos: formData.dos.filter(d => d.trim()),
      donts: formData.donts.filter(d => d.trim()),
      hashtags: formData.hashtags.filter(h => h.trim()),
      mentions: formData.mentions.filter(m => m.trim()),
      status: editingCampaign ? editingCampaign.status : 'draft'
    };

    // Valida dados
    const validation = validate(campaignSchema, campaignData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    setSaving(true);
    try {
      if (editingCampaign) {
        await base44.entities.Campaign.update(editingCampaign.id, campaignData);
        toast.success('Campanha atualizada com sucesso!');
      } else {
        await base44.entities.Campaign.create(campaignData);
        toast.success('Campanha criada com sucesso!');
      }

      await loadData();
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Erro ao salvar campanha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      platforms: [],
      content_type: [],
      niche_required: [],
      location: '',
      deadline: '',
      application_deadline: '',
      remuneration_type: 'cash',
      budget_min: '',
      budget_max: '',
      barter_description: '',
      barter_value: '',
      slots_total: 1,
      profile_size_min: '',
      proof_requirements: '',
      target_audience: '',
      content_guidelines: '',
      dos: [''],
      donts: [''],
      hashtags: [''],
      mentions: [''],
      cover_image_url: ''
    });
    setEditingCampaign(null);
  };

  const openEditDialog = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title || '',
      description: campaign.description || '',
      requirements: campaign.requirements || '',
      platforms: campaign.platforms || [],
      content_type: campaign.content_type || [],
      niche_required: campaign.niche_required || [],
      location: campaign.location || '',
      deadline: campaign.deadline || '',
      application_deadline: campaign.application_deadline || '',
      remuneration_type: campaign.remuneration_type || 'cash',
      budget_min: campaign.budget_min || '',
      budget_max: campaign.budget_max || '',
      barter_description: campaign.barter_description || '',
      barter_value: campaign.barter_value || '',
      slots_total: campaign.slots_total || 1,
      profile_size_min: campaign.profile_size_min || '',
      proof_requirements: campaign.proof_requirements || '',
      target_audience: campaign.target_audience || '',
      content_guidelines: campaign.content_guidelines || '',
      dos: campaign.dos?.length ? campaign.dos : [''],
      donts: campaign.donts?.length ? campaign.donts : [''],
      hashtags: campaign.hashtags?.length ? campaign.hashtags : [''],
      mentions: campaign.mentions?.length ? campaign.mentions : [''],
      cover_image_url: campaign.cover_image_url || ''
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Campanhas</h1>
          <p className="text-slate-600 mt-1">Gerencie suas campanhas</p>
        </div>
        
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => { 
            if (!profileValidation.isComplete) {
              toast.error('Complete seu perfil antes de criar campanhas');
              return;
            }
            if (!isSubscribed) {
              setShowPaywall(true);
            } else {
              resetForm(); 
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
      <Card>
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
                <Card className="hover:shadow-md transition-shadow">
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
                            <h3 className="text-lg font-semibold text-slate-900 truncate">
                              {campaign.title}
                            </h3>
                            <StatusBadge type="campaign" status={campaign.status} />
                          </div>
                          
                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-sm text-slate-500">
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
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Nenhuma campanha encontrada' 
                : 'Nenhuma campanha criada'}
            </h3>
            <p className="text-slate-500 mb-6">
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
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Cover Image */}
            <div>
              <Label>Imagem de Capa</Label>
              <div className="mt-2">
                {formData.cover_image_url ? (
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                      onClick={() => handleChange('cover_image_url', '')}
                    >
                      <XCircle className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm text-slate-500">Upload de imagem</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label>Título da Campanha *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Lançamento Coleção Verão 2024"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o objetivo da campanha..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <div>
                <Label>Público-Alvo</Label>
                <Textarea
                  value={formData.target_audience}
                  onChange={(e) => handleChange('target_audience', e.target.value)}
                  placeholder="Descreva o público que você quer atingir..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Requisitos e Entregas *</Label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="Liste exatamente o que o criador deve entregar..."
                  className="mt-2 min-h-[80px]"
                />
              </div>

              <div>
                <Label>Diretrizes de Conteúdo</Label>
                <Textarea
                  value={formData.content_guidelines}
                  onChange={(e) => handleChange('content_guidelines', e.target.value)}
                  placeholder="Estilo, tom, referências visuais..."
                  className="mt-2"
                />
              </div>
            </div>

            {/* Do's and Don'ts */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-600" />
                  O que FAZER
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.dos.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('dos', index, e.target.value)}
                        placeholder="Ex: Usar luz natural"
                      />
                      {formData.dos.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField('dos', index)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayField('dos')}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-600" />
                  O que NÃO FAZER
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.donts.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('donts', index, e.target.value)}
                        placeholder="Ex: Mencionar concorrentes"
                      />
                      {formData.donts.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField('donts', index)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayField('donts')}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Hashtags and Mentions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Hashtags Obrigatórias
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.hashtags.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('hashtags', index, e.target.value)}
                        placeholder="#suamarca"
                      />
                      {formData.hashtags.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField('hashtags', index)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayField('hashtags')}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <AtSign className="w-4 h-4" />
                  Menções Obrigatórias
                </Label>
                <div className="space-y-2 mt-2">
                  {formData.mentions.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayFieldChange('mentions', index, e.target.value)}
                        placeholder="@suamarca"
                      />
                      {formData.mentions.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField('mentions', index)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayField('mentions')}>
                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Platforms & Content */}
            <div className="space-y-4">
              <div>
                <Label>Plataformas *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {platforms.map((p) => (
                    <Badge
                      key={p}
                      variant={formData.platforms.includes(p) ? "default" : "outline"}
                      className={`cursor-pointer ${formData.platforms.includes(p) ? 'bg-indigo-600' : ''}`}
                      onClick={() => toggleArrayItem('platforms', p)}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tipos de Conteúdo</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {contentTypes.map((ct) => (
                    <Badge
                      key={ct}
                      variant={formData.content_type.includes(ct) ? "default" : "outline"}
                      className={`cursor-pointer ${formData.content_type.includes(ct) ? 'bg-violet-600' : ''}`}
                      onClick={() => toggleArrayItem('content_type', ct)}
                    >
                      {ct}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Nichos Preferidos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {niches.map((n) => (
                    <Badge
                      key={n}
                      variant={formData.niche_required.includes(n) ? "default" : "outline"}
                      className={`cursor-pointer ${formData.niche_required.includes(n) ? 'bg-emerald-600' : ''}`}
                      onClick={() => toggleArrayItem('niche_required', n)}
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prazo de Candidaturas</Label>
                <Input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => handleChange('application_deadline', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Prazo de Entrega *</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Localização (opcional)</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ex: São Paulo, SP ou Nacional"
                className="mt-2"
              />
            </div>

            {/* Remuneration */}
            <div className="space-y-4">
              <div>
                <Label>Tipo de Remuneração *</Label>
                <Select value={formData.remuneration_type} onValueChange={(v) => handleChange('remuneration_type', v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Pagamento em Dinheiro</SelectItem>
                    <SelectItem value="barter">🎁 Permuta (Produtos/Serviços)</SelectItem>
                    <SelectItem value="mixed">📦 Misto (Dinheiro + Permuta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.remuneration_type === 'cash' || formData.remuneration_type === 'mixed') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor Mínimo (R$)</Label>
                    <Input type="number" value={formData.budget_min} onChange={(e) => handleChange('budget_min', e.target.value)} placeholder="500" className="mt-2" />
                  </div>
                  <div>
                    <Label>Valor Máximo (R$)</Label>
                    <Input type="number" value={formData.budget_max} onChange={(e) => handleChange('budget_max', e.target.value)} placeholder="2000" className="mt-2" />
                  </div>
                </div>
              )}

              {(formData.remuneration_type === 'barter' || formData.remuneration_type === 'mixed') && (
                <div className="space-y-4">
                  <div>
                    <Label>Descrição da Permuta</Label>
                    <Textarea value={formData.barter_description} onChange={(e) => handleChange('barter_description', e.target.value)} placeholder="Descreva os produtos/serviços oferecidos..." className="mt-2" />
                  </div>
                  <div>
                    <Label>Valor Estimado (R$)</Label>
                    <Input type="number" value={formData.barter_value} onChange={(e) => handleChange('barter_value', e.target.value)} placeholder="500" className="mt-2" />
                  </div>
                </div>
              )}
            </div>

            {/* Slots & Profile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Vagas</Label>
                <Input type="number" min="1" value={formData.slots_total} onChange={(e) => handleChange('slots_total', e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label>Tamanho Mínimo</Label>
                <Select value={formData.profile_size_min} onValueChange={(v) => handleChange('profile_size_min', v)}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Qualquer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                    <SelectItem value="micro">Micro (10K-50K)</SelectItem>
                    <SelectItem value="mid">Mid (50K-500K)</SelectItem>
                    <SelectItem value="macro">Macro (500K-1M)</SelectItem>
                    <SelectItem value="mega">Mega (1M+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proof Requirements */}
            <div>
              <Label>Como Provar a Entrega *</Label>
              <Textarea
                value={formData.proof_requirements}
                onChange={(e) => handleChange('proof_requirements', e.target.value)}
                placeholder="Ex: Screenshot do post publicado, link do conteúdo, métricas de alcance..."
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Seja específico. Estas regras serão usadas para aprovar ou contestar entregas.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={saving || !formData.title || !formData.description || !formData.deadline}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Campanha'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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