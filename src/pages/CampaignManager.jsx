import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowRight,
  Gift,
  Package,
  Target,
  MapPin,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CampaignManager() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
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
    proof_requirements: ''
  });

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads'];
  const contentTypes = ['Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Unboxing', 'Reviews'];
  const niches = ['Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde', 'Viagens', 'Gastronomia'];

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
        const campaignsData = await base44.entities.Campaign.filter({ brand_id: brands[0].id }, '-created_date');
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const campaignData = {
        ...formData,
        brand_id: brand.id,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        barter_value: formData.barter_value ? parseFloat(formData.barter_value) : null,
        slots_total: parseInt(formData.slots_total) || 1,
        status: 'draft'
      };

      if (editingCampaign) {
        await base44.entities.Campaign.update(editingCampaign.id, campaignData);
      } else {
        await base44.entities.Campaign.create(campaignData);
      }

      await loadData();
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
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
      proof_requirements: ''
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
      proof_requirements: campaign.proof_requirements || ''
    });
    setIsCreateOpen(true);
  };

  const updateCampaignStatus = async (campaignId, newStatus) => {
    try {
      await base44.entities.Campaign.update(campaignId, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
      under_review: { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700' },
      paused: { label: 'Pausada', color: 'bg-orange-100 text-orange-700' },
      closed: { label: 'Encerrada', color: 'bg-slate-100 text-slate-700' }
    };
    const style = styles[status] || styles.draft;
    return <Badge className={`${style.color} border-0`}>{style.label}</Badge>;
  };

  const getRemunerationIcon = (type) => {
    switch (type) {
      case 'barter': return Gift;
      case 'mixed': return Package;
      default: return DollarSign;
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campanhas</h1>
          <p className="text-slate-600 mt-1">Gerencie suas campanhas de marketing</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => { resetForm(); setIsCreateOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
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
                  <Label>Requisitos e Entregas *</Label>
                  <Textarea
                    value={formData.requirements}
                    onChange={(e) => handleChange('requirements', e.target.value)}
                    placeholder="Liste exatamente o que o criador deve entregar..."
                    className="mt-2 min-h-[80px]"
                  />
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
                  <Label>Prazo Final de Entrega *</Label>
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
                      <Input
                        type="number"
                        value={formData.budget_min}
                        onChange={(e) => handleChange('budget_min', e.target.value)}
                        placeholder="500"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Valor Máximo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.budget_max}
                        onChange={(e) => handleChange('budget_max', e.target.value)}
                        placeholder="2000"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}

                {(formData.remuneration_type === 'barter' || formData.remuneration_type === 'mixed') && (
                  <div className="space-y-4">
                    <div>
                      <Label>Descrição da Permuta</Label>
                      <Textarea
                        value={formData.barter_description}
                        onChange={(e) => handleChange('barter_description', e.target.value)}
                        placeholder="Descreva os produtos/serviços oferecidos..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Valor Estimado da Permuta (R$)</Label>
                      <Input
                        type="number"
                        value={formData.barter_value}
                        onChange={(e) => handleChange('barter_value', e.target.value)}
                        placeholder="500"
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slots & Profile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número de Vagas</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.slots_total}
                    onChange={(e) => handleChange('slots_total', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Tamanho Mínimo do Perfil</Label>
                  <Select value={formData.profile_size_min} onValueChange={(v) => handleChange('profile_size_min', v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
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
                <Label>Como o Criador Deve Provar a Entrega *</Label>
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
                placeholder="Buscar campanhas..."
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="closed">Encerrada</SelectItem>
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
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {campaign.title}
                          </h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.slots_filled || 0}/{campaign.slots_total || 1} vagas
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <RemunerationIcon className="w-4 h-4" />
                            {campaign.remuneration_type === 'cash' && `R$ ${campaign.budget_min || 0} - ${campaign.budget_max || 0}`}
                            {campaign.remuneration_type === 'barter' && 'Permuta'}
                            {campaign.remuneration_type === 'mixed' && 'Misto'}
                          </span>
                          {campaign.total_applications > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {campaign.total_applications} candidaturas
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(campaign)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'active')}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Publicar
                          </Button>
                        )}
                        
                        {campaign.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        
                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            onClick={() => updateCampaignStatus(campaign.id, 'active')}
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Reativar
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
            <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Nenhuma campanha encontrada' 
                : 'Nenhuma campanha criada'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Crie sua primeira campanha para começar a conectar com criadores'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}