import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TOTAL_STEPS = 6;

const EXPERIENCE_SCALE = [
  { value: 'hard', label: 'Muito difícil', num: 1 },
  { value: 'confused', label: 'Difícil', num: 2 },
  { value: 'neutral', label: 'Regular', num: 3 },
  { value: 'good', label: 'Boa', num: 4 },
  { value: 'love', label: 'Muito boa', num: 5 },
];

const CLARITY_OPTIONS = [
  { value: 'none', label: 'Sim' },
  { value: 'some', label: 'Parcialmente' },
  { value: 'yes', label: 'Não' },
];

const FAVORITE_OPTIONS = [
  { value: 'campaigns', label: 'Campanhas' },
  { value: 'organization', label: 'Organização das oportunidades' },
  { value: 'ease', label: 'Facilidade de navegação' },
  { value: 'concept', label: 'Proposta da plataforma' },
  { value: 'other', label: 'Outro' },
];

const RECOMMEND_OPTIONS = [
  { value: 'yes', label: 'Sim' },
  { value: 'maybe', label: 'Talvez' },
  { value: 'no', label: 'Não' },
];

const FRICTION_OPTIONS = [
  { value: 'signup', label: 'Cadastro ou acesso' },
  { value: 'first_steps', label: 'Primeiros passos na plataforma' },
  { value: 'finding', label: 'Encontrar oportunidades' },
  { value: 'campaigns', label: 'Entender campanhas' },
  { value: 'other', label: 'Outro' },
];

const RECOMMEND_PROMPTS = {
  yes: 'Qual é o principal motivo da sua resposta?',
  maybe: 'O que precisaria melhorar para que você recomendasse com segurança?',
  no: 'Qual foi o principal motivo da sua resposta?',
};

