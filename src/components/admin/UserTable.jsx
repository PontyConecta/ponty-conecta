import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, Star, Shield, CheckCircle2, Crown, Eye,
  ChevronUp, ChevronDown, ChevronsUpDown, MapPin, EyeOff, Clock
} from 'lucide-react';
import { UserTagBadges } from './UserTagManager';
import UserStatusBadges from './UserStatusBadges';
import UserRowActions from './UserRowActions';

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <button 
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity ${active ? 'text-primary' : 'text-muted-foreground'}`}
      onClick={() => onSort(field)}
    >
      {label}
      {active ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

const SUB_BADGE = {
  starter: { label: 'Starter', cls: 'bg-slate-100 text-slate-600' },
  premium: { label: 'Premium', cls: 'bg-emerald-100 text-emerald-700' },
  trial: { label: 'Trial', cls: 'bg-amber-100 text-amber-700', icon: Clock },
};

export default function UserTable({ users, brands, creators, selectedIds, onSelectIds, onUserClick, sortField, sortDir, onSort, density = 'default', onActionComplete }) {
  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return { profile: brand || creator, type: brand ? 'brand' : creator ? 'creator' : 'unknown' };
  };

  const allPageSelected = users.length > 0 && users.every(u => selectedIds.includes(u.id));
  const somePageSelected = users.some(u => selectedIds.includes(u.id)) && !allPageSelected;

  const toggleAll = () => {
    if (allPageSelected) {
      // Deselect all page users from the current selection
      const pageIds = new Set(users.map(u => u.id));
      onSelectIds(selectedIds.filter(id => !pageIds.has(id)));
    } else {
      // Add all page users to current selection (preserving any other selected)
      const currentSet = new Set(selectedIds);
      users.forEach(u => currentSet.add(u.id));
      onSelectIds([...currentSet]);
    }
  };

  const toggleOne = (id) => {
    onSelectIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  const renderSubBadge = (profile) => {
    const isTrialing = profile?.subscription_status === 'premium' && profile?.trial_end_date && new Date(profile.trial_end_date) > new Date();
    const key = isTrialing ? 'trial' : (profile?.subscription_status || 'starter');
    const c = SUB_BADGE[key] || SUB_BADGE.starter;
    return (
      <Badge className={`${c.cls} border-0 text-xs px-2 py-0.5 gap-1`}>
        {isTrialing && <Clock className="w-3 h-3" />}
        {c.label}
      </Badge>
    );
  };

  const compact = density === 'compact';
  const rowPadding = compact ? 'py-2 px-3' : 'py-3 px-4';

  if (users.length === 0) {
    return (
      <Card className="bg-card border">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border">
      {/* Desktop Header */}
      <div className="hidden lg:grid lg:grid-cols-[36px_1fr_90px_80px_80px_70px_110px_80px_80px_50px] gap-2 px-4 py-3 border-b items-center">
        <div><Checkbox checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} /></div>
        <SortHeader label="Usuário" field="name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Tipo" field="type" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Plano" field="subscription" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Estado" field="state" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="UF" field="location" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
        <SortHeader label="Data" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <span></span>
      </div>

      <div className="divide-y divide-border">
        {users.map((user) => {
          const { profile, type } = getUserProfile(user.id);
          const isSelected = selectedIds.includes(user.id);
          const location = profile?.state || '';

          return (
            <div key={user.id} className={`${rowPadding} transition-colors hover:bg-black/[0.02] ${isSelected ? 'bg-primary/5' : ''}`}>
              {/* Desktop Row */}
              <div className="hidden lg:grid lg:grid-cols-[36px_1fr_90px_80px_80px_70px_110px_80px_80px_50px] gap-2 px-4 items-center">
                <div><Checkbox checked={isSelected} onCheckedChange={() => toggleOne(user.id)} /></div>
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} flex-shrink-0`}>
                    <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                    <AvatarFallback className={`text-[10px] ${type === 'brand' ? 'bg-muted text-muted-foreground' : 'bg-orange-100 text-orange-700'}`}>
                      {type === 'brand' ? <Building2 className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate text-foreground`}>
                        {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                      </p>
                      {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />}
                      {profile?.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                      {user.exclude_from_financials && <EyeOff className="w-3 h-3 text-orange-500 flex-shrink-0" title="Excluído dos financeiros" />}
                    </div>
                    <p className="text-xs truncate text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                    {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                  </Badge>
                </div>
                <div>{renderSubBadge(profile)}</div>
                <div>
                  <Badge className={`border-0 text-[10px] px-1.5 py-0 ${profile?.account_state === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profile?.account_state === 'ready' ? 'Pronta' : 'Incompleta'}
                  </Badge>
                </div>
                <div>
                  {location && (
                    <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                      <MapPin className="w-3 h-3" />{location}
                    </span>
                  )}
                </div>
                <div>
                  <UserStatusBadges user={user} profile={profile} maxShow={2} />
                </div>
                <div>
                  <UserTagBadges tags={user.tags} size="xs" maxShow={2} />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(user.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <UserRowActions user={user} profile={profile} onView={() => onUserClick(user)} onActionComplete={onActionComplete} />
                </div>
              </div>

              {/* Mobile Row */}
              <div className="lg:hidden flex items-center gap-3" onClick={() => onUserClick(user)}>
                <Checkbox checked={isSelected} onCheckedChange={(e) => { e?.stopPropagation?.(); toggleOne(user.id); }} />
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                  <AvatarFallback className={type === 'brand' ? 'bg-muted text-muted-foreground' : 'bg-orange-100 text-orange-700'}>
                    {type === 'brand' ? <Building2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm truncate text-foreground">
                      {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                    </p>
                    {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500" />}
                  </div>
                  <p className="text-xs truncate text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                    </Badge>
                    {renderSubBadge(profile)}
                    <UserStatusBadges user={user} profile={profile} maxShow={2} />
                    {profile?.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verificado
                      </Badge>
                    )}
                    {location && (
                      <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />{location}
                      </span>
                    )}
                    <UserTagBadges tags={user.tags} size="xs" maxShow={2} />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}