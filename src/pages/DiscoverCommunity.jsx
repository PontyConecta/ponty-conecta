import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BrandProfileModal from '@/components/modals/BrandProfileModal';
import CreatorProfileModal from '@/components/modals/CreatorProfileModal';
import PaywallModal from '@/components/PaywallModal';

const formatFollowers = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

const getTotalFollowers = (creator) => {
  return (creator.platforms || []).reduce((sum, p) => sum + (p.followers || 0), 0);
};

export default function DiscoverCommunity() {
  const { user, profile, profileType } = useAuth();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!profileType || !profile) return;
    loadData();
  }, [profileType, profile?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (profileType === 'creator') {
        // Creator sees brands — enrich with campaign counts
        const [data, allCampaigns] = await Promise.all([
          base44.entities.Brand.filter({ account_state: 'ready' }, '-created_date', 50),
          base44.entities.Campaign.filter({}, '-created_date', 1000),
        ]);
        const totalMap = {};
        const activeMap = {};
        allCampaigns.forEach(c => {
          if (c.brand_id) {
            totalMap[c.brand_id] = (totalMap[c.brand_id] || 0) + 1;
            if (c.status === 'active') activeMap[c.brand_id] = (activeMap[c.brand_id] || 0) + 1;
          }
        });
        const filtered = data.filter(item => item.user_id !== user?.id && item.id !== profile?.id);
        setItems(filtered.map(b => ({
          ...b,
          total_campaigns: totalMap[b.id] || 0,
          active_campaigns: activeMap[b.id] || 0,
        })));
      } else {
        // Brand sees creators — no enrichment needed
        const data = await base44.entities.Creator.filter({ account_state: 'ready' }, '-created_date', 50);
        setItems(data.filter(item => item.user_id !== user?.id && item.id !== profile?.id));
      }
    } catch (error) {
      console.error('Error loading community:', error);
      toast.error('Erro ao carregar comunidade. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (profileType === 'brand') {
      return item.company_name?.toLowerCase().includes(term) || item.industry?.toLowerCase().includes(term);
    }
    return item.display_name?.toLowerCase().includes(term) || item.niche?.some(n => n.toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = profileType === 'brand' ? 'Comunidade de Marcas' : 'Comunidade de Criadores';
  const emptyMsg = profileType === 'brand'
    ? 'Nenhuma outra marca encontrada na comunidade ainda.'
    : 'Nenhum outro criador encontrado na comunidade ainda.';

  const handleMessage = (item) => {
    setSelectedItem(null);
    const name = profileType === 'brand' ? item.company_name : item.display_name;
    navigate(
      createPageUrl('InboxThread') + `?recipientId=${item.user_id}&recipientName=${encodeURIComponent(name || '')}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">{searchTerm ? 'Nenhum resultado encontrado' : emptyMsg}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <CommunityCard key={item.id} item={item} type={profileType} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="Recurso Premium"
        description="Assine para desbloquear contato direto, redes sociais e valores."
        feature="Perfil completo"
        isAuthenticated={true}
      />

      {/* Profile Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {profileType === 'brand' ? 'Perfil da Marca' : 'Perfil do Criador'}
              </DialogTitle>
            </DialogHeader>
            {profileType === 'brand' ? (
              <BrandProfileModal
                brand={selectedItem}
                isSubscribed={isSubscribed}
                onPaywall={() => setShowPaywall(true)}
                onMessage={handleMessage}
              />
            ) : (
              <CreatorProfileModal
                creator={selectedItem}
                isSubscribed={isSubscribed}
                formatFollowers={formatFollowers}
                getTotalFollowers={getTotalFollowers}
                onPaywall={() => setShowPaywall(true)}
                onMessage={handleMessage}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CommunityCard({ item, type, onClick }) {
  if (type === 'brand') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {item.logo_url ? (
              <img src={item.logo_url} alt={item.company_name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-lg font-bold text-muted-foreground">{item.company_name?.[0]}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate text-foreground">{item.company_name || 'Marca'}</p>
              {item.industry && <p className="text-xs text-muted-foreground">{item.industry}</p>}
              {item.state && <p className="text-xs text-muted-foreground">{item.city ? `${item.city}, ${item.state}` : item.state}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.display_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg font-bold text-muted-foreground">{item.display_name?.[0]}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate text-foreground">{item.display_name || 'Criador'}</p>
            {item.niche?.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">{item.niche.slice(0, 3).join(', ')}</p>
            )}
            {item.state && <p className="text-xs text-muted-foreground">{item.city ? `${item.city}, ${item.state}` : item.state}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}