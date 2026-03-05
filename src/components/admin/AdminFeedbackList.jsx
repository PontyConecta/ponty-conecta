import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Search, Star, Monitor, Smartphone, Bug, Lightbulb, Wrench, HelpCircle, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  novo: { label: 'Novo', cls: 'bg-blue-100 text-blue-700' },
  lido: { label: 'Lido', cls: 'bg-slate-100 text-slate-700' },
  em_analise: { label: 'Em análise', cls: 'bg-amber-100 text-amber-700' },
  implementado: { label: 'Implementado', cls: 'bg-emerald-100 text-emerald-700' },
  descartado: { label: 'Descartado', cls: 'bg-red-100 text-red-700' },
};

const TYPE_ICONS = {
  bug: Bug,
  ideia: Lightbulb,
  melhoria: Wrench,
  outro: HelpCircle,
};

export default function AdminFeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const loadFeedbacks = async () => {
    setLoading(true);
    const filters = { limit: 50, offset: 0 };
    if (filterStatus !== 'all') filters.status_admin = filterStatus;
    if (filterType !== 'all') filters.type = filterType;
    if (search.trim()) filters.search = search.trim();

    const res = await base44.functions.invoke('adminFeedback', { mode: 'list', filters });
    setFeedbacks(res.data?.feedbacks || []);
    setTotal(res.data?.total || 0);
    setLoading(false);
  };

  useEffect(() => { loadFeedbacks(); }, [filterStatus, filterType]);

  const openFeedback = (fb) => {
    setSelectedFeedback(fb);
    setEditStatus(fb.status_admin || 'novo');
    setEditNotes(fb.admin_notes || '');
    setDialogOpen(true);

    // Auto mark as read
    if (fb.status_admin === 'novo') {
      base44.functions.invoke('adminFeedback', {
        mode: 'update_status',
        feedback_id: fb.id,
        data: { status_admin: 'lido' },
      });
    }
  };

  const handleSave = async () => {
    if (!selectedFeedback) return;
    setSaving(true);
    await base44.functions.invoke('adminFeedback', {
      mode: 'update_status',
      feedback_id: selectedFeedback.id,
      data: { status_admin: editStatus, admin_notes: editNotes },
    });
    setSaving(false);
    setDialogOpen(false);
    loadFeedbacks();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') loadFeedbacks();
  };

  const newCount = feedbacks.filter(f => f.status_admin === 'novo').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Feedbacks Recebidos</h3>
          {newCount > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">{newCount} novo(s)</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{total} total</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="lido">Lido</SelectItem>
            <SelectItem value="em_analise">Em análise</SelectItem>
            <SelectItem value="implementado">Implementado</SelectItem>
            <SelectItem value="descartado">Descartado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="ideia">Ideia</SelectItem>
            <SelectItem value="melhoria">Melhoria</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum feedback encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedbacks.map(fb => {
            const TypeIcon = TYPE_ICONS[fb.type] || HelpCircle;
            const statusCfg = STATUS_CONFIG[fb.status_admin] || STATUS_CONFIG.novo;
            return (
              <Card key={fb.id} className="bg-card border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openFeedback(fb)}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{fb.title || fb.message?.slice(0, 60) || 'Sem título'}</p>
                        <Badge className={`${statusCfg.cls} border-0 text-[10px]`}>{statusCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fb.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>{fb.user_name || fb.user_email || 'Anônimo'}</span>
                        <span>·</span>
                        <span>{new Date(fb.created_date).toLocaleDateString('pt-BR')}</span>
                        {fb.rating > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {fb.rating}
                            </span>
                          </>
                        )}
                        {fb.device_context && (
                          <>
                            <span>·</span>
                            {fb.device_context === 'mobile' ? <Smartphone className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="w-5 h-5 text-primary" />
              Detalhes do Feedback
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{selectedFeedback.user_name}</span>
                  <span className="text-xs text-muted-foreground">{selectedFeedback.user_email}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(selectedFeedback.created_date).toLocaleString('pt-BR')}
                </span>
              </div>

              {selectedFeedback.title && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Título</p>
                  <p className="text-sm font-medium text-foreground">{selectedFeedback.title}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">Tipo</p>
                  <p className="text-xs font-medium text-foreground capitalize">{selectedFeedback.type}</p>
                </div>
                {selectedFeedback.rating > 0 && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Nota</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= selectedFeedback.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>
                  </div>
                )}
                {selectedFeedback.page_context && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Página</p>
                    <p className="text-xs font-medium text-foreground truncate">{selectedFeedback.page_context}</p>
                  </div>
                )}
                {selectedFeedback.device_context && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground">Dispositivo</p>
                    <p className="text-xs font-medium text-foreground capitalize">{selectedFeedback.device_context}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-foreground">Gestão Admin</p>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="lido">Lido</SelectItem>
                      <SelectItem value="em_analise">Em análise</SelectItem>
                      <SelectItem value="implementado">Implementado</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Notas do admin</p>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value.slice(0, 1000))}
                    placeholder="Anotações internas..."
                    rows={3}
                    className="text-xs resize-none"
                    maxLength={1000}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}