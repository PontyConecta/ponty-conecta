import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  Calendar,
  DollarSign,
  Users,
  Loader2,
  Gift,
  Package,
  MapPin,
  Building2,
  Sparkles,
  Filter,
  Send,
  Crown,
  Instagram,
  Youtube,
  CheckCircle2,
  ExternalLink
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
        
        const apps = await base44.entities.Application.filter({ creator_id: creators[0].id });
        setMyApplications(apps);
      }

      // Load active campaigns
      const campaignsData = await base44.entities.Campaign.filter({ status: 'active' }, '-created_date');
      setCampaigns(campaignsData);

      // Load brands for these campaigns
      const brandIds = [...new Set(campaignsData.map(c => c.brand_id))];
      const brandsData = await Promise.all(brandIds.map(id => 
        base44.entities.Brand.filter({ id })
      ));
      const brandsMap = {};
      brandsData.flat().forEach(b => { brandsMap[b.id] = b; });
      setBrands(brandsMap);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!creator || !selectedCampaign) return;
    
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

      // Increment campaign applications count
      await base44.entities.Campaign.update(selectedCampaign.id, {
        total_applications: (selectedCampaign.total_applications || 0) + 1
      });

      await loadData();
      setSelectedCampaign(null);
      setApplicationMessage('');
      setProposedRate('');
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setApplying(false);
    }
  };

  const hasApplied = (campaignId) => {
    return myApplications.some(a => a.campaign_id === campaignId);
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

  const isExploring = creator?.account_state !== 'active';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-orange-500" />
            Oportunidades
          </h1>
          <p className="text-slate-600 mt-1">
            {filteredCampaigns.length} campanhas disponíveis para você
          </p>
        </div>
      </div>

      {/* Exploring Mode Alert */}
      {isExploring && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Modo Exploração</h3>
                <p className="text-sm text-slate-600">
                  Você pode ver todas as oportunidades, mas precisa assinar para se candidatar.
                </p>
              </div>
              <Link to={createPageUrl('Subscription')}>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Assinar Agora
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou descrição..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-36">
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
                <SelectTrigger className="w-36">
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
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <Card className="h-full hover:shadow-lg transition-all group">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Brand Info */}
                    <div className="flex items-center gap-3 mb-4">
                      {brand?.logo_url ? (
                        <img src={brand.logo_url} alt={brand.company_name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{brand?.company_name || 'Marca'}</h4>
                        {brand?.verified && (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                            Verificada
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Campaign Title & Description */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
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
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
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
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${remuneration.color}`}>
                        <remuneration.icon className="w-4 h-4" />
                        {remuneration.label}
                      </div>
                      
                      {applied ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Candidatado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => !isExploring && setSelectedCampaign(campaign)}
                          disabled={isExploring}
                          className={isExploring ? 'bg-slate-300' : 'bg-orange-500 hover:bg-orange-600'}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Candidatar
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
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma oportunidade encontrada
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterPlatform !== 'all' || filterRemuneration !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Novas campanhas serão adicionadas em breve'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidatar-se à Campanha</DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6 py-4">
              {/* Campaign Summary */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-1">{selectedCampaign.title}</h4>
                <p className="text-sm text-slate-500">
                  {brands[selectedCampaign.brand_id]?.company_name || 'Marca'}
                </p>
              </div>

              {/* Application Form */}
              <div>
                <Label>Sua Mensagem *</Label>
                <Textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  placeholder="Conte por que você é ideal para esta campanha..."
                  className="mt-2 min-h-[120px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Dica: Mencione trabalhos anteriores relevantes e por que você se identifica com a marca.
                </p>
              </div>

              {selectedCampaign.remuneration_type !== 'barter' && (
                <div>
                  <Label>Sua Proposta de Valor (R$)</Label>
                  <Input
                    type="number"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    placeholder={`Ex: ${selectedCampaign.budget_min || 500}`}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Orçamento da marca: R$ {selectedCampaign.budget_min || 0} - {selectedCampaign.budget_max || 0}
                  </p>
                </div>
              )}

              {/* Requirements Preview */}
              {selectedCampaign.requirements && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h5 className="font-medium text-amber-900 mb-2">Requisitos da Campanha</h5>
                  <p className="text-sm text-amber-800">{selectedCampaign.requirements}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                  Cancelar
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}