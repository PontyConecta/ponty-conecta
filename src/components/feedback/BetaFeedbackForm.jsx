import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Send, Heart, ThumbsUp, Meh, HelpCircle, Frown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EXPERIENCE_OPTIONS = [
  { value: 'love', label: 'Amando!', emoji: '😍', icon: Heart, color: 'text-pink-500 bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { value: 'good', label: 'Bom', emoji: '😊', icon: ThumbsUp, color: 'text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { value: 'neutral', label: 'Normal', emoji: '😐', icon: Meh, color: 'text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'confused', label: 'Confusa', emoji: '🤔', icon: HelpCircle, color: 'text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { value: 'hard', label: 'Difícil', emoji: '😓', icon: Frown, color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' },
];

const CONFUSION_OPTIONS = [
  { value: 'none', label: 'Nenhuma', emoji: '✨' },
  { value: 'some', label: 'Um pouco', emoji: '🤏' },
  { value: 'yes', label: 'Sim, bastante', emoji: '😵‍💫' },
];

const FAVORITE_OPTIONS = [
  { value: 'campaigns', label: 'Campanhas', emoji: '📢' },
  { value: 'organization', label: 'Organização', emoji: '📋' },
  { value: 'ease', label: 'Facilidade', emoji: '🎯' },
  { value: 'concept', label: 'O conceito', emoji: '💡' },
  { value: 'didnt_get_it', label: 'Ainda não entendi', emoji: '🤷' },
  { value: 'other', label: 'Outra coisa', emoji: '✨' },
];

const RECOMMEND_OPTIONS = [
  { value: 'yes', label: 'Sim!', emoji: '🙌', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { value: 'maybe', label: 'Talvez', emoji: '🤔', color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { value: 'no', label: 'Ainda não', emoji: '😕', color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' },
];

const TOTAL_STEPS = 6;

export default function BetaFeedbackForm({ channel = 'modal', onComplete, onClose }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [answers, setAnswers] = useState({
    experience_rating: '',
    confusion_level: '',
    confusion_text: '',
    favorite_thing: '',
    favorite_thing_text: '',
    improvement_one_thing: '',
    recommend_ponty: '',
    recommend_to_yes: '',
  });

  const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const canNext = () => {
    if (step === 0) return !!answers.experience_rating;
    if (step === 1) return !!answers.confusion_level;
    if (step === 2) return !!answers.favorite_thing;
    if (step === 3) return !!answers.improvement_one_thing.trim();
    if (step === 4) return !!answers.recommend_ponty;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const platform = /Mobi|Android/i.test(navigator.userAgent) ? 'android' : 'web';
    await base44.functions.invoke('submitBetaFeedback', { ...answers, channel, platform });
    setDone(true);
    setSubmitting(false);
    onComplete?.();
  };

  if (done) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Recebido! Obrigada 💜</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Seu feedback vai direto para quem constrói a Ponty. Cada resposta importa.
        </p>
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Pergunta {step + 1} de {TOTAL_STEPS}</p>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step 0: Experience */}
      {step === 0 && (
        <StepContainer title="Como está sendo sua experiência com a Ponty?">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXPERIENCE_OPTIONS.map(o => (
              <ChipButton key={o.value} selected={answers.experience_rating === o.value}
                onClick={() => set('experience_rating', o.value)} className={o.color}>
                <span className="text-lg">{o.emoji}</span>
                <span className="text-xs font-medium">{o.label}</span>
              </ChipButton>
            ))}
          </div>
        </StepContainer>
      )}

      {/* Step 1: Confusion */}
      {step === 1 && (
        <StepContainer title="Você sentiu confusão ao usar o app?">
          <div className="grid grid-cols-3 gap-2">
            {CONFUSION_OPTIONS.map(o => (
              <ChipButton key={o.value} selected={answers.confusion_level === o.value}
                onClick={() => set('confusion_level', o.value)}>
                <span className="text-lg">{o.emoji}</span>
                <span className="text-xs font-medium">{o.label}</span>
              </ChipButton>
            ))}
          </div>
          {(answers.confusion_level === 'some' || answers.confusion_level === 'yes') && (
            <Textarea placeholder="Onde ficou confuso? (opcional)" value={answers.confusion_text}
              onChange={(e) => set('confusion_text', e.target.value.slice(0, 500))}
              rows={2} className="mt-3 text-sm resize-none" />
          )}
        </StepContainer>
      )}

      {/* Step 2: Favorite */}
      {step === 2 && (
        <StepContainer title="O que mais te chamou atenção até agora?">
          <div className="grid grid-cols-2 gap-2">
            {FAVORITE_OPTIONS.map(o => (
              <ChipButton key={o.value} selected={answers.favorite_thing === o.value}
                onClick={() => set('favorite_thing', o.value)}>
                <span className="text-lg">{o.emoji}</span>
                <span className="text-xs font-medium">{o.label}</span>
              </ChipButton>
            ))}
          </div>
          {answers.favorite_thing === 'other' && (
            <Textarea placeholder="Conta pra gente!" value={answers.favorite_thing_text}
              onChange={(e) => set('favorite_thing_text', e.target.value.slice(0, 500))}
              rows={2} className="mt-3 text-sm resize-none" />
          )}
        </StepContainer>
      )}

      {/* Step 3: Improvement */}
      {step === 3 && (
        <StepContainer title="Se pudesse mudar uma coisa, o que seria?">
          <Textarea placeholder="Pode ser sincera — queremos ouvir de verdade 💜"
            value={answers.improvement_one_thing}
            onChange={(e) => set('improvement_one_thing', e.target.value.slice(0, 2000))}
            rows={4} className="text-sm resize-none" />
          <p className="text-[10px] text-muted-foreground text-right">{answers.improvement_one_thing.length}/2000</p>
        </StepContainer>
      )}

      {/* Step 4: Recommend */}
      {step === 4 && (
        <StepContainer title="Recomendaria a Ponty para outra criadora?">
          <div className="grid grid-cols-3 gap-2">
            {RECOMMEND_OPTIONS.map(o => (
              <ChipButton key={o.value} selected={answers.recommend_ponty === o.value}
                onClick={() => set('recommend_ponty', o.value)} className={o.color}>
                <span className="text-lg">{o.emoji}</span>
                <span className="text-xs font-medium">{o.label}</span>
              </ChipButton>
            ))}
          </div>
          {(answers.recommend_ponty === 'maybe' || answers.recommend_ponty === 'no') && (
            <Textarea placeholder="O que faltaria pra você recomendar?"
              value={answers.recommend_to_yes}
              onChange={(e) => set('recommend_to_yes', e.target.value.slice(0, 1000))}
              rows={2} className="mt-3 text-sm resize-none" />
          )}
        </StepContainer>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <StepContainer title="Pronta para enviar?">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
            <p className="text-sm text-foreground">Esse feedback vai direto para o time Ponty. Ninguém além dos admins vai ver.</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {answers.experience_rating && <MiniTag>Experiência: {answers.experience_rating}</MiniTag>}
              {answers.confusion_level && <MiniTag>Confusão: {answers.confusion_level}</MiniTag>}
              {answers.favorite_thing && <MiniTag>Favorito: {answers.favorite_thing}</MiniTag>}
              {answers.recommend_ponty && <MiniTag>Recomenda: {answers.recommend_ponty}</MiniTag>}
            </div>
            {answers.improvement_one_thing && (
              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                "{answers.improvement_one_thing}"
              </p>
            )}
          </div>
        </StepContainer>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onClose?.()}
          className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {step === 0 ? 'Fechar' : 'Voltar'}
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Próxima <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {submitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Enviar feedback
          </Button>
        )}
      </div>
    </div>
  );
}

function StepContainer({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ChipButton({ children, selected, onClick, className = '' }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]'
          : `border-border bg-card hover:border-primary/30 ${className}`
      }`}>
      {children}
    </button>
  );
}

function MiniTag({ children }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      {children}
    </span>
  );
}