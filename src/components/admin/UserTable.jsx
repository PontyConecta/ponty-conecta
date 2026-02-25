import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, Star, Shield, CheckCircle2, Crown, Gift, Eye,
  ChevronUp, ChevronDown, ChevronsUpDown, Mail, Calendar
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

export default function UserTable({ users, brands, creators, selectedIds, onSelectIds, onUserClick, sortField, sortDir, onSort }) {
  const getUserProfile = (userId) => {
    const brand = brands.find(b => b.user_id === userId);
    const creator = creators.find(c => c.user_id === userId);
    return { profile: brand || creator, type: brand ? 'brand' : creator ? 'creator' : 'unknown' };
  };

  const toggleAll = () => {
    if (selectedIds.length === users.length) {
      onSelectIds([]);
    } else {
      onSelectIds(users.map(u => u.id));
    }
  };

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectIds(selectedIds.filter(i => i !== id));
    } else {
      onSelectIds([...selectedIds, id]);
    }
  };

  const subscriptionBadge = (status) => {
    const configs = {
      starter: { label: 'Starter', cls: 'bg-slate-100 text-slate-600' },
      premium: { label: 'Premium', cls: 'bg-emerald-100 text-emerald-700' },
      trial: { label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
      legacy: { label: 'Legacy', cls: 'bg-amber-100 text-amber-700' },
      pending: { label: 'Pendente', cls: 'bg-red-100 text-red-700' },
    };
    const c = configs[status] || configs.starter;
    return <Badge className={`${c.cls} border-0 text-[10px] px-1.5 py-0`}>{c.label}</Badge>;
  };

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
      {/* Desktop Table Header */}
      <div className="hidden lg:grid lg:grid-cols-[40px_1fr_120px_100px_100px_100px_80px] gap-4 px-4 py-3 border-b items-center" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <Checkbox checked={selectedIds.length === users.length && users.length > 0} onCheckedChange={toggleAll} />
        </div>
        <SortHeader label="Usuário" field="name" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Tipo" field="type" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Plano" field="subscription" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Estado" field="state" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <SortHeader label="Criado em" field="date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Ação</span>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {users.map((user) => {
          const { profile, type } = getUserProfile(user.id);
          const isSelected = selectedIds.includes(user.id);

          return (
            <div 
              key={user.id}
              className={`px-4 py-3 transition-colors hover:bg-black/[0.02] ${isSelected ? 'bg-purple-50/50' : ''}`}
            >
              {/* Desktop Row */}
              <div className="hidden lg:grid lg:grid-cols-[40px_1fr_120px_100px_100px_100px_80px] gap-4 items-center">
                <div>
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(user.id)} />
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
                    <AvatarFallback className={type === 'brand' ? 'bg-indigo-100 text-indigo-700 text-xs' : 'bg-orange-100 text-orange-700 text-xs'}>
                      {type === 'brand' ? <Building2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {type === 'brand' ? profile?.company_name : profile?.display_name || user.full_name || 'Sem nome'}
                      </p>
                      {user.role === 'admin' && <Shield className="w-3 h-3 text-red-500 flex-shrink-0" />}
                      {profile?.is_verified && <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    {type === 'brand' ? 'Marca' : type === 'creator' ? 'Criador' : '?'}
                  </Badge>
                </div>
                <div>{subscriptionBadge(profile?.subscription_status)}</div>
                <div>
                  <Badge className={`border-0 text-[10px] px-1.5 py-0 ${profile?.account_state === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profile?.account_state === 'ready' ? 'Pronta' : 'Incompleta'}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(user.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onUserClick(user)}>
                    <Eye className="w-4 h-4" />
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
                  <div className="flex items-center gap-1.5">
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
                    {subscriptionBadge(profile?.subscription_status)}
                    {profile?.is_verified && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verificado
                      </Badge>
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