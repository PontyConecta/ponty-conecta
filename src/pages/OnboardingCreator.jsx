import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { 
  User, ArrowRight, ArrowLeft, Upload, MapPin,
  Link as LinkIcon, Loader2, Building
} from 'lucide-react';
import BrazilStateSelect from '@/components/common/BrazilStateSelect';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';
import FieldHint from '@/components/onboarding/FieldHint';
import { formatPhoneNumber, isValidEmail } from '@/components/utils/phoneFormatter';
import { toast } from 'sonner';
import { getPersistedUtms } from '@/utils/utmUtils';
import { computeProfileSize, FOLLOWER_RANGES } from '@/components/utils/profileSizeUtils';
import { CREATOR_TYPE_OPTIONS } from '@/components/utils/creatorTypeConfig';

const STEPS = [
  { number: 1, title: 'Perfil' },
  { number: 2, title: 'Conteúdo' },
  { number: 3, title: 'Redes Sociais' },
  { number: 4, title: 'Finalização' },
];

const NICHES = [
  'Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde',
  'Viagens', 'Gastronomia', 'Pets & Animais', 'Família', 'Educação', 'Finanças & Investimentos', 'Humor', 'Música', 'Arte',
  'Negócios', 'Casa & Decoração', 'Maternidade', 'Sustentabilidade',
  'Automotivo', 'Espiritualidade', 'Culinária', 'Esportes', 'Entretenimento'
];

const CONTENT_TYPES = [
  'Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Podcasts', 'Blogs', 'Unboxing', 'Reviews'
];

