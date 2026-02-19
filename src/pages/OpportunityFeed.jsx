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
import PaywallModal from '@/components/PaywallModal';
import ProfileIncompleteAlert from '@/components/ProfileIncompleteAlert';
import { validateCreatorProfile } from '@/components/utils/profileValidation';
import { toast } from 'sonner';
import { 
  Search,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  Gift,
  Package,
  MapPin,
  Building2,
  Sparkles,
  Send,
  Crown,
  CheckCircle2,
  Eye,
  Hash,
  AtSign,
  ListChecks,
  Ban
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OpportunityFeed() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [brands, setBrands] = useState({});
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterRemuneration, setFilterRemuneration] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [profileValidation, setProfileValidation] = useState({ isComplete: true, missingFields: [] });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        setCreator(creators[0]);
        setIsSubscribed(creators[0].subscription_status === 'premium' || creators[0].subscription_status === 'legacy');
        
        // Validar completude do perfil
        const validation = validateCreatorProfile(creators[0]);
        setProfileValidation(validation);
        
        const apps = await base44.entities.Application.filter({ creator_id: creators[0].id });
        setMyApplications(apps);
      }

      // Load active campaigns
      const campaignsData = await base44.entities.Campaign.filter({ status: 'active' }, '-created_date');
      setCampaigns(campaignsData);

      // Load brands in batch for better performance
      const brandIds = [...new Set(campaignsData.map(c => c.brand_id))];
      if (brandIds.length > 0) {
        const allBrands = await base44.entities.Brand.list();
        const brandsMap = {};
        allBrands.filter(b => brandIds.includes(b.id)).forEach(b => { brandsMap[b.id] = b; });
        setBrands(brandsMap);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async (e) => {
    const startY = e.touches[0].clientY;
    
    const handleMove = (e) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100 && window.scrollY === 0 && !refreshing) {
        setRefreshing(true);
        loadData(true);
        document.removeEventListener('touchmove', handleMove);
      }
    };
    
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', () => {
      document.removeEventListener('touchmove', handleMove);
    }, { once: true });
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleRefresh);
    return () => document.removeEventListener('touchstart', handleRefresh);
  }, [refreshing]);

  const handleApply = async () => {
    if (!creator || !selectedCampaign) return;
    
    // Verificar se o perfil está completo
    if (!profileValidation.isComplete) {
      toast.error('Complete seu perfil antes de se candidatar', {
        description: 'Preencha os campos obrigatórios no seu perfil'
      });
      return;
    }
    
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    
    setApplying(true);
    try {
      await base44.entities.Application.create({
        campaign_id: selectedCampaign.id,
        creator_id: creator.id,
        brand_id: selectedCampaign.brand_id,
        message: applicationMessage,
        proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
        status: 'pending'
      });

      await base44.entities.Campaign.update(selectedCampaign.id, {
        total_applications: (selectedCampaign.total_applications || 0) + 1
      });

      await loadData();
      setSelectedCampaign(null);
      setApplicationMessage('');
      setProposedRate('');
      setViewingDetails(false);
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setApplying(false);
    }
  };

  const hasApplied = (campaignId) => {
    return myApplications.some(a => a.campaign_id === campaignId);
  };

  const openCampaignDetails = (campaign) => {
    setSelectedCampaign(campaign);
    setViewingDetails(true);
  };

  const startApplication = () => {
    // Verificar se o perfil está completo
    if (!profileValidation.isComplete) {
      toast.error('Complete seu perfil antes de se candidatar', {
        description: 'Preencha os campos obrigatórios no seu perfil'
      });
      return;
    }
    
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    setViewingDetails(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || c.platforms?.includes(filterPlatform);
    const matchesRemuneration = filterRemuneration === 'all' || c.remuneration_type === filterRemuneration;
    return matchesSearch && matchesPlatform && matchesRemuneration;
  });

  const getRemunerationLabel = (type, campaign) => {
    switch (type) {
      case 'barter':
        return { icon: Gift, label: 'Permuta', color: 'text-pink-600 bg-pink-50' };
      case 'mixed':
        return { icon: Package, label: 'Misto', color: 'text-violet-600 bg-violet-50' };
      default:
        return { 
          icon: DollarSign, 
          label: `R$ ${campaign.budget_min || 0} - ${campaign.budget_max || 0}`,
          color: 'text-emerald-600 bg-emerald-50'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-full shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: 'var(--accent-primary)' }} />
            Campanhas
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filteredCampaigns.length} campanhas disponíveis
          </p>
        </div>
      </div>

      {/* Profile Incomplete Alert */}
      {!profileValidation.isComplete && (
        <ProfileIncompleteAlert 
          missingFields={profileValidation.missingFields} 
          profileType="creator"
        />
      )}

      {/* Subscription Banner */}
      {!isSubscribed && profileValidation.isComplete && (
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Modo Exploração</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Você pode ver as campanhas, mas precisa assinar para se candidatar.
                </p>
              </div>
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowPaywall(true)}
              >
                Assinar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou descrição..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-32 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Plataforma</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRemuneration} onValueChange={setFilterRemuneration}>
                <SelectTrigger className="w-32 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Pagamento</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="barter">Permuta</SelectItem>
                  <SelectItem value="mixed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredCampaigns.map((campaign, index) => {
            const brand = brands[campaign.brand_id];
            const remuneration = getRemunerationLabel(campaign.remuneration_type, campaign);
            const applied = hasApplied(campaign.id);

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} onClick={() => openCampaignDetails(campaign)}>
                  {/* Cover */}
                  {campaign.cover_image_url && (
                    <div className="h-32 overflow-hidden">
                      <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  
                  <CardContent className="p-4 lg:p-6 flex flex-col h-full">
                    {/* Brand Info */}
                    <div className="flex items-center gap-3 mb-4">
                      {brand?.logo_url ? (
                        <img src={brand.logo_url} alt={brand.company_name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          <Building2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{brand?.company_name || 'Marca'}</h4>
                        {brand?.verified && (
                          <Badge variant="outline" className="text-xs" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--accent-primary)' }}>
                            Verificada
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Campaign Title & Description */}
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {campaign.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {campaign.description}
                    </p>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {campaign.platforms?.slice(0, 3).map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {campaign.platforms?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{campaign.platforms.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-3 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.slots_filled || 0}/{campaign.slots_total || 1}
                      </span>
                      {campaign.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {campaign.location}
                        </span>
                      )}
                    </div>

                    {/* Remuneration & Action */}
                    <div className="flex items-center justify-between pt-4" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${remuneration.color}`}>
                        <remuneration.icon className="w-4 h-4" />
                        {remuneration.label}
                      </div>
                      
                      {applied ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Candidatado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openCampaignDetails(campaign); }}
                          className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md transition-all"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border-color)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma campanha encontrada
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || filterPlatform !== 'all' || filterRemuneration !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Novas campanhas serão adicionadas em breve'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Details / Application Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => { setSelectedCampaign(null); setViewingDetails(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto pb-safe" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>
              {viewingDetails ? 'Detalhes da Campanha' : 'Candidatar-se à Campanha'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6 py-4">
              {viewingDetails ? (
                        // Campaign Details View
                        <>
                          {/* Cover */}
                          {selectedCampaign.cover_image_url && (
                            <div className="h-40 rounded-xl overflow-hidden">
                              <img src={selectedCampaign.cover_image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Brand & Title */}
                          <div className="flex items-center gap-4">
                            {brands[selectedCampaign.brand_id]?.logo_url ? (
                              <img src={brands[selectedCampaign.brand_id].logo_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                            ) : (
                              <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <Building2 className="w-7 h-7" style={{ color: 'var(--text-secondary)' }} />
                              </div>
                            )}
                            <div>
                              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCampaign.title}</h2>
                              <p style={{ color: 'var(--text-secondary)' }}>{brands[selectedCampaign.brand_id]?.company_name}</p>
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Descrição</h4>
                            <p style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.description}</p>
                          </div>

                          {/* Target Audience */}
                          {selectedCampaign.target_audience && (
                            <div>
                              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Público-Alvo</h4>
                              <p style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.target_audience}</p>
                            </div>
                          )}

                          {/* Requirements */}
                          {selectedCampaign.requirements && (
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Requisitos e Entregas</h4>
                              <p style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.requirements}</p>
                            </div>
                          )}

                          {/* Content Guidelines */}
                          {selectedCampaign.content_guidelines && (
                            <div>
                              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Diretrizes de Conteúdo</h4>
                              <p style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.content_guidelines}</p>
                            </div>
                          )}

                  {/* Do's and Don'ts */}
                  {(selectedCampaign.dos?.length > 0 || selectedCampaign.donts?.length > 0) && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedCampaign.dos?.filter(d => d).length > 0 && (
                        <div className="p-4 bg-emerald-50 rounded-xl">
                          <h4 className="font-medium text-emerald-900 mb-2 flex items-center gap-2">
                            <ListChecks className="w-4 h-4" />
                            O que FAZER
                          </h4>
                          <ul className="space-y-1">
                            {selectedCampaign.dos.filter(d => d).map((item, i) => (
                              <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedCampaign.donts?.filter(d => d).length > 0 && (
                        <div className="p-4 bg-red-50 rounded-xl">
                          <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                            <Ban className="w-4 h-4" />
                            O que NÃO FAZER
                          </h4>
                          <ul className="space-y-1">
                            {selectedCampaign.donts.filter(d => d).map((item, i) => (
                              <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                <Ban className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hashtags & Mentions */}
                  {(selectedCampaign.hashtags?.filter(h => h).length > 0 || selectedCampaign.mentions?.filter(m => m).length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.hashtags?.filter(h => h).map((tag, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-700 border-0">
                          <Hash className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {selectedCampaign.mentions?.filter(m => m).map((mention, i) => (
                        <Badge key={i} className="bg-violet-100 text-violet-700 border-0">
                          <AtSign className="w-3 h-3 mr-1" />
                          {mention}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Platforms & Content Types */}
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.platforms?.map((p, i) => (
                      <Badge key={i} variant="outline">{p}</Badge>
                    ))}
                    {selectedCampaign.content_type?.map((ct, i) => (
                      <Badge key={i} variant="outline" className="bg-slate-50">{ct}</Badge>
                    ))}
                  </div>

                  {/* Remuneration */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Remuneração</h4>
                    {selectedCampaign.remuneration_type === 'cash' && (
                       <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                         R$ {selectedCampaign.budget_min || 0} - {selectedCampaign.budget_max || 0}
                       </p>
                     )}
                    {selectedCampaign.remuneration_type === 'barter' && (
                      <div>
                        <Badge className="bg-pink-100 text-pink-700 border-0 mb-2">Permuta</Badge>
                        {selectedCampaign.barter_description && (
                          <p style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.barter_description}</p>
                        )}
                        {selectedCampaign.barter_value && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Valor estimado: R$ {selectedCampaign.barter_value}</p>
                        )}
                      </div>
                    )}
                    {selectedCampaign.remuneration_type === 'mixed' && (
                      <div>
                        <Badge className="bg-violet-100 text-violet-700 border-0 mb-2">Misto</Badge>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          R$ {selectedCampaign.budget_min || 0} - {selectedCampaign.budget_max || 0} + Permuta
                        </p>
                        {selectedCampaign.barter_description && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{selectedCampaign.barter_description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSelectedCampaign(null)} className="flex-1">
                      Fechar
                    </Button>
                    {!hasApplied(selectedCampaign.id) && (
                      <Button onClick={startApplication} className="flex-1 bg-orange-500 hover:bg-orange-600">
                        <Send className="w-4 h-4 mr-2" />
                        Candidatar-se
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                // Application Form View
                  <>
                    {/* Campaign Summary */}
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{selectedCampaign.title}</h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {brands[selectedCampaign.brand_id]?.company_name || 'Marca'}
                      </p>
                    </div>

                  {/* Application Form */}
                  <div>
                    <Label style={{ color: 'var(--text-primary)' }}>Sua Mensagem *</Label>
                    <Textarea
                      value={applicationMessage}
                      onChange={(e) => setApplicationMessage(e.target.value)}
                      placeholder="Conte por que você é ideal para esta campanha..."
                      className="mt-2 min-h-[120px]"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Dica: Mencione trabalhos anteriores relevantes e por que você se identifica com a marca.
                    </p>
                  </div>

                  {selectedCampaign.remuneration_type !== 'barter' && (
                    <div>
                      <Label style={{ color: 'var(--text-primary)' }}>Sua Proposta de Valor (R$)</Label>
                      <Input
                        type="number"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        placeholder={`Ex: ${selectedCampaign.budget_min || 500}`}
                        className="mt-2"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Orçamento da marca: R$ {selectedCampaign.budget_min || 0} - {selectedCampaign.budget_max || 0}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
                    <Button variant="outline" onClick={() => setViewingDetails(true)}>
                      Voltar
                    </Button>
                    <Button
                      onClick={handleApply}
                      disabled={applying || !applicationMessage}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {applying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Candidatura
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Recurso Premium"
        description="Você precisa de uma assinatura ativa para se candidatar a campanhas."
        feature="Candidaturas ilimitadas"
        isAuthenticated={true}
      />
    </div>
  );
}