import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Loader2 } from 'lucide-react';

export default function DiscoverCommunity() {
  const { user, profile, profileType } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profileType || !profile) return;
    loadData();
  }, [profileType, profile?.id]);

  const loadData = async () => {
    setLoading(true);
    const entity = profileType === 'brand' ? base44.entities.Brand : base44.entities.Creator;
    const data = await entity.filter({ account_state: 'ready' }, '-created_date', 50);
    // Exclude self
    const filtered = data.filter(item => item.user_id !== user?.id && item.id !== profile?.id);
    setItems(filtered);
    setLoading(false);
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
            <CommunityCard key={item.id} item={item} type={profileType} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityCard({ item, type }) {
  if (type === 'brand') {
    return (
      <Card className="hover:shadow-md transition-shadow">
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
    <Card className="hover:shadow-md transition-shadow">
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