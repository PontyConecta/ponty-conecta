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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  User, ArrowRight, ArrowLeft, Upload, MapPin,
  Link as LinkIcon, Loader2, Plus, X, Building
} from 'lucide-react';
import BrazilStateSelect from '@/components/common/BrazilStateSelect';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';
import FieldHint from '@/components/onboarding/FieldHint';
import { formatPhoneNumber, isValidEmail } from '@/components/utils/phoneFormatter';
import { computeProfileSize, FOLLOWER_RANGES, formatFollowers as fmtFollowers, getProfileSizeLabel } from '@/components/utils/profileSizeUtils';

const STEPS = [
  { number: 1, title: 'Identidade' },
  { number: 2, title: 'Especialização' },
  { number: 3, title: 'Redes Sociais' },
  { number: 4, title: 'Contato & Valores' },
  { number: 5, title: 'Finalização' },
];

const NICHES = [
  'Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde',
  'Viagens', 'Gastronomia', 'Pets', 'Família', 'Educação', 'Finanças', 'Humor', 'Música', 'Arte'
];

const CONTENT_TYPES = [
  'Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Podcasts', 'Blogs', 'Unboxing', 'Reviews'
];

// profile_size is now auto-calculated — PROFILE_SIZES kept only for reference
const PROFILE_SIZES = [
  { value: 'nano', label: 'Nano (até 10K)', desc: 'Comunidade íntima e engajada' },
  { value: 'micro', label: 'Micro (10K - 50K)', desc: 'Influência de nicho' },
  { value: 'mid', label: 'Mid (50K - 500K)', desc: 'Alcance moderado' },
  { value: 'macro', label: 'Macro (500K - 1M)', desc: 'Grande alcance' },
  { value: 'mega', label: 'Mega (1M+)', desc: 'Celebridade digital' },
];

const PLATFORM_OPTIONS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads', 'Pinterest', 'Twitch'];

