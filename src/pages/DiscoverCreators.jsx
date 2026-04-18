import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PaywallModal from '@/components/PaywallModal';
import DiscoverCreatorCard from '@/components/cards/DiscoverCreatorCard';
import CategoryChips from '@/components/discover/CategoryChips';
import HorizontalSection from '@/components/discover/HorizontalSection';
import CreatorProfileModal from '@/components/modals/CreatorProfileModal';
import {
  Search, Loader2, Users, Filter, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import InviteCreatorModal from '@/components/modals/InviteCreatorModal';
import { BRAZIL_STATES } from '@/components/common/BrazilStateSelect';
import { isProfileSubscribed } from '@/components/utils/subscriptionUtils';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

const NICHES = [
  { value: 'Moda', label: 'Moda' },
  { value: 'Beleza', label: 'Beleza' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Gastronomia', label: 'Gastronomia' },
  { value: 'Games', label: 'Games' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Viagens', label: 'Viagens' },
  { value: 'Negócios', label: 'Negócios' },
  { value: 'Esportes', label: 'Esportes' },
  { value: 'Educação', label: 'Educação' },
  { value: 'Casa & Decoração', label: 'Casa & Decoração' },
  { value: 'Maternidade', label: 'Maternidade' },
  { value: 'Sustentabilidade', label: 'Sustentabilidade' },
  { value: 'Culinária', label: 'Culinária' },
  { value: 'Espiritualidade', label: 'Espiritualidade' },
  { value: 'Automotivo', label: 'Automotivo' },
];

import { CREATOR_TYPE_OPTIONS } from '@/components/utils/creatorTypeConfig';

export default function DiscoverCreators() {
  const { user, profile: authProfile, profileType } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const isSubscribed = profileType === 'brand' ? true : (authProfile ? isProfileSubscribed(authProfile) : false);

  const handleCreatorClick = (creator) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'view_content',
      content_name: creator.display_name,
      content_category: creator.niche?.[0]
    });
    setSelectedCreator(creator);
  };
  const isAdmin = user?.role === 'admin';
  const isBrand = profileType === 'brand';
  const navigate = useNavigate();
  const [inviteTarget, setInviteTarget] = useState(null);
  const [brandCampaigns, setBrandCampaigns] = useState([]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (isBrand && authProfile) {
      base44.entities.Campaign.filter({ brand_id: authProfile.id }, '-created_date', 50).then(setBrandCampaigns);
    }
  }, [isBrand, authProfile?.id]);

  const handleInvite = (creator) => {
    if (!isSubscribed) { setShowPaywall(true); return; }
    setInviteTarget(creator);
  };

  const PAGE_SIZE = 100;

  const loadData = async () => {
    try {
      const batch = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date', PAGE_SIZE);
      setCreators(batch.filter(c => c.display_name?.trim()));
      setHasMore(batch.length >= PAGE_SIZE);
      setOffset(PAGE_SIZE);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast.error('Erro ao carregar criadoras. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const batch = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date', PAGE_SIZE, offset);
      const valid = batch.filter(c => c.display_name?.trim());
      setCreators(prev => [...prev, ...valid]);
      setOffset(prev => prev + PAGE_SIZE);
      if (batch.length < PAGE_SIZE) setHasMore(false);
    } catch (error) {
      console.error('Error loading more creators:', error);
      toast.error('Erro ao carregar mais criadoras.');
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Ranking tier logic ──
  // Tier 1 (score 3): valid avatar + bio + portfolio → display-ready
  // Tier 2 (score 2): valid avatar only → present but minimal
  // Tier 3 (score 1): no/invalid avatar → placeholder/fallback
  const hasValidAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const t = url.trim();
    if (!t.startsWith('https://')) return false;
    // Must have a path beyond just the domain
    try { return new URL(t).pathname.length > 1; } catch { return false; }
  };

  const getCreatorRankScore = (c) => {
    if (!hasValidAvatarUrl(c.avatar_url)) return 1; // Tier 3 — fallback/placeholder
    const hasBio = c.bio && c.bio.trim().length > 10;
    const hasPortfolio = c.portfolio_images && c.portfolio_images.length > 0;
    if (hasBio && hasPortfolio) return 3; // Tier 1 — display-ready
    return 2; // Tier 2 — avatar present, profile minimal
  };

  const isTopEligible = (c) => getCreatorRankScore(c) >= 2;

  const rankSort = (a, b) => {
    const diff = getCreatorRankScore(b) - getCreatorRankScore(a);
    if (diff !== 0) return diff;
    return new Date(b.created_date) - new Date(a.created_date);
  };

  const visibleCreators = useMemo(() => {
    if (isAdmin) return creators;
    return creators.filter(c => !c.is_hidden);
  }, [creators, isAdmin]);

  const filteredCreators = useMemo(() => {
    const filtered = visibleCreators.filter(c => {
      const matchSearch = !searchTerm || c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchNiche = filterNiche === 'all' || c.niche?.includes(filterNiche);
      const matchSize = filterSize === 'all' || c.profile_size === filterSize;
      const matchState = filterState === 'all' || c.state === filterState;
      const matchType = filterType === 'all' || (c.creator_type || 'ugc') === filterType;
      return matchSearch && matchNiche && matchSize && matchState && matchType;
    });
    return filtered.sort(rankSort);
  }, [visibleCreators, searchTerm, filterNiche, filterSize, filterState, filterType]);

  const featuredCreators = useMemo(() =>
    [...visibleCreators.filter(c => c.featured && isTopEligible(c))].sort(rankSort),
  [visibleCreators]);

  const newCreators = useMemo(() =>
    [...visibleCreators].filter(isTopEligible).sort(rankSort).slice(0, 12),
  [visibleCreators]);

  const nicheCreators = useMemo(() => {
    if (filterNiche === 'all') return [];
    return [...visibleCreators.filter(c => c.niche?.includes(filterNiche) && isTopEligible(c))].sort(rankSort).slice(0, 10);
  }, [visibleCreators, filterNiche]);

  const showSections = filterNiche === 'all' && !searchTerm && filterSize === 'all' && filterState === 'all';

  const sectionIds = useMemo(() => {
    if (!showSections) return new Set();
    const ids = new Set();
    featuredCreators.forEach(c => ids.add(c.id));
    newCreators.forEach(c => ids.add(c.id));
    return ids;
  }, [showSections, featuredCreators, newCreators]);

  const gridCreators = useMemo(() => {
    if (!showSections) return filteredCreators;
    return filteredCreators.filter(c => !sectionIds.has(c.id));
  }, [filteredCreators, sectionIds, showSections]);

  const formatFollowers = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const getTotalFollowers = (creator) => (creator.platforms || []).reduce((s, p) => s + (p.followers || 0), 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Descobrir Creators</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Explore criadoras de conteúdo</p>
      </div>

      <CategoryChips categories={NICHES} value={filterNiche} onChange={setFilterNiche} />

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou bio..." className="pl-9 h-9 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={() => setShowAdvanced(!showAdvanced)}>
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {BRAZIL_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSize} onValueChange={setFilterSize}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tamanho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nano">Nano</SelectItem>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="mid">Mid</SelectItem>
              <SelectItem value="macro">Macro</SelectItem>
              <SelectItem value="mega">Mega</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {CREATOR_TYPE_OPTIONS.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <span aria-hidden="true">{t.emoji}</span>{' '}{t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterState !== 'all' || filterSize !== 'all' || filterType !== 'all') && (
            <Button variant="ghost" size="sm" className="h-8 text-xs"
              onClick={() => { setFilterState('all'); setFilterSize('all'); setFilterType('all'); }}>
              <X className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
      )}

      {showSections && (
        <div className="space-y-6">
          {featuredCreators.length > 0 && (
            <HorizontalSection title="Em destaque">
              {featuredCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                    onClick={() => handleCreatorClick(c)}
                    showInvite={isBrand && isSubscribed} onInvite={handleInvite} />
                </div>
              ))}
            </HorizontalSection>
          )}
          {newCreators.length > 0 && (
            <HorizontalSection title="Novas criadoras">
              {newCreators.map(c => (
                <div key={c.id} className="w-[160px] flex-shrink-0">
                  <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                    onClick={() => handleCreatorClick(c)}
                    showInvite={isBrand && isSubscribed} onInvite={handleInvite} />
                </div>
              ))}
            </HorizontalSection>
          )}
        </div>
      )}

      {filterNiche !== 'all' && nicheCreators.length > 0 && showSections && (
        <HorizontalSection title={filterNiche}>
          {nicheCreators.map(c => (
            <div key={c.id} className="w-[160px] flex-shrink-0">
              <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                onClick={() => handleCreatorClick(c)}
                showInvite={isBrand && isSubscribed} onInvite={handleInvite} />
            </div>
          ))}
        </HorizontalSection>
      )}

      {(() => {
        const displayCreators = showSections ? gridCreators : filteredCreators;
        if (showSections && displayCreators.length === 0 && visibleCreators.length > 0) return null;
        return (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">
              {showSections ? 'Todos os creators' : 'Resultados'}
            </h2>
            {displayCreators.length > 0 ? (
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                initial="hidden" animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {displayCreators.map(c => (
                  <motion.div key={c.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
                    <DiscoverCreatorCard creator={c} isSubscribed={isSubscribed}
                      onClick={() => handleCreatorClick(c)}
                      showInvite={isBrand && isSubscribed} onInvite={handleInvite} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <Card className="border bg-card">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Nenhum creator encontrado</h3>
                  <p className="text-sm text-muted-foreground">Tente ajustar seus filtros</p>
                </CardContent>
              </Card>
            )}
            {showSections && hasMore && displayCreators.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Ver mais criadoras
                </Button>
              </div>
            )}
          </div>
        );
      })()}

      <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Perfil do Creator</DialogTitle></DialogHeader>
          {selectedCreator && (
            <CreatorProfileModal
              creator={selectedCreator}
              isSubscribed={isSubscribed}
              formatFollowers={formatFollowers}
              getTotalFollowers={getTotalFollowers}
              onPaywall={() => setShowPaywall(true)}
              onMessage={(c) => {
                setSelectedCreator(null);
                navigate(createPageUrl('InboxThread') + `?recipientId=${c.user_id}&recipientName=${encodeURIComponent(c.display_name || 'Criadora')}`);
              }}
              onInvite={isBrand ? (c) => {
                setSelectedCreator(null);
                handleInvite(c);
              } : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)}
        title="Contato Premium" description="Assine para desbloquear contato direto com criadoras."
        feature="Ver email e WhatsApp" isAuthenticated={true} />

      {inviteTarget && (
        <InviteCreatorModal
          open={!!inviteTarget}
          onClose={() => setInviteTarget(null)}
          creator={inviteTarget}
          campaigns={brandCampaigns}
        />
      )}
    </div>
  );
}