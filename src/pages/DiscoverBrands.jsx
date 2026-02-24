import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import BrandCard from '@/components/BrandCard';
import { 
  Search,
  Loader2,
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Megaphone,
  Instagram,
  Linkedin,
  MapPin
} from 'lucide-react';
import { BRAZIL_STATES, getStateLabel } from '@/components/common/BrazilStateSelect';
import { motion } from 'framer-motion';
import { getPresenceUrl, getPresenceLabel } from '@/components/utils/phoneFormatter';

export default function DiscoverBrands() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const industries = [
    { value: 'fashion', label: 'Moda' },
    { value: 'beauty', label: 'Beleza' },
    { value: 'tech', label: 'Tecnologia' },
    { value: 'food_beverage', label: 'Alimentos' },
    { value: 'health_wellness', label: 'Saúde' },
    { value: 'travel', label: 'Viagens' },
    { value: 'entertainment', label: 'Entretenimento' },
    { value: 'sports', label: 'Esportes' },
  ];

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
        setIsSubscribed(creators[0].subscription_status === 'premium' || creators[0].subscription_status === 'legacy' || (creators[0].subscription_status === 'trial' && creators[0].trial_end_date && new Date(creators[0].trial_end_date) > new Date()));
      }

      // Buscar apenas marcas com perfil completo
      const allBrands = await base44.entities.Brand.filter({ account_state: 'ready' }, '-created_date');
      
      // Filtrar marcas com informações básicas preenchidas
      const brandsWithProfile = allBrands.filter(brand => {
        return brand.logo_url &&
               brand.description && 
               brand.industry && 
               brand.contact_email;
      });
      
      setBrands(brandsWithProfile);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (brand) => {
    setSelectedBrand(brand);
  };

  const handleContact = (brand) => {
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    setSelectedBrand(brand);
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = b.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = filterIndustry === 'all' || b.industry === filterIndustry;
    const matchesState = filterState === 'all' || b.state === filterState;
    return matchesSearch && matchesIndustry && matchesState;
  });

  const industryLabels = {
    fashion: 'Moda',
    beauty: 'Beleza',
    tech: 'Tecnologia',
    food_beverage: 'Alimentos',
    health_wellness: 'Saúde',
    travel: 'Viagens',
    entertainment: 'Entretenimento',
    sports: 'Esportes',
    finance: 'Finanças',
    education: 'Educação',
    retail: 'Varejo',
    automotive: 'Automotivo',
    other: 'Outros'
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
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Descobrir Marcas</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {filteredBrands.length} {filteredBrands.length === 1 ? 'marca encontrada' : 'marcas encontradas'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-40 flex-shrink-0">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {BRAZIL_STATES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                <SelectTrigger className="w-40 flex-shrink-0">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Segmentos</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
          {filteredBrands.map((brand, index) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <BrandCard
                brand={brand}
                isSubscribed={isSubscribed}
                onViewProfile={() => handleViewProfile(brand)}
                onContact={() => handleContact(brand)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma marca encontrada
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tente ajustar seus filtros
            </p>
          </CardContent>
        </Card>
      )}

      {/* Brand Profile Modal */}
      <Dialog open={!!selectedBrand} onOpenChange={() => setSelectedBrand(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil da Marca</DialogTitle>
          </DialogHeader>
          
          {selectedBrand && (
            <div className="space-y-6 py-4">
              {/* Cover & Logo */}
              <div className="relative">
                <div className="h-32 rounded-xl overflow-hidden" style={{ backgroundColor: '#9038fa' }}>
                  {selectedBrand.cover_image_url && (
                    <img src={selectedBrand.cover_image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute -bottom-12 left-6">
                  {selectedBrand.logo_url ? (
                    <img src={selectedBrand.logo_url} alt={selectedBrand.company_name} className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-cover bg-white" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-4 border-white shadow-lg bg-[#9038fa]/10 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-[#9038fa]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="pt-10 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedBrand.company_name}</h2>
                    {selectedBrand.verified && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBrand.industry && (
                      <Badge variant="outline">
                        {industryLabels[selectedBrand.industry] || selectedBrand.industry}
                      </Badge>
                    )}
                    {selectedBrand.state && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedBrand.city ? `${selectedBrand.city}, ` : ''}{getStateLabel(selectedBrand.state)}
                      </Badge>
                    )}
                  </div>
                </div>

                {selectedBrand.description && (
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedBrand.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedBrand.total_campaigns || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Campanhas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {selectedBrand.active_campaigns || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ativas</div>
                  </div>
                </div>

                {/* Target Audience */}
                {selectedBrand.target_audience && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Público-Alvo</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedBrand.target_audience}</p>
                  </div>
                )}

                {/* Content Guidelines */}
                {selectedBrand.content_guidelines && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Diretrizes de Conteúdo</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedBrand.content_guidelines}</p>
                  </div>
                )}

                {/* Contact - Only for Subscribers */}
                {isSubscribed ? (
                  <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                    <h4 className="font-medium text-purple-900">Contato</h4>
                    {selectedBrand.contact_email && (
                      <a href={`mailto:${selectedBrand.contact_email}`} className="flex items-center gap-2 text-[#9038fa] hover:underline">
                        <Mail className="w-4 h-4" />
                        {selectedBrand.contact_email}
                      </a>
                    )}
                    {selectedBrand.contact_phone && (
                      <a href={`tel:${selectedBrand.contact_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-[#9038fa] hover:underline">
                        <Phone className="w-4 h-4" />
                        {selectedBrand.contact_phone}
                      </a>
                    )}
                    {/* Online presences (new format) */}
                    {selectedBrand.online_presences?.length > 0 ? (
                      selectedBrand.online_presences.map((p, idx) => (
                        <a key={idx} href={getPresenceUrl(p)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                          <Globe className="w-4 h-4" />
                          {getPresenceLabel(p)}
                        </a>
                      ))
                    ) : (
                      <>
                        {selectedBrand.website && (
                          <a href={selectedBrand.website.startsWith('http') ? selectedBrand.website : `https://${selectedBrand.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                            <Globe className="w-4 h-4" />
                            Website
                          </a>
                        )}
                        {selectedBrand.social_instagram && (
                          <a href={`https://instagram.com/${selectedBrand.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                            <Instagram className="w-4 h-4" />
                            {selectedBrand.social_instagram.replace('@', '')}
                          </a>
                        )}
                        {selectedBrand.social_linkedin && (
                          <a href={selectedBrand.social_linkedin.startsWith('http') ? selectedBrand.social_linkedin : `https://${selectedBrand.social_linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Assine para ver informações de contato</p>
                    <Button onClick={() => setShowPaywall(true)} className="bg-[#9038fa] hover:bg-[#7a2de0]">
                      Desbloquear Contato
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Contato Premium"
        description="Assine para entrar em contato direto com marcas."
        feature="Ver email e telefone da marca"
        isAuthenticated={true}
      />
    </div>
  );
}