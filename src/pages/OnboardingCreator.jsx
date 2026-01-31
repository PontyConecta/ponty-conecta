import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Instagram,
  Youtube,
  MapPin,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Sparkles,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingCreator() {
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
    platforms: [],
    profile_size: '',
    content_types: [],
    location: '',
    portfolio_url: '',
    rate_cash_min: '',
    rate_cash_max: '',
    accepts_barter: true
  });

  const [newPlatform, setNewPlatform] = useState({ name: '', handle: '', followers: '' });

  const niches = [
    'Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde', 
    'Viagens', 'Gastronomia', 'Pets', 'Família', 'Educação', 'Finanças', 'Humor', 'Música', 'Arte'
  ];

  const contentTypes = [
    'Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Podcasts', 'Blogs', 'Unboxing', 'Reviews'
  ];

  const profileSizes = [
    { value: 'nano', label: 'Nano (1K - 10K)', description: 'Comunidade íntima e engajada' },
    { value: 'micro', label: 'Micro (10K - 50K)', description: 'Influência de nicho' },
    { value: 'mid', label: 'Mid (50K - 500K)', description: 'Alcance moderado' },
    { value: 'macro', label: 'Macro (500K - 1M)', description: 'Grande alcance' },
    { value: 'mega', label: 'Mega (1M+)', description: 'Celebridade digital' }
  ];

  const platformOptions = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads', 'Pinterest', 'Twitch'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const creators = await base44.entities.Creator.filter({ user_id: userData.id });
      if (creators.length > 0) {
        // Se já completou o onboarding, redireciona para o dashboard
        if (creators[0].account_state === 'registered' || creators[0].subscription_status) {
          window.location.href = createPageUrl('CreatorDashboard');
          return;
        }
        
        setCreator(creators[0]);
        setFormData({
          display_name: creators[0].display_name || userData.full_name,
          bio: creators[0].bio || '',
          avatar_url: creators[0].avatar_url || '',
          niche: creators[0].niche || [],
          platforms: creators[0].platforms || [],
          profile_size: creators[0].profile_size || '',
          content_types: creators[0].content_types || [],
          location: creators[0].location || '',
          portfolio_url: creators[0].portfolio_url || '',
          rate_cash_min: creators[0].rate_cash_min || '',
          rate_cash_max: creators[0].rate_cash_max || '',
          accepts_barter: creators[0].accepts_barter !== false
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

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('avatar_url', file_url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const addPlatform = () => {
    if (newPlatform.name && newPlatform.handle) {
      setFormData(prev => ({
        ...prev,
        platforms: [...prev.platforms, { ...newPlatform, followers: parseInt(newPlatform.followers) || 0 }]
      }));
      setNewPlatform({ name: '', handle: '', followers: '' });
    }
  };

  const removePlatform = (index) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index)
    }));
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        await base44.entities.Creator.update(creator.id, {
          ...formData,
          rate_cash_min: formData.rate_cash_min ? parseFloat(formData.rate_cash_min) : null,
          rate_cash_max: formData.rate_cash_max ? parseFloat(formData.rate_cash_max) : null,
          account_state: 'registered'
        });
        window.location.href = createPageUrl('Subscription');
      } catch (error) {
        console.error('Error saving creator:', error);
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Perfil' },
    { number: 2, title: 'Nichos' },
    { number: 3, title: 'Plataformas' },
    { number: 4, title: 'Valores' }
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-10 h-10 text-orange-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-lg">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <Upload className="w-4 h-4 text-white" />
                </label>
              </div>
              <div className="flex-1">
                <Label htmlFor="display_name" className="text-sm font-medium text-slate-700">
                  Nome Artístico *
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  placeholder="Como você quer ser conhecido"
                  className="mt-2 h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
                Bio *
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Conte um pouco sobre você, seu estilo de conteúdo e o que te diferencia..."
                className="mt-2 min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                Localização
              </Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Ex: São Paulo, SP"
                  className="pl-11 h-12"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nichos de Conteúdo *</Label>
              <p className="text-sm text-slate-500 mt-1 mb-3">Selecione até 5 nichos que definem seu conteúdo</p>
              <div className="flex flex-wrap gap-2">
                {niches.map((niche) => (
                  <Badge
                    key={niche}
                    variant={formData.niche.includes(niche) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      formData.niche.includes(niche)
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'hover:bg-orange-50 hover:border-orange-300'
                    }`}
                    onClick={() => {
                      if (formData.niche.length < 5 || formData.niche.includes(niche)) {
                        toggleArrayItem('niche', niche);
                      }
                    }}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">{formData.niche.length}/5 selecionados</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Tipos de Conteúdo *</Label>
              <p className="text-sm text-slate-500 mt-1 mb-3">O que você produz?</p>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={formData.content_types.includes(type) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      formData.content_types.includes(type)
                        ? 'bg-violet-500 hover:bg-violet-600 text-white'
                        : 'hover:bg-violet-50 hover:border-violet-300'
                    }`}
                    onClick={() => toggleArrayItem('content_types', type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="profile_size" className="text-sm font-medium text-slate-700">
                Tamanho do Perfil *
              </Label>
              <Select value={formData.profile_size} onValueChange={(v) => handleChange('profile_size', v)}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Selecione seu alcance" />
                </SelectTrigger>
                <SelectContent>
                  {profileSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      <div>
                        <span className="font-medium">{size.label}</span>
                        <span className="text-slate-500 ml-2 text-sm">- {size.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700">Suas Plataformas *</Label>
              <p className="text-sm text-slate-500 mt-1 mb-4">Adicione suas redes sociais com número de seguidores</p>
              
              {formData.platforms.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.platforms.map((platform, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-slate-900">{platform.name}</span>
                        <span className="text-slate-500 ml-2">@{platform.handle}</span>
                      </div>
                      <Badge variant="outline">{platform.followers?.toLocaleString()} seguidores</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlatform(index)}
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Select value={newPlatform.name} onValueChange={(v) => setNewPlatform(p => ({ ...p, name: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newPlatform.handle}
                  onChange={(e) => setNewPlatform(p => ({ ...p, handle: e.target.value }))}
                  placeholder="@usuario"
                />
                <Input
                  type="number"
                  value={newPlatform.followers}
                  onChange={(e) => setNewPlatform(p => ({ ...p, followers: e.target.value }))}
                  placeholder="Seguidores"
                />
              </div>
              <Button
                variant="outline"
                onClick={addPlatform}
                disabled={!newPlatform.name || !newPlatform.handle}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Plataforma
              </Button>
            </div>

            <div>
              <Label htmlFor="portfolio_url" className="text-sm font-medium text-slate-700">
                Link do Portfólio / Media Kit
              </Label>
              <div className="relative mt-2">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={(e) => handleChange('portfolio_url', e.target.value)}
                  placeholder="https://seumediakit.com"
                  className="pl-11 h-12"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700">Faixa de Valores (R$)</Label>
              <p className="text-sm text-slate-500 mt-1 mb-3">Quanto você cobra por trabalho? (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.rate_cash_min}
                    onChange={(e) => handleChange('rate_cash_min', e.target.value)}
                    placeholder="500"
                    className="mt-1 h-12"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Máximo</Label>
                  <Input
                    type="number"
                    value={formData.rate_cash_max}
                    onChange={(e) => handleChange('rate_cash_max', e.target.value)}
                    placeholder="5000"
                    className="mt-1 h-12"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Checkbox
                id="accepts_barter"
                checked={formData.accepts_barter}
                onCheckedChange={(checked) => handleChange('accepts_barter', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="accepts_barter" className="text-sm font-medium cursor-pointer">
                  Aceito permutas (produtos/serviços)
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marcas poderão oferecer produtos ao invés de pagamento em dinheiro
                </p>
              </div>
            </div>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900">Perfil quase pronto!</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Após concluir, você será direcionado para escolher seu plano e começar a ver oportunidades.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.display_name && formData.bio && formData.bio.length >= 20;
      case 2:
        return formData.niche.length > 0 && formData.content_types.length > 0 && formData.profile_size;
      case 3:
        return formData.platforms.length > 0;
      case 4:
        return true; // Values are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configure seu Perfil</h1>
          <p className="text-slate-600">Complete seu perfil para acessar oportunidades</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= s.number 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-200 text-slate-500'}
                `}>
                  {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                </div>
                <span className={`hidden sm:block text-sm ${step >= s.number ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 h-0.5 ${step > s.number ? 'bg-orange-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || saving}
                className="bg-orange-500 hover:bg-orange-600 gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === 4 ? (
                  <>
                    Continuar
                    <Sparkles className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}