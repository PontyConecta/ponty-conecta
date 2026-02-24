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
import PaywallModal from '@/components/PaywallModal';
import CreatorCard from '@/components/CreatorCard';
import { 
  Search,
  Loader2,
  MapPin,
  Users,
  CheckCircle2,
  Star,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  Filter,
  X,
  Instagram
} from 'lucide-react';
import { BRAZIL_STATES, getStateLabel } from '@/components/common/BrazilStateSelect';
import { motion } from 'framer-motion';

export default function DiscoverCreators() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

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
        setIsSubscribed(brands[0].subscription_status === 'premium' || brands[0].subscription_status === 'legacy' || (brands[0].subscription_status === 'trial' && brands[0].trial_end_date && new Date(brands[0].trial_end_date) > new Date()));
      }

      // Buscar apenas criadores com perfil completo
      const allCreators = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date');
      
      // Filtrar criadores com informações básicas preenchidas
      const creatorsWithProfile = allCreators.filter(creator => {
        return creator.avatar_url &&
               creator.bio && 
               creator.niche?.length > 0 && 
               creator.platforms?.length > 0 && 
               creator.location;
      });
      
      setCreators(creatorsWithProfile);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (creator) => {
    setSelectedCreator(creator);
  };

  const handleContact = (creator) => {
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    setSelectedCreator(creator);
  };

  const filteredCreators = creators.filter(c => {
    const matchesSearch = c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = filterNiche === 'all' || c.niche?.includes(filterNiche);
    const matchesSize = filterSize === 'all' || c.profile_size === filterSize;
    const matchesState = filterState === 'all' || c.state === filterState;
    return matchesSearch && matchesNiche && matchesSize && matchesState;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  const getTotalFollowers = (creator) => {
    if (!creator.platforms) return 0;
    return creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  };

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Descobrir Creators</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {filteredCreators.length} {filteredCreators.length === 1 ? 'creator encontrado' : 'creators encontrados'}
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
                placeholder="Buscar por nome ou bio..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-36 flex-shrink-0">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {BRAZIL_STATES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterNiche} onValueChange={setFilterNiche}>
                <SelectTrigger className="w-36 flex-shrink-0">
                  <SelectValue placeholder="Nicho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Nichos</SelectItem>
                  {niches.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="w-36 flex-shrink-0">
                  <SelectValue placeholder="Tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tamanhos</SelectItem>
                  <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                  <SelectItem value="micro">Micro (10K-50K)</SelectItem>
                  <SelectItem value="mid">Mid (50K-500K)</SelectItem>
                  <SelectItem value="macro">Macro (500K-1M)</SelectItem>
                  <SelectItem value="mega">Mega (1M+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creators Grid */}
      {filteredCreators.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <CreatorCard
                creator={creator}
                isSubscribed={isSubscribed}
                onViewProfile={() => handleViewProfile(creator)}
                onContact={() => handleContact(creator)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhum creator encontrado
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Tente ajustar seus filtros
            </p>
          </CardContent>
        </Card>
      )}

      {/* Creator Profile Modal */}
      <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do Criador</DialogTitle>
          </DialogHeader>
          
          {selectedCreator && (
            <div className="space-y-6 py-4">
              {/* Cover & Avatar */}
              <div className="relative">
                <div className="h-32 rounded-xl overflow-hidden" style={{ backgroundColor: '#9038fa' }}>
                  {selectedCreator.cover_image_url && (
                    <img src={selectedCreator.cover_image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <Avatar className="w-24 h-24 absolute -bottom-12 left-6 border-4 border-white shadow-lg">
                  <AvatarImage src={selectedCreator.avatar_url} />
                  <AvatarFallback className="bg-[#9038fa]/10 text-[#9038fa] text-2xl">
                    {selectedCreator.display_name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="pt-10 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCreator.display_name}</h2>
                    {selectedCreator.verified && (
                      <CheckCircle2 className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  {(selectedCreator.state || selectedCreator.location) && (
                    <p className="flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin className="w-4 h-4" />
                      {selectedCreator.city ? `${selectedCreator.city}, ` : ''}{getStateLabel(selectedCreator.state) || selectedCreator.location}
                    </p>
                  )}
                </div>

                {selectedCreator.bio && (
                  <p style={{ color: 'var(--text-secondary)' }}>{selectedCreator.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatFollowers(getTotalFollowers(selectedCreator))}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Seguidores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedCreator.completed_campaigns || 0}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Campanhas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedCreator.on_time_rate || 100}%
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>No Prazo</div>
                  </div>
                </div>

                {/* Niches */}
                {selectedCreator.niche?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Nichos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCreator.niche.map((n, i) => (
                        <Badge key={i} variant="outline">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platforms */}
                {selectedCreator.platforms?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Plataformas</h4>
                    <div className="space-y-2">
                      {selectedCreator.platforms.map((p, i) => {
                        const platformUrls = {
                          'Instagram': `https://instagram.com/${p.handle?.replace('@', '')}`,
                          'TikTok': `https://tiktok.com/@${p.handle?.replace('@', '')}`,
                          'YouTube': `https://youtube.com/@${p.handle?.replace('@', '')}`,
                          'Twitter/X': `https://x.com/${p.handle?.replace('@', '')}`,
                          'LinkedIn': `https://linkedin.com/in/${p.handle?.replace('@', '')}`,
                          'Threads': `https://threads.net/@${p.handle?.replace('@', '')}`,
                          'Pinterest': `https://pinterest.com/${p.handle?.replace('@', '')}`,
                          'Twitch': `https://twitch.tv/${p.handle?.replace('@', '')}`
                        };
                        const url = platformUrls[p.name];
                        return (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                              <span className="text-[#9038fa]">@{p.handle}</span>
                            </div>
                            <Badge variant="outline">{formatFollowers(p.followers || 0)}</Badge>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Portfolio Images */}
                {selectedCreator.portfolio_images?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Portfólio</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCreator.portfolio_images.slice(0, 6).map((url, i) => (
                        <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Rates */}
                {(selectedCreator.rate_cash_min || selectedCreator.rate_cash_max) && (
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <h4 className="font-medium text-emerald-900 mb-1">Faixa de Valores</h4>
                    <p className="text-emerald-700">
                      R$ {selectedCreator.rate_cash_min || 0} - R$ {selectedCreator.rate_cash_max || 0}
                    </p>
                    {selectedCreator.accepts_barter && (
                      <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0">
                        Aceita permutas
                      </Badge>
                    )}
                  </div>
                )}

                {/* Contact - Only for Subscribers */}
                {isSubscribed ? (
                  <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                    <h4 className="font-medium text-purple-900">Contato</h4>
                    {selectedCreator.contact_email && (
                      <a href={`mailto:${selectedCreator.contact_email}`} className="flex items-center gap-2 text-[#9038fa] hover:underline">
                        <Mail className="w-4 h-4" />
                        {selectedCreator.contact_email}
                      </a>
                    )}
                    {selectedCreator.contact_whatsapp && (
                      <a href={`https://wa.me/${selectedCreator.contact_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                        <Phone className="w-4 h-4" />
                        {selectedCreator.contact_whatsapp}
                      </a>
                    )}
                    {selectedCreator.portfolio_url && (
                      <a href={selectedCreator.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#9038fa] hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        Ver Media Kit
                      </a>
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
        description="Assine para entrar em contato direto com criadores."
        feature="Ver email e WhatsApp do criador"
        isAuthenticated={true}
      />
    </div>
  );
}