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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Building2, ArrowRight, ArrowLeft, Upload, Globe, Mail, Phone,
  Loader2, Sparkles, Instagram, Linkedin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import OnboardingSuccess from '@/components/onboarding/OnboardingSuccess';

const STEPS = [
  { number: 1, title: 'Identidade' },
  { number: 2, title: 'Especialização' },
  { number: 3, title: 'Social & Contato' },
  { number: 4, title: 'Finalização' },
];

const INDUSTRIES = [
  { value: 'fashion', label: 'Moda & Vestuário' },
  { value: 'beauty', label: 'Beleza & Cosméticos' },
  { value: 'tech', label: 'Tecnologia' },
  { value: 'food_beverage', label: 'Alimentos & Bebidas' },
  { value: 'health_wellness', label: 'Saúde & Bem-estar' },
  { value: 'travel', label: 'Viagens & Turismo' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'sports', label: 'Esportes & Fitness' },
  { value: 'finance', label: 'Finanças' },
  { value: 'education', label: 'Educação' },
  { value: 'retail', label: 'Varejo' },
  { value: 'automotive', label: 'Automotivo' },
  { value: 'other', label: 'Outros' }
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 funcionários' },
  { value: '11-50', label: '11-50 funcionários' },
  { value: '51-200', label: '51-200 funcionários' },
  { value: '201-500', label: '201-500 funcionários' },
  { value: '500+', label: '500+ funcionários' },
];

const BUDGETS = [
  { value: 'Under R$1k', label: 'Menos de R$1.000' },
  { value: 'R$1k-R$5k', label: 'R$1.000 - R$5.000' },
  { value: 'R$5k-R$20k', label: 'R$5.000 - R$20.000' },
  { value: 'R$20k+', label: 'Acima de R$20.000' },
];

