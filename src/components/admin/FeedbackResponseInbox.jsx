import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare, Search, Download, Upload,
  Loader2, Filter, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import FeedbackImportDialog from './FeedbackImportDialog';

const STATUS_CFG = {
  new: { label: 'Novo', cls: 'bg-blue-100 text-blue-700' },
  triaged: { label: 'Triado', cls: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'Em progresso', cls: 'bg-amber-100 text-amber-700' },
  shipped: { label: 'Entregue', cls: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Fechado', cls: 'bg-zinc-100 text-zinc-500' },
};

const PRIORITY_CFG = {
  low: { label: 'Baixa', cls: 'bg-slate-100 text-slate-600' },
  med: { label: 'Média', cls: 'bg-amber-100 text-amber-700' },
  high: { label: 'Alta', cls: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

const CATEGORY_CFG = {
  onboarding: 'Onboarding', ux: 'UX', bugs: 'Bugs', performance: 'Performance',
  monetization: 'Monetização', campaigns: 'Campanhas', other: 'Outro',
};

const EXPERIENCE_LABELS = {
  love: { num: '5', label: 'Muito boa' },
  good: { num: '4', label: 'Boa' },
  neutral: { num: '3', label: 'Regular' },
  confused: { num: '2', label: 'Difícil' },
  hard: { num: '1', label: 'Muito difícil' },
};

const RECOMMEND_LABELS = { yes: 'Sim', maybe: 'Talvez', no: 'Não' };

export default function FeedbackResponseInbox() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({ status: 'all', priority: 'all', category: 'all', experience_rating: 'all', recommend_ponty: 'all', search: '' });
  const [selectedFb, setSelectedFb] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const cleanFilters = {};
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') cleanFilters[k] = v; });

    const res = await base44.functions.invoke('adminFeedbackResponses', { mode: 'list', filters: cleanFilters, page, pageSize: 30 });
    setRows(res.data?.rows || []);
    setTotal(res.data?.total || 0);
    setFacets(res.data?.facets || {});
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [page, filters.status, filters.priority, filters.category, filters.experience_rating, filters.recommend_ponty]);

  const handleSearch = (e) => { if (e.key === 'Enter') loadData(); };

  const openDetail = (fb) => {
    setSelectedFb(fb);
    setEditData({ status: fb.status, priority: fb.priority, category: fb.category, internal_notes: fb.internal_notes || '', tags: fb.tags || [] });
    setDetailOpen(true);
  };

  const handleSave = async () => {
    if (!selectedFb) return;
    setSaving(true);
    await base44.functions.invoke('adminFeedbackResponses', { mode: 'update', feedback_id: selectedFb.id, data: editData });
    setSaving(false);
    setDetailOpen(false);
    toast.success('Feedback atualizado');
    loadData();
  };

  const handleExport = async (format) => {
    setExporting(true);
    const cleanFilters = {};
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') cleanFilters[k] = v; });
    const res = await base44.functions.invoke('adminFeedbackResponses', { mode: 'export', format, filters: cleanFilters });

    if (format === 'csv' && res.data?.csv) {
      const blob = new Blob([res.data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'feedback_responses.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } else if (format === 'json' && res.data?.data) {
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'feedback_responses.json';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    setExporting(false);
    toast.success(`Exportado ${res.data?.total || 0} registros`);
  };

  const newCount = facets.status?.new || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Pesquisa de Experiência</h3>
          {newCount > 0 && <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">{newCount} novo(s)</Badge>}
          <Badge variant="outline" className="text-[10px]">{total} total</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('csv')} disabled={exporting}>
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('json')} disabled={exporting}>
            <Download className="w-3 h-3 mr-1" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowImport(true)}>
            <Upload className="w-3 h-3 mr-1" /> Importar
          </Button>
        </div>
      </div>

      {/* Facet pills */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(facets.status || {}).map(([k, v]) => (
          <button key={k} onClick={() => setFilters(f => ({ ...f, status: f.status === k ? 'all' : k }))}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              filters.status === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/30'
            }`}>
            {STATUS_CFG[k]?.label || k} ({v})
          </button>
        ))}
      </div>

      {/* Search + filters toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar feedback..." value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={handleSearch} className="pl-8 h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-3 h-3" /> Filtros <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
          <FilterSelect label="Prioridade" value={filters.priority} onChange={(v) => setFilters(f => ({ ...f, priority: v }))}
            options={[{ v: 'all', l: 'Todas' }, ...Object.entries(PRIORITY_CFG).map(([v, c]) => ({ v, l: c.label }))]} />
          <FilterSelect label="Categoria" value={filters.category} onChange={(v) => setFilters(f => ({ ...f, category: v }))}
            options={[{ v: 'all', l: 'Todas' }, ...Object.entries(CATEGORY_CFG).map(([v, l]) => ({ v, l }))]} />
          <FilterSelect label="Experiência" value={filters.experience_rating} onChange={(v) => setFilters(f => ({ ...f, experience_rating: v }))}
            options={[{ v: 'all', l: 'Todas' }, ...Object.entries(EXPERIENCE_LABELS).map(([v, c]) => ({ v, l: `${c.num} — ${c.label}` }))]} />
          <FilterSelect label="Recomenda" value={filters.recommend_ponty} onChange={(v) => setFilters(f => ({ ...f, recommend_ponty: v }))}
            options={[{ v: 'all', l: 'Todos' }, { v: 'yes', l: 'Sim' }, { v: 'maybe', l: 'Talvez' }, { v: 'no', l: 'Não' }]} />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma resposta encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(fb => {
            const expCfg = EXPERIENCE_LABELS[fb.experience_rating] || {};
            const statusCfg = STATUS_CFG[fb.status] || STATUS_CFG.new;
            const priCfg = PRIORITY_CFG[fb.priority] || PRIORITY_CFG.med;
            return (
              <Card key={fb.id} className="bg-card border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDetail(fb)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">{expCfg.num || '—'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-foreground">{fb.user_name}</span>
                        <Badge className={`${statusCfg.cls} border-0 text-[9px]`}>{statusCfg.label}</Badge>
                        <Badge className={`${priCfg.cls} border-0 text-[9px]`}>{priCfg.label}</Badge>
                        {fb.recommend_ponty && (
                          <span className="text-[10px] text-muted-foreground">{RECOMMEND_LABELS[fb.recommend_ponty]}</span>
                        )}
                      </div>
                      {fb.improvement_one_thing && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fb.improvement_one_thing}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span>{new Date(fb.created_date).toLocaleDateString('pt-BR')}</span>
                        {fb.category && fb.category !== 'other' && (
                          <><span>·</span><span className="capitalize">{CATEGORY_CFG[fb.category]}</span></>
                        )}
                        {fb.source === 'import' && <><span>·</span><span>Importado</span></>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 30 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-xs text-muted-foreground self-center">Página {page} de {Math.ceil(total / 30)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="w-5 h-5 text-primary" />
              Detalhes da Resposta
            </DialogTitle>
          </DialogHeader>
          {selectedFb && (
            <div className="space-y-4">
              {/* User info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedFb.user_name}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedFb.user_email}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(selectedFb.created_date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Answers */}
              <div className="grid grid-cols-2 gap-2">
                <FieldCell label="Experiência" value={`${EXPERIENCE_LABELS[selectedFb.experience_rating]?.num || '—'} — ${EXPERIENCE_LABELS[selectedFb.experience_rating]?.label || selectedFb.experience_rating}`} />
                <FieldCell label="Confusão" value={selectedFb.confusion_level} />
                <FieldCell label="Favorito" value={selectedFb.favorite_thing} />
                <FieldCell label="Recomenda" value={RECOMMEND_LABELS[selectedFb.recommend_ponty] || 'N/A'} />
              </div>

              {selectedFb.confusion_text && <TextBlock label="Detalhes confusão" text={selectedFb.confusion_text} />}
              {selectedFb.improvement_one_thing && <TextBlock label="O que melhorar" text={selectedFb.improvement_one_thing} />}
              {selectedFb.recommend_to_yes && <TextBlock label="O que falta para recomendar" text={selectedFb.recommend_to_yes} />}
              {selectedFb.favorite_thing_text && <TextBlock label="Favorito (detalhe)" text={selectedFb.favorite_thing_text} />}

              {/* Admin controls */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-foreground">Triagem Admin</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                    <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Prioridade</p>
                    <Select value={editData.priority} onValueChange={(v) => setEditData(d => ({ ...d, priority: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Categoria</p>
                    <Select value={editData.category} onValueChange={(v) => setEditData(d => ({ ...d, category: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CFG).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Notas internas</p>
                  <Textarea value={editData.internal_notes} onChange={(e) => setEditData(d => ({ ...d, internal_notes: e.target.value.slice(0, 1000) }))}
                    placeholder="Anotações..." rows={2} className="text-xs resize-none" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <FeedbackImportDialog open={showImport} onOpenChange={setShowImport} onComplete={loadData} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function FieldCell({ label, value }) {
  return (
    <div className="p-2 rounded-lg bg-muted/50">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium text-foreground capitalize">{value || 'N/A'}</p>
    </div>
  );
}

function TextBlock({ label, text }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-lg">{text}</p>
    </div>
  );
}