export default function OnboardingCreator() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    niche: [],
    creator_type: 'ugc',
    platforms: [],
    profile_size: '',
    content_types: [],
    state: '',
    city: '',
    portfolio_url: '',
    rate_cash_min: '',
    rate_cash_max: '',
    accepts_barter: true,
    contact_email: '',
    contact_whatsapp: '',
    instagram_handle: '',
    instagram_followers: '',
    tiktok_handle: '',
    tiktok_followers: '',
    youtube_handle: '',
    youtube_followers: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const existingBrands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (existingBrands.length > 0) {
        toast.info('Você já possui um perfil de marca. Redirecionando...');
        navigate(createPageUrl('BrandDashboard'));
        return;
      }

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        const existing = creators[0];
        if (existing.account_state === 'ready') {
          navigate(createPageUrl('CreatorDashboard'));
          return;
        }
        setCreator(existing);
        // Map old 6-step to new 4-step
        const oldStep = existing.onboarding_step || 1;
        let mappedStep = 1;
        if (oldStep <= 1) mappedStep = 1;
        else if (oldStep <= 3) mappedStep = 2;
        else if (oldStep <= 5) mappedStep = 3;
        else mappedStep = 4;
        setStep(mappedStep);

        const ig = (existing.platforms || []).find(p => p.name === 'Instagram');
        const tk = (existing.platforms || []).find(p => p.name === 'TikTok');
        const yt = (existing.platforms || []).find(p => p.name === 'YouTube');

        setFormData({
          display_name: existing.display_name || userData.full_name || '',
          bio: existing.bio || '',
          avatar_url: existing.avatar_url || '',
          niche: existing.niche || [],
          creator_type: existing.creator_type || 'ugc',
          platforms: existing.platforms || [],
          profile_size: existing.profile_size || '',
          content_types: existing.content_types || [],
          state: existing.state || '',
          city: existing.city || '',
          portfolio_url: existing.portfolio_url || '',
          rate_cash_min: existing.rate_cash_min || '',
          rate_cash_max: existing.rate_cash_max || '',
          accepts_barter: existing.accepts_barter !== false,
          contact_email: existing.contact_email || userData.email || '',
          contact_whatsapp: existing.contact_whatsapp || '',
          instagram_handle: ig?.handle || '',
          instagram_followers: ig?.followers ? String(ig.followers) : '',
          tiktok_handle: tk?.handle || '',
          tiktok_followers: tk?.followers ? String(tk.followers) : '',
          youtube_handle: yt?.handle || '',
          youtube_followers: yt?.followers ? String(yt.followers) : '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'state') next.city = '';
      return next;
    });
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('avatar_url', file_url);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Erro ao enviar foto. Tente novamente.');
    }
  };

  const saveStepData = async (nextStep, advance = true) => {
    setSaving(true);
    const dataToSave = {};

    if (step === 1) {
      dataToSave.display_name = formData.display_name;
      dataToSave.bio = formData.bio;
      dataToSave.avatar_url = formData.avatar_url;
      dataToSave.state = formData.state;
      dataToSave.city = formData.city;
      const utmData = getPersistedUtms();
      if (utmData) {
        dataToSave.utm_source = utmData.utm_source || null;
        dataToSave.utm_medium = utmData.utm_medium || null;
        dataToSave.utm_campaign = utmData.utm_campaign || null;
        dataToSave.utm_content = utmData.utm_content || null;
        dataToSave.utm_term = utmData.utm_term || null;
      }
    } else if (step === 2) {
      dataToSave.niche = formData.niche;
      dataToSave.content_types = formData.content_types;
      dataToSave.creator_type = formData.creator_type;
    } else if (step === 3) {
      const platforms = [];
      if (formData.instagram_handle) platforms.push({ name: 'Instagram', handle: formData.instagram_handle, followers: parseInt(formData.instagram_followers) || 0 });
      if (formData.tiktok_handle) platforms.push({ name: 'TikTok', handle: formData.tiktok_handle, followers: parseInt(formData.tiktok_followers) || 0 });
      if (formData.youtube_handle) platforms.push({ name: 'YouTube', handle: formData.youtube_handle, followers: parseInt(formData.youtube_followers) || 0 });
      dataToSave.platforms = platforms;
      dataToSave.profile_size = computeProfileSize(platforms);
      dataToSave.portfolio_url = formData.portfolio_url;
      dataToSave.contact_email = formData.contact_email;
      dataToSave.contact_whatsapp = formData.contact_whatsapp;
      dataToSave.rate_cash_min = formData.rate_cash_min ? parseFloat(formData.rate_cash_min) : null;
      dataToSave.rate_cash_max = formData.rate_cash_max ? parseFloat(formData.rate_cash_max) : null;
      dataToSave.accepts_barter = formData.accepts_barter;
    }

    try {
      const response = await base44.functions.invoke('onboardingSaveStep', {
        profile_type: 'creator',
        step,
        data: dataToSave,
      });

      if (response.data?.success && response.data?.profile) {
        setCreator(response.data.profile);
        setFieldErrors({});
      }
    } catch (error) {
      const body = error?.response?.data;
      if (body?.field_errors) {
        setFieldErrors(body.field_errors);
      }
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      if (step === 1) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'lead', profile_type: 'creator' });
      }
      const ok = await saveStepData(step + 1);
      if (ok !== false) setStep(step + 1);
    }
  };

  const handleBack = async () => {
    if (step > 1) {
      try {
        await saveStepData(step, false);
      } catch (e) {
        console.warn('Could not save step before going back:', e.message);
      }
      setStep(step - 1);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('onboardingFinalize', { profile_type: 'creator' });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'complete_registration', profile_type: 'creator' });
      await refreshProfile();
      navigate(createPageUrl('CreatorDashboard'));
    } catch (error) {
      console.error('Error finalizing:', error);
      toast.error('Erro ao finalizar cadastro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.display_name?.trim().length >= 2 && formData.bio?.length >= 20 && formData.state?.length === 2;
      case 2: return formData.niche.length > 0 && formData.content_types.length > 0;
      case 3: return formData.instagram_handle?.trim().length > 0 && isValidEmail(formData.contact_email) && formData.contact_whatsapp?.replace(/\D/g, '').length >= 10;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Configure seu Perfil</h1>
          <p className="text-muted-foreground">Complete seu perfil para acessar oportunidades</p>
        </div>

        <OnboardingProgress steps={STEPS} currentStep={step} accentColor="orange" onStepClick={(s) => { if (s < step) setStep(s); }} />

        <Card className="shadow-xl border mb-24 bg-card">
          <CardContent className="p-6 sm:p-8">
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                          ) : (
                            <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-card shadow-lg bg-primary/10">
                              <User className="w-10 h-10 text-primary/60" />
                            </div>
                          )}
                          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors shadow-lg">
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            <Upload className="w-4 h-4 text-white" />
                          </label>
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-foreground">Nome Artístico *</Label>
                          <Input value={formData.display_name} onChange={(e) => handleChange('display_name', e.target.value)} placeholder="Como você quer ser conhecido" className="mt-2 h-12" />
                          <FieldHint text="O nome que será exibido no seu perfil público." />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground">Bio * (mínimo 20 caracteres)</Label>
                        <Textarea 
                          key="bio-field"
                          autoComplete="off"
                          value={formData.bio} 
                          onChange={(e) => handleChange('bio', e.target.value)} 
                          placeholder="Conte sobre você, seu estilo de conteúdo..." 
                          className="mt-2 min-h-[120px]" 
                        />
                        <p className={`text-xs mt-1 font-medium ${formData.bio.length >= 20 ? 'text-emerald-600' : 'text-primary'}`}>
                          {formData.bio.length}/20
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground">Estado *</Label>
                        <div className="mt-2">
                          <BrazilStateSelect value={formData.state} onValueChange={(v) => handleChange('state', v)} placeholder="Selecione seu estado" />
                        </div>
                        {fieldErrors.state && (
                          <p className="text-xs mt-1 text-red-500">{fieldErrors.state}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground">Cidade</Label>
                        <div className="relative mt-2">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Ex: São Paulo" className="pl-11 h-12" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-foreground">Nichos de Conteúdo *</Label>
                        <FieldHint text="Nos ajuda a conectar você com as melhores campanhas para o seu perfil." />
                        <p className="text-sm mt-1 mb-3 text-muted-foreground">Selecione até 5 nichos</p>
                        <div className="flex flex-wrap gap-2">
                          {NICHES.map(niche => (
                            <Badge key={niche} variant={formData.niche.includes(niche) ? "default" : "outline"}
                              className={`cursor-pointer transition-all ${formData.niche.includes(niche) ? 'bg-primary hover:bg-primary/80 text-primary-foreground' : 'hover:bg-primary/10 hover:border-primary/30'}`}
                              onClick={() => { if (formData.niche.length < 5 || formData.niche.includes(niche)) toggleArrayItem('niche', niche); }}>
                              {niche}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs mt-2 text-muted-foreground">{formData.niche.length}/5 selecionados</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground">Tipos de Conteúdo *</Label>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {CONTENT_TYPES.map(type => (
                            <Badge key={type} variant={formData.content_types.includes(type) ? "default" : "outline"}
                              className={`cursor-pointer transition-all ${formData.content_types.includes(type) ? 'bg-primary/80 hover:bg-primary/70 text-primary-foreground' : 'hover:bg-primary/10 hover:border-primary/30'}`}
                              onClick={() => toggleArrayItem('content_types', type)}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-foreground">Qual tipo de creator melhor te define?</Label>
                        <p className="text-xs mt-1 mb-3 text-muted-foreground">Ajuda a personalizar sua experiência na plataforma</p>
                        <div className="grid grid-cols-2 gap-3">
                          {CREATOR_TYPE_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleChange('creator_type', opt.value)}
                              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                                formData.creator_type === opt.value
                                  ? 'border-primary bg-primary/10'
                                  : 'border-transparent bg-muted/50 hover:bg-muted'
                              }`}
                            >
                              <span className="text-3xl" aria-hidden="true">{opt.emoji}</span>
                              <span className="text-sm font-bold text-foreground">{opt.label}</span>
                              <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-foreground">Suas Redes Sociais</Label>
                        <FieldHint text="Marcas verificam seus perfis para avaliar candidaturas." />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Instagram *</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                              <Input 
                                value={formData.instagram_handle} 
                                onChange={(e) => handleChange('instagram_handle', e.target.value.replace(/^@/, ''))} 
                                placeholder="seuinstagram" 
                                className="pl-8 h-12" 
                              />
                            </div>
                            <select
                              value={formData.instagram_followers || ''}
                              onChange={(e) => handleChange('instagram_followers', e.target.value)}
                              className="w-[140px] h-12 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="" disabled>Seguidores</option>
                              {FOLLOWER_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-foreground">TikTok</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                              <Input 
                                value={formData.tiktok_handle} 
                                onChange={(e) => handleChange('tiktok_handle', e.target.value.replace(/^@/, ''))} 
                                placeholder="seutiktok" 
                                className="pl-8 h-12" 
                              />
                            </div>
                            <select
                              value={formData.tiktok_followers || ''}
                              onChange={(e) => handleChange('tiktok_followers', e.target.value)}
                              className="w-[140px] h-12 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="" disabled>Seguidores</option>
                              {FOLLOWER_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-foreground">YouTube</Label>
                          <div className="flex gap-2 mt-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                              <Input 
                                value={formData.youtube_handle} 
                                onChange={(e) => handleChange('youtube_handle', e.target.value.replace(/^@/, ''))} 
                                placeholder="seucanal" 
                                className="pl-8 h-12" 
                              />
                            </div>
                            <select
                              value={formData.youtube_followers || ''}
                              onChange={(e) => handleChange('youtube_followers', e.target.value)}
                              className="w-[140px] h-12 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="" disabled>Inscritos</option>
                              {FOLLOWER_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-foreground">Portfólio / Media Kit</Label>
                        <div className="relative mt-2">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input value={formData.portfolio_url} onChange={(e) => handleChange('portfolio_url', e.target.value)} placeholder="https://seumediakit.com" className="pl-11 h-12" />
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Contato & Valores</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-foreground">Email de Contato *</Label>
                            <Input type="email" value={formData.contact_email} onChange={(e) => handleChange('contact_email', e.target.value)} placeholder="seu@email.com" className="mt-2 h-12" />
                            {formData.contact_email && !isValidEmail(formData.contact_email) && (
                              <p className="text-xs mt-1 text-red-500">Digite um email válido (ex: nome@email.com)</p>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-foreground">WhatsApp *</Label>
                            <Input 
                              value={formData.contact_whatsapp} 
                              onChange={(e) => handleChange('contact_whatsapp', formatPhoneNumber(e.target.value))} 
                              placeholder="(11) 99999-9999" 
                              className="mt-2 h-12"
                              maxLength={15}
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-foreground">Faixa de Valores (R$)</Label>
                            <p className="text-xs mt-1 mb-2 text-muted-foreground">Quanto você cobra por publicação/campanha</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                                <Input type="number" value={formData.rate_cash_min} onChange={(e) => handleChange('rate_cash_min', e.target.value)} placeholder="500" className="mt-1 h-12" />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Máximo</Label>
                                <Input type="number" value={formData.rate_cash_max} onChange={(e) => handleChange('rate_cash_max', e.target.value)} placeholder="5000" className="mt-1 h-12" />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                            <Checkbox id="accepts_barter" checked={formData.accepts_barter} onCheckedChange={(c) => handleChange('accepts_barter', c)} />
                            <div className="flex-1">
                              <Label htmlFor="accepts_barter" className="text-sm font-medium cursor-pointer text-foreground">Aceito permutas (produtos/serviços)</Label>
                              <p className="text-xs mt-0.5 text-muted-foreground">Marcas poderão oferecer produtos ao invés de pagamento</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <OnboardingSuccess profileType="creator" onContinue={handleFinalize} saving={saving} />
                  )}
                </motion.div>
              </AnimatePresence>

              {step < 4 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                  <Button type="button" onClick={handleNext} disabled={!isStepValid() || saving} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>Próximo <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}