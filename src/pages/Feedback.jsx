import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus, Star, Send, CheckCircle2, Lock, ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const TYPE_OPTIONS = [
  { value: 'melhoria', label: 'Melhoria' },
  { value: 'bug', label: 'Bug' },
  { value: 'ideia', label: 'Ideia' },
  { value: 'outro', label: 'Outro' },
];

export default function Feedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [type, setType] = useState('melhoria');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [includeContext, setIncludeContext] = useState(true);

  const feedbackStatus = user?.feedback_status || 'none';
  const isAllowed = ['eligible', 'invited', 'submitted'].includes(feedbackStatus);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);

    const isMobile = window.innerWidth < 768;
    const pageContext = window.location.pathname + window.location.search;

    const feedbackData = {
      user_id: user.id,
      type,
      message: message.trim().slice(0, 2000),
      source: 'in_app',
      status_admin: 'novo',
    };
    if (title.trim()) feedbackData.title = title.trim().slice(0, 80);
    if (rating > 0) feedbackData.rating = rating;
    if (includeContext) {
      feedbackData.page_context = pageContext;
      feedbackData.device_context = isMobile ? 'mobile' : 'desktop';
    }

    await base44.entities.Feedback.create(feedbackData);

    // Update user status to submitted
    await base44.auth.updateMe({
      feedback_status: 'submitted',
      feedback_submitted_at: new Date().toISOString(),
    });

    setSubmitted(true);
    setSubmitting(false);
  };

  const resetForm = () => {
    setType('melhoria');
    setRating(0);
    setTitle('');
    setMessage('');
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso não habilitado</h2>
        <p className="text-sm text-muted-foreground mb-6">
          O programa de feedback beta ainda não está disponível para sua conta.
        </p>
        <Link to={createPageUrl('Home')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Recebido. Obrigado!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Seu feedback foi enviado diretamente para os administradores.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={resetForm}>
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Enviar outro
          </Button>
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sua opinião ajuda a melhorar a plataforma.
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-foreground">
            Sua resposta vai direto para os administradores. É unilateral — sem chat ou resposta pública.
            Leva menos de 1 minuto.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {/* Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Nota (opcional)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? 0 : n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Título (opcional)</Label>
          <Input
            placeholder="Resumo curto..."
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            maxLength={80}
          />
          <p className="text-[10px] text-muted-foreground text-right">{title.length}/80</p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Mensagem *</Label>
          <Textarea
            placeholder="Descreva seu feedback aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            rows={5}
            maxLength={2000}
            className="resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">{message.length}/2000</p>
        </div>

        {/* Context checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            Incluir contexto da tela atual
            {window.innerWidth < 768
              ? <Smartphone className="w-3 h-3" />
              : <Monitor className="w-3 h-3" />
            }
          </span>
        </label>

        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || submitting}
          className="w-full"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Enviar feedback
        </Button>
      </div>
    </div>
  );
}