export default function OnboardingCreator() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ name: '', handle: '', followers: '' });
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    niche: [],
    platforms: [],
    profile_size: '',
    content_types: [],
    state: '',
    city: '',
    location: '',
    portfolio_url: '',
    rate_cash_min: '',
    rate_cash_max: '',
    accepts_barter: true,
    contact_email: '',
    contact_whatsapp: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        const existing = creators[0];
        if (existing.account_state === 'ready') {
          navigate(createPageUrl('CreatorDashboard'));
          return;
        }
        setCreator(existing);
        setStep(existing.onboarding_step || 1);
        setFormData({
          display_name: existing.display_name || userData.full_name || '',
          bio: existing.bio || '',
          avatar_url: existing.avatar_url || '',
          niche: existing.niche || [],
          platforms: existing.platforms || [],
          profile_size: existing.profile_size || '',
          content_types: existing.content_types || [],
          state: existing.state || '',
          city: existing.city || '',
          location: existing.location || '',
          portfolio_url: existing.portfolio_url || '',
          rate_cash_min: existing.rate_cash_min || '',
          rate_cash_max: existing.rate_cash_max || '',
          accepts_barter: existing.accepts_barter !== false,
          contact_email: existing.contact_email || userData.email || '',
          contact_whatsapp: existing.contact_whatsapp || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('avatar_url', file_url);
  };

  const addPlatform = () => {
    if (newPlatform.name && newPlatform.handle) {
      const followers = parseInt(newPlatform.followers) || 0;
      setFormData(prev => {
        const updatedPlatforms = [...prev.platforms, { ...newPlatform, followers }];
        return { ...prev, platforms: updatedPlatforms, profile_size: computeProfileSize(updatedPlatforms) };
      });
      setNewPlatform({ name: '', handle: '', followers: '' });
    }
  };

  const removePlatform = (index) => {
    setFormData(prev => {
      const updatedPlatforms = prev.platforms.filter((_, i) => i !== index);
      return { ...prev, platforms: updatedPlatforms, profile_size: computeProfileSize(updatedPlatforms) };
    });
  };

  const saveStepData = async (nextStep) => {
    setSaving(true);
    const dataToSave = {};

    if (step === 1) {
      dataToSave.display_name = formData.display_name;
      dataToSave.bio = formData.bio;
      dataToSave.avatar_url = formData.avatar_url;
      dataToSave.state = formData.state;
      dataToSave.city = formData.city;
      dataToSave.location = formData.city && formData.state ? `${formData.city}, ${formData.state}` : formData.city || formData.state || '';
    } else if (step === 2) {
      dataToSave.niche = formData.niche;
      dataToSave.content_types = formData.content_types;
      dataToSave.profile_size = formData.profile_size;
    } else if (step === 3) {
      dataToSave.platforms = formData.platforms;
      dataToSave.profile_size = computeProfileSize(formData.platforms);
      dataToSave.portfolio_url = formData.portfolio_url;
    } else if (step === 4) {
      dataToSave.contact_email = formData.contact_email;
      dataToSave.contact_whatsapp = formData.contact_whatsapp;
      dataToSave.rate_cash_min = formData.rate_cash_min ? parseFloat(formData.rate_cash_min) : null;
      dataToSave.rate_cash_max = formData.rate_cash_max ? parseFloat(formData.rate_cash_max) : null;
      dataToSave.accepts_barter = formData.accepts_barter;
    }

    const response = await base44.functions.invoke('onboardingSaveStep', {
      profile_type: 'creator',
      step,
      data: dataToSave,
    });

    if (response.data?.success && response.data?.profile) {
      setCreator(response.data.profile);
    }
    setSaving(false);
  };

  const handleNext = async () => {
    if (step < 5) {
      await saveStepData(step + 1);
      setStep(step + 1);
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleFinalize = async () => {
    setSaving(true);
    await base44.functions.invoke('onboardingFinalize', { profile_type: 'creator' });
    await refreshProfile();
    setSaving(false);
    navigate(createPageUrl('CreatorDashboard'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9038fa]" />
      </div>
    );
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.display_name?.trim().length >= 2 && formData.bio?.length >= 20 && formData.state;
      case 2: return formData.niche.length > 0 && formData.content_types.length > 0;
      case 3: return formData.platforms.length > 0;
      case 4: return isValidEmail(formData.contact_email) && formData.contact_whatsapp?.replace(/\D/g, '').length >= 10;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-[#9038fa]">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Configure seu Perfil</h1>
          <p className="text-muted-foreground">Complete seu perfil para acessar oportunidades</p>
        </div>

        <OnboardingProgress steps={STEPS} currentStep={step} accentColor="orange" onStepClick={(s) => { if (s < step) setStep(s); }} />

        <Card className="shadow-xl border mb-24 bg-card">
          <CardContent className="p-6 sm:p-8">
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
                            <User className="w-10 h-10 text-[#9038fa]/60" />
                          </div>
                        )}
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#9038fa] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#7a2de0] transition-colors shadow-lg">
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
                      <Textarea value={formData.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Conte sobre você, seu estilo de conteúdo..." className="mt-2 min-h-[120px]" />
                      <p className={`text-xs mt-1 font-medium ${formData.bio.length >= 20 ? 'text-emerald-600' : 'text-[#9038fa]'}`}>
                        {formData.bio.length}/20
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">Estado *</Label>
                      <div className="mt-2">
                        <BrazilStateSelect value={formData.state} onValueChange={(v) => handleChange('state', v)} placeholder="Selecione seu estado" />
                      </div>
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
                            className={`cursor-pointer transition-all ${formData.niche.includes(niche) ? 'bg-[#9038fa] hover:bg-[#7a2de0] text-white' : 'hover:bg-purple-50 hover:border-purple-300'}`}
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
                            className={`cursor-pointer transition-all ${formData.content_types.includes(type) ? 'bg-[#b77aff] hover:bg-[#a055ff] text-white' : 'hover:bg-purple-50 hover:border-purple-300'}`}
                            onClick={() => toggleArrayItem('content_types', type)}>
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">Tamanho do Perfil</Label>
                      <p className="text-xs mt-1 text-muted-foreground">Calculado automaticamente com base na sua maior plataforma.</p>
                      <div className="mt-2 h-12 flex items-center px-4 rounded-lg bg-muted/50 border">
                        <Badge variant="outline" className="capitalize text-sm">
                          {formData.profile_size ? getProfileSizeLabel(formData.profile_size) : 'Adicione plataformas no passo 3'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Suas Plataformas *</Label>
                      <FieldHint text="Marcas verificam seus perfis para avaliar candidaturas. Adicione pelo menos uma." />
                      <p className="text-sm mt-1 mb-4 text-muted-foreground">Adicione suas redes sociais</p>
                      {formData.platforms.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {formData.platforms.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="flex-1">
                                <span className="font-medium text-foreground">{p.name}</span>
                                <span className="ml-2 text-muted-foreground">@{p.handle}</span>
                              </div>
                              <Badge variant="outline">{fmtFollowers(p.followers)} seguidores</Badge>
                              <Button variant="ghost" size="icon" onClick={() => removePlatform(i)} className="h-8 w-8 text-red-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Select value={newPlatform.name} onValueChange={(v) => setNewPlatform(p => ({ ...p, name: v }))}>
                          <SelectTrigger><SelectValue placeholder="Plataforma" /></SelectTrigger>
                          <SelectContent>{PLATFORM_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input value={newPlatform.handle} onChange={(e) => setNewPlatform(p => ({ ...p, handle: e.target.value.replace(/^@/, '') }))} placeholder="usuario (sem @)" />
                        <Select value={newPlatform.followers} onValueChange={(v) => setNewPlatform(p => ({ ...p, followers: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seguidores" /></SelectTrigger>
                          <SelectContent>
                            {FOLLOWER_RANGES.map(r => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" onClick={addPlatform} disabled={!newPlatform.name || !newPlatform.handle} className="w-full mt-2">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Plataforma
                      </Button>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Portfólio / Media Kit</Label>
                      <div className="relative mt-2">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input value={formData.portfolio_url} onChange={(e) => handleChange('portfolio_url', e.target.value)} placeholder="https://seumediakit.com" className="pl-11 h-12" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
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
                )}

                {step === 5 && (
                  <OnboardingSuccess profileType="creator" onContinue={handleFinalize} />
                )}
              </motion.div>
            </AnimatePresence>

            {step < 5 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button onClick={handleNext} disabled={!isStepValid() || saving} className="bg-[#9038fa] hover:bg-[#7a2de0] gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>Próximo <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}