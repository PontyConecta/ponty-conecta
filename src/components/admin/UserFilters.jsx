import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X, MapPin, Tag, Calendar, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const NICHES = [
  'Moda','Beleza','Fitness','Gastronomia','Viagem','Tecnologia','Lifestyle',
  'Maternidade','Pets','Educação','Finanças','Humor','Música','Games','Saúde'
];

export default function UserFilters({ 
  searchTerm, onSearchChange, 
  roleFilter, onRoleChange, 
  statusFilter, onStatusChange,
  stateFilter, onStateChange,
  nicheFilter, onNicheChange,
  dateFilter, onDateChange,
  verifiedFilter, onVerifiedChange,
  tagFilter, onTagChange,
  excludeFinancialsFilter, onExcludeFinancialsChange,
  availableTags = [],
  // Date-key filters
  createdFrom, onCreatedFromChange,
  createdTo, onCreatedToChange,
  firstActiveFrom, onFirstActiveFromChange,
  firstActiveTo, onFirstActiveToChange,
  noFirstActive, onNoFirstActiveChange,
  lastActiveFrom, onLastActiveFromChange,
  lastActiveTo, onLastActiveToChange,
  noLastActive, onNoLastActiveChange,
  visibilityFilter, onVisibilityChange,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasDateKeys = !!(createdFrom || createdTo || firstActiveFrom || firstActiveTo || noFirstActive || lastActiveFrom || lastActiveTo || noLastActive || (visibilityFilter && visibilityFilter !== 'all'));

  const activeFilterCount = [
    roleFilter !== 'all' ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    stateFilter && stateFilter !== 'all' ? 1 : 0,
    nicheFilter && nicheFilter !== 'all' ? 1 : 0,
    dateFilter && dateFilter !== 'all' ? 1 : 0,
    verifiedFilter && verifiedFilter !== 'all' ? 1 : 0,
    tagFilter && tagFilter !== 'all' ? 1 : 0,
    excludeFinancialsFilter && excludeFinancialsFilter !== 'all' ? 1 : 0,
    hasDateKeys ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleClearAll = () => {
    onRoleChange('all');
    onStatusChange('all');
    onStateChange?.('all');
    onNicheChange?.('all');
    onDateChange?.('all');
    onVerifiedChange?.('all');
    onTagChange?.('all');
    onExcludeFinancialsChange?.('all');
    onSearchChange('');
    onCreatedFromChange?.('');
    onCreatedToChange?.('');
    onFirstActiveFromChange?.('');
    onFirstActiveToChange?.('');
    onNoFirstActiveChange?.(false);
    onLastActiveFromChange?.('');
    onLastActiveToChange?.('');
    onNoLastActiveChange?.(false);
    onVisibilityChange?.('all');
  };

  return (
    <Card className="bg-card border">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Primary filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa, @handle..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={onRoleChange}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="brand">Marcas</SelectItem>
                <SelectItem value="creator">Criadores</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="unknown">Sem Perfil</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="free">Free (Marcas)</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="trial">Em Trial</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 gap-1.5 relative"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-primary text-primary-foreground border-0 text-[10px] h-4 w-4 p-0 flex items-center justify-center absolute -top-1 -right-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* State filter */}
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <Select value={stateFilter || 'all'} onValueChange={onStateChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estados</SelectItem>
                      {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Niche filter (creators only) */}
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <Select value={nicheFilter || 'all'} onValueChange={onNicheChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Nichos</SelectItem>
                      {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verified filter */}
                <Select value={verifiedFilter || 'all'} onValueChange={onVerifiedChange}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Verificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Verificação</SelectItem>
                    <SelectItem value="verified">Verificados</SelectItem>
                    <SelectItem value="not_verified">Não Verificados</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date filter */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <Select value={dateFilter || 'all'} onValueChange={onDateChange}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Cadastro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer Data</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Últimos 30 dias</SelectItem>
                      <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second row: Tag + Exclude financials */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Tag filter */}
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <Select value={tagFilter || 'all'} onValueChange={onTagChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Tags</SelectItem>
                      <SelectItem value="no_tags">Sem Tags</SelectItem>
                      {availableTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exclude from financials filter */}
                <Select value={excludeFinancialsFilter || 'all'} onValueChange={onExcludeFinancialsChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Financeiros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos (Financeiro)</SelectItem>
                    <SelectItem value="excluded">Excluídos</SelectItem>
                    <SelectItem value="included">Incluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date-key filters */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Filtros por Datas-Chave
                </p>

                {/* Created date range */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Criação da conta:</span>
                  <Input type="date" value={createdFrom || ''} onChange={(e) => onCreatedFromChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" placeholder="De" />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input type="date" value={createdTo || ''} onChange={(e) => onCreatedToChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" placeholder="Até" />
                </div>

                {/* First active range */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Primeiro acesso:</span>
                  <Input type="date" value={firstActiveFrom || ''} onChange={(e) => onFirstActiveFromChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" disabled={!!noFirstActive} />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input type="date" value={firstActiveTo || ''} onChange={(e) => onFirstActiveToChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" disabled={!!noFirstActive} />
                  <div className="flex items-center gap-1.5 ml-1">
                    <Checkbox id="noFirstActive" checked={!!noFirstActive} onCheckedChange={(v) => onNoFirstActiveChange?.(!!v)} className="h-3.5 w-3.5" />
                    <Label htmlFor="noFirstActive" className="text-[10px] text-muted-foreground cursor-pointer">Sem primeiro acesso</Label>
                  </div>
                </div>

                {/* Last active range */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0">Último acesso:</span>
                  <Input type="date" value={lastActiveFrom || ''} onChange={(e) => onLastActiveFromChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" disabled={!!noLastActive} />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input type="date" value={lastActiveTo || ''} onChange={(e) => onLastActiveToChange?.(e.target.value)} className="h-8 text-xs w-full sm:w-36" disabled={!!noLastActive} />
                  <div className="flex items-center gap-1.5 ml-1">
                    <Checkbox id="noLastActive" checked={!!noLastActive} onCheckedChange={(v) => onNoLastActiveChange?.(!!v)} className="h-3.5 w-3.5" />
                    <Label htmlFor="noLastActive" className="text-[10px] text-muted-foreground cursor-pointer">Sem último acesso</Label>
                  </div>
                </div>

                {/* Visibility filter */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0 flex items-center gap-1"><Eye className="w-3 h-3" /> Visibilidade:</span>
                  <Select value={visibilityFilter || 'all'} onValueChange={onVisibilityChange}>
                    <SelectTrigger className="w-full sm:w-40 h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="visible">Visíveis</SelectItem>
                      <SelectItem value="hidden">Ocultos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters + clear */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {activeFilterCount} filtro(s) ativo(s)
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500 hover:text-red-600 px-2" onClick={handleClearAll}>
                    <X className="w-3 h-3 mr-1" /> Limpar todos
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}