export default function OnboardingBrand() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    marketing_budget: '',
    description: '',
    target_audience: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    social_instagram: '',
    social_linkedin: '',
    logo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        const existing = brands[0];

        if (existing.account_state === 'ready') {
          navigate(createPageUrl('BrandDashboard'));
          return;
        }

        setBrand(existing);
        setStep(existing.onboarding_step || 1);
        setFormData({
          company_name: existing.company_name || '',
          industry: existing.industry || '',
          company_size: existing.company_size || '',
          marketing_budget: existing.marketing_budget || '',
          description: existing.description || '',
          target_audience: existing.target_audience || '',
          website: existing.website || '',
          contact_email: existing.contact_email || userData.email,
          contact_phone: existing.contact_phone || '',
          social_instagram: existing.social_instagram || '',
          social_linkedin: existing.social_linkedin || '',
          logo_url: existing.logo_url || '',
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('logo_url', file_url);
    setUploadingLogo(false);
  };

  // Save current step data incrementally
  const saveStepData = async (nextStep) => {
    setSaving(true);
    const dataToSave = { onboarding_step: nextStep };

    if (step === 1) {
      dataToSave.company_name = formData.company_name;
      dataToSave.logo_url = formData.logo_url;
    } else if (step === 2) {
      dataToSave.industry = formData.industry;
      dataToSave.company_size = formData.company_size;
      dataToSave.marketing_budget = formData.marketing_budget;
      dataToSave.description = formData.description;
      dataToSave.target_audience = formData.target_audience;
    } else if (step === 3) {
      dataToSave.website = formData.website;
      dataToSave.contact_email = formData.contact_email;
      dataToSave.contact_phone = formData.contact_phone;
      dataToSave.social_instagram = formData.social_instagram;
      dataToSave.social_linkedin = formData.social_linkedin;
    }

    if (brand) {
      await base44.entities.Brand.update(brand.id, dataToSave);
    } else {
      const created = await base44.entities.Brand.create({
        user_id: user.id,
        ...dataToSave,
      });
      setBrand(created);
    }
    setSaving(false);
  };

  const handleNext = async () => {
    if (step < 4) {
      await saveStepData(step + 1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Final step: mark as ready and create onboarding missions
  const handleFinalize = async () => {
    setSaving(true);
    await base44.entities.Brand.update(brand.id, { account_state: 'ready', onboarding_step: 4 });
    // Create onboarding missions in background
    base44.functions.invoke('createOnboardingMissions', {
      profile_type: 'brand',
      profile_id: brand.id
    }).catch(err => console.error('Mission creation error:', err));
    await refreshProfile();
    setSaving(false);
    navigate(createPageUrl('BrandDashboard'));
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
      case 1: return formData.company_name?.trim().length >= 2;
      case 2: return formData.industry && formData.description?.length >= 20;
      case 3: return formData.contact_email?.includes('@');
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9038fa] to-[#b77aff] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Configure sua Marca</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Complete seu perfil para começar a criar campanhas</p>
        </div>

        <OnboardingProgress steps={STEPS} currentStep={step} accentColor="indigo" />

        <Card className="shadow-xl border-0 mb-24" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nome da Empresa *</Label>
                      <Input value={formData.company_name} onChange={(e) => handleChange('company_name', e.target.value)} placeholder="Ex: Minha Empresa LTDA" className="mt-2 h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Logo da Marca</Label>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="relative">
                          {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo" className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg" />
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-[#9038fa]/10 to-[#b77aff]/10 flex items-center justify-center border-4 border-white shadow-lg">
                              <Building2 className="w-10 h-10 text-[#9038fa]/60" />
                            </div>
                          )}
                          <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#9038fa] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#7a2de0] transition-colors shadow-lg">
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                            {uploadingLogo ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Adicione a logo da sua marca</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>JPG, PNG. Recomendado: 400x400px</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Segmento *</Label>
                      <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                        <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Selecione o segmento" /></SelectTrigger>
                        <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tamanho da Empresa</Label>
                      <Select value={formData.company_size} onValueChange={(v) => handleChange('company_size', v)}>
                        <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Orçamento Mensal de Marketing</Label>
                      <Select value={formData.marketing_budget} onValueChange={(v) => handleChange('marketing_budget', v)}>
                        <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{BUDGETS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sobre a Marca * (mínimo 20 caracteres)</Label>
                      <Textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Conte sobre sua marca, valores e o que vocês fazem..." className="mt-2 min-h-[120px]" />
                      <p className={`text-xs mt-1 font-medium ${formData.description.length >= 20 ? 'text-emerald-600' : 'text-[#9038fa]'}`}>
                        {formData.description.length}/20
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Público-Alvo</Label>
                      <Input value={formData.target_audience} onChange={(e) => handleChange('target_audience', e.target.value)} placeholder="Ex: Mulheres 25-35, classe A/B" className="mt-2 h-12" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email de Contato *</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input type="email" value={formData.contact_email} onChange={(e) => handleChange('contact_email', e.target.value)} placeholder="contato@suamarca.com.br" className="pl-11 h-12" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Telefone</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input value={formData.contact_phone} onChange={(e) => handleChange('contact_phone', e.target.value)} placeholder="(11) 99999-9999" className="pl-11 h-12" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Website</Label>
                      <div className="relative mt-2">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input value={formData.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://suamarca.com.br" className="pl-11 h-12" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Instagram</Label>
                      <div className="relative mt-2">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input value={formData.social_instagram} onChange={(e) => handleChange('social_instagram', e.target.value)} placeholder="@suamarca" className="pl-11 h-12" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>LinkedIn</Label>
                      <div className="relative mt-2">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input value={formData.social_linkedin} onChange={(e) => handleChange('social_linkedin', e.target.value)} placeholder="linkedin.com/company/suamarca" className="pl-11 h-12" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <OnboardingSuccess profileType="brand" onContinue={handleFinalize} />
                )}
              </motion.div>
            </AnimatePresence>

            {step < 4 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || saving}
                  className="bg-[#9038fa] hover:bg-[#7a2de0] gap-2 disabled:opacity-50"
                >
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