import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, Star, Shield, CheckCircle2, Crown, Eye,
  ChevronUp, ChevronDown, ChevronsUpDown, MapPin
} from 'lucide-react';

function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <button 
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity"
      style={{ color: active ? '#9038fa' : 'var(--text-secondary)' }}
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
  trial: { label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
  legacy: { label: 'Legacy', cls: 'bg-amber-100 text-amber-700' },
  pending: { label: 'Pendente', cls: 'bg-red-100 text-red-700' },
};

export default function UserTable({ users, brands, creators, selectedIds, onSelectIds, onUserClick, sortField, sortDir, onSort, density = 'default' }) {
  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return { profile: brand || creator, type: brand ? 'brand' : creator ? 'creator' : 'unknown' };
  };

  const toggleAll = () => {
    onSelectIds(selectedIds.length === users.length ? [] : users.map(u => u.id));
  };

  const toggleOne = (id) => {
    onSelectIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  const renderSubBadge = (status) => {
    const c = SUB_BADGE[status] || SUB_BADGE.starter;
    return <Badge className={`${c.cls} border-0 text-xs px-2 py-0.5`}>{c.label}</Badge>;
  };

  const compact = density === 'compact';
  const rowPadding = compact ? 'py-2 px-3' : 'py-3 px-4';

  if (users.length === 0) {
    return (
      <Card style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <CardContent className="p-12 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum usuário encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      {/* Desktop Header */}
      <div className="hidden lg:grid lg:grid-cols-[36px_1fr_90px_90px_90px_70px_80px_60px] gap-3 px-4 py-2.5 border-b items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div><Checkbox checked={selectedIds.length === users.length && users.length > 0} onCheckedChange={toggleAll} /></div>
        <SortHeader label="Usuário" field="name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Tipo" field="type" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Plano" field="subscription" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Estado" field="state" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="UF" field="location" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Data" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Ação</span>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {users.map((user) => {
          const { profile, type } = getUserProfile(user.id);
          const isSelected = selectedIds.includes(user.id);
          const location = profile?.state || '';

          return (
            <div key={user.id} className={`${rowPadding} transition-colors hover:bg-black/[0.02] ${isSelected ? 'bg-purple-50/50' : ''}`}>
              {/* Desktop Row */}
              <div className="hidden lg:grid lg:grid-cols-[36px_1fr_90px_90px_90px_70px_80px_60px] gap-3 items-center">
                <div><Checkbox checked={isSelected} onCheckedChange={() => toggleOne(user.id)} /></div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} flex-shrink-0`}>
                    <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                    <AvatarFallback className={`text-[10px] ${type === 'brand' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {type === 'brand' ? <Building2 className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'} truncate`} style={{ color: 'var(--text-primary)' }}>
                        {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                      </p>
                      {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />}
                      {profile?.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                  </Badge>
                </div>
                <div>{renderSubBadge(profile?.subscription_status)}</div>
                <div>
                  <Badge className={`border-0 text-[10px] px-1.5 py-0 ${profile?.account_state === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profile?.account_state === 'ready' ? 'Pronta' : 'Incompleta'}
                  </Badge>
                </div>
                <div>
                  {location && (
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin className="w-2.5 h-2.5" />{location}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(user.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUserClick(user)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Mobile Row */}
              <div className="lg:hidden flex items-center gap-3" onClick={() => onUserClick(user)}>
                <Checkbox checked={isSelected} onCheckedChange={(e) => { e?.stopPropagation?.(); toggleOne(user.id); }} />
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                  <AvatarFallback className={type === 'brand' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}>
                    {type === 'brand' ? <Building2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                    </p>
                    {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500" />}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                    </Badge>
                    {renderSubBadge(profile?.subscription_status)}
                    {profile?.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verificado
                      </Badge>
                    )}
                    {location && (
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin className="w-2.5 h-2.5" />{location}
                      </span>
                    )}
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