export default function BetaFeedbackForm({ channel = 'modal', onComplete, onClose, showIntro = false }) {
  const [started, setStarted] = useState(!showIntro);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});

  const [answers, setAnswers] = useState({
    experience_rating: '',
    confusion_level: '',
    confusion_text: '',
    favorite_thing: '',
    favorite_thing_text: '',
    improvement_one_thing: '',
    recommend_ponty: '',
    recommend_to_yes: '',
    friction_point: '',
    friction_text: '',
  });

  const set = (key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0 && !answers.experience_rating) {
      errs.experience_rating = 'Selecione uma opção';
    }
    if (step === 1) {
      if (!answers.confusion_level) errs.confusion_level = 'Selecione uma opção';
      if ((answers.confusion_level === 'some' || answers.confusion_level === 'yes') && (!answers.confusion_text || answers.confusion_text.trim().length < 10)) {
        errs.confusion_text = 'Descreva com ao menos 10 caracteres';
      }
    }
    if (step === 2) {
      if (!answers.favorite_thing) errs.favorite_thing = 'Selecione uma opção';
      if (answers.favorite_thing === 'other' && (!answers.favorite_thing_text || answers.favorite_thing_text.trim().length < 3)) {
        errs.favorite_thing_text = 'Preencha este campo';
      }
    }
    if (step === 3) {
      if (!answers.improvement_one_thing || answers.improvement_one_thing.trim().length < 10) {
        errs.improvement_one_thing = 'Mínimo de 10 caracteres';
      }
    }
    if (step === 4) {
      if (!answers.recommend_ponty) errs.recommend_ponty = 'Selecione uma opção';
      if (!answers.recommend_to_yes || answers.recommend_to_yes.trim().length < 10) {
        errs.recommend_to_yes = 'Mínimo de 10 caracteres';
      }
    }
    if (step === 5) {
      if (!answers.friction_point) errs.friction_point = 'Selecione uma opção';
      if (answers.friction_point === 'other' && (!answers.friction_text || answers.friction_text.trim().length < 3)) {
        errs.friction_text = 'Preencha este campo';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => { if (validateStep()) setStep(s => s + 1); };
  const goBack = () => { if (step > 0) setStep(s => s - 1); else onClose?.(); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const platform = /Mobi|Android/i.test(navigator.userAgent) ? 'android' : 'web';
      await base44.functions.invoke('submitBetaFeedback', { ...answers, channel, platform });
      setDone(true);
      onComplete?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // toast not imported — use alert as lightweight fallback
    } finally {
      setSubmitting(false);
    }
  };

  // ── Tela final ──
  if (done) {
    return (
      <div className="text-center py-10 space-y-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Obrigado por compartilhar sua opinião</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Sua resposta foi registrada e será analisada pela equipe responsável pelo desenvolvimento da plataforma.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
            Essas contribuições ajudam diretamente na evolução do produto.
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>Voltar para a plataforma</Button>
      </div>
    );
  }

  // ── Tela intro ──
  if (!started) {
    return (
      <div className="text-center py-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pesquisa rápida de experiência</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Suas respostas ajudam nossa equipe a entender melhor o que está funcionando e o que pode melhorar.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            A pesquisa é breve e leva cerca de 2 minutos.
          </p>
        </div>
        <Button onClick={() => setStarted(true)}>Começar</Button>
      </div>
    );
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Pergunta {step + 1} de {TOTAL_STEPS}</span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step 0 */}
      {step === 0 && (
        <StepBlock title="Como foi sua experiência geral utilizando a plataforma?" error={errors.experience_rating}>
          <div className="flex gap-2">
            {EXPERIENCE_SCALE.map(o => (
              <ScaleButton key={o.value} selected={answers.experience_rating === o.value}
                onClick={() => set('experience_rating', o.value)} num={o.num} label={o.label} />
            ))}
          </div>
        </StepBlock>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <StepBlock title="Você conseguiu entender claramente como utilizar as funcionalidades principais?" error={errors.confusion_level}>
          <OptionGroup options={CLARITY_OPTIONS} value={answers.confusion_level}
            onChange={(v) => set('confusion_level', v)} />
          {(answers.confusion_level === 'some' || answers.confusion_level === 'yes') && (
            <div className="mt-3">
              <RequiredTextarea label="O que ficou confuso ou difícil de entender?"
                value={answers.confusion_text} onChange={(v) => set('confusion_text', v)}
                error={errors.confusion_text} max={600} min={10} />
            </div>
          )}
        </StepBlock>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <StepBlock title="Qual parte da plataforma mais contribuiu para sua experiência até agora?" error={errors.favorite_thing}>
          <OptionGroup options={FAVORITE_OPTIONS} value={answers.favorite_thing}
            onChange={(v) => set('favorite_thing', v)} />
          {answers.favorite_thing === 'other' && (
            <div className="mt-3">
              <RequiredTextarea label="Qual?" value={answers.favorite_thing_text}
                onChange={(v) => set('favorite_thing_text', v)} error={errors.favorite_thing_text}
                max={600} min={3} rows={2} />
            </div>
          )}
        </StepBlock>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <StepBlock title="Se você pudesse melhorar apenas uma coisa na plataforma agora, qual seria?">
          <RequiredTextarea value={answers.improvement_one_thing}
            onChange={(v) => set('improvement_one_thing', v)} error={errors.improvement_one_thing}
            max={600} min={10} rows={4} />
        </StepBlock>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <StepBlock title="Você recomendaria a plataforma para outra criadora hoje?" error={errors.recommend_ponty}>
          <OptionGroup options={RECOMMEND_OPTIONS} value={answers.recommend_ponty}
            onChange={(v) => set('recommend_ponty', v)} />
          {answers.recommend_ponty && (
            <div className="mt-3">
              <RequiredTextarea
                label={RECOMMEND_PROMPTS[answers.recommend_ponty] || 'Qual é o principal motivo da sua resposta?'}
                value={answers.recommend_to_yes} onChange={(v) => set('recommend_to_yes', v)}
                error={errors.recommend_to_yes} max={400} min={10} rows={3} />
            </div>
          )}
        </StepBlock>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <StepBlock title="Em qual momento você encontrou mais dificuldade durante o uso?" error={errors.friction_point}>
          <OptionGroup options={FRICTION_OPTIONS} value={answers.friction_point}
            onChange={(v) => set('friction_point', v)} />
          {answers.friction_point === 'other' && (
            <div className="mt-3">
              <RequiredTextarea label="Qual foi a dificuldade?" value={answers.friction_text}
                onChange={(v) => set('friction_text', v)} error={errors.friction_text}
                max={600} min={3} rows={2} />
            </div>
          )}
        </StepBlock>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground h-9">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {step === 0 ? 'Fechar' : 'Voltar'}
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button size="sm" onClick={goNext} className="h-9">
            Continuar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="h-9">
            {submitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Enviar
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Subcomponents ── */

function StepBlock({ title, error, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground leading-snug">{title}</h3>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function OptionGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
            value === o.value
              ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ScaleButton({ selected, onClick, num, label }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-lg border transition-all ${
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-border bg-card hover:border-muted-foreground/40'
      }`}>
      <span className={`text-base font-bold ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>{num}</span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
    </button>
  );
}

function RequiredTextarea({ label, value, onChange, error, max = 600, min = 10, rows = 3, placeholder }) {
  const len = (value || '').length;
  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        rows={rows}
        placeholder={placeholder}
        className={`text-sm resize-none bg-card ${error ? 'border-destructive' : ''}`}
      />
      <div className="flex items-center justify-between">
        {error ? <p className="text-[10px] text-destructive">{error}</p> : <span />}
        <span className="text-[10px] text-muted-foreground">{len}/{max}</span>
      </div>
    </div>
  );
}