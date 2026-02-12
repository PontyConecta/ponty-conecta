import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function OnboardingBrand() {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    logo_url: ''
  });

  const industries = [
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const brands = await base44.entities.Brand.filter({ user_id: userData.id });
      if (brands.length > 0) {
        const existingBrand = brands[0];
        
        // Se já completou o onboarding, redireciona para o dashboard
        if (existingBrand.account_state === 'registered') {
          window.location.href = createPageUrl('BrandDashboard');
          return;
        }
        
        // Se tem company_name mas não está registrado, atualiza o estado e redireciona
        if (existingBrand.company_name && existingBrand.account_state !== 'registered') {
          await base44.entities.Brand.update(existingBrand.id, {
            account_state: 'registered'
          });
          await refreshProfile();
          window.location.href = createPageUrl('BrandDashboard');
          return;
        }
        
        setBrand(existingBrand);
        setFormData({
          company_name: existingBrand.company_name || userData.full_name + "'s Company",
          industry: existingBrand.industry || '',
          description: existingBrand.description || '',
          website: existingBrand.website || '',
          contact_email: existingBrand.contact_email || userData.email,
          contact_phone: userData.phone || '',
          logo_url: existingBrand.logo_url || ''
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
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('logo_url', file_url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erro ao fazer upload da logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        // Salvar telefone no perfil User
        await base44.auth.updateMe({
          phone: formData.contact_phone
        });

        const brandData = {
          company_name: formData.company_name,
          industry: formData.industry,
          description: formData.description,
          website: formData.website,
          contact_email: formData.contact_email,
          logo_url: formData.logo_url,
          account_state: 'registered'
        };

        if (brand) {
          await base44.entities.Brand.update(brand.id, brandData);
        } else {
          await base44.entities.Brand.create({
            user_id: user.id,
            ...brandData
          });
        }
        
        // Atualizar o contexto de autenticação com o novo estado do perfil
        await refreshProfile();
        
        // Celebração com confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        setTimeout(() => {
          window.location.href = createPageUrl('BrandDashboard');
        }, 1500);
      } catch (error) {
        console.error('Error saving brand:', error);
        alert('Erro ao salvar. Tente novamente.');
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Dados Básicos' },
    { number: 2, title: 'Sobre a Marca' },
    { number: 3, title: 'Contato' }
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="company_name" className="text-sm font-medium text-slate-700">
                Nome da Empresa *
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Ex: Minha Empresa LTDA"
                className="mt-2 h-12"
              />
            </div>

            <div>
              <Label htmlFor="industry" className="text-sm font-medium text-slate-700">
                Segmento *
              </Label>
              <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Logo da Marca *</Label>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center border-4 border-white shadow-lg">
                      <Building2 className="w-10 h-10 text-indigo-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-white" />
                    )}
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Adicione a logo da sua marca</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: JPG, PNG. Tamanho recomendado: 400x400px
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Sobre a Marca * (mínimo 20 caracteres)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Conte um pouco sobre sua marca, valores e o que vocês fazem..."
                className="mt-2 min-h-[150px]"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">
                  Esta descrição será exibida para criadores
                </p>
                <p className={`text-xs font-medium ${formData.description.length >= 20 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  {formData.description.length}/20
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                Website
              </Label>
              <div className="relative mt-2">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://suamarca.com.br"
                  className="pl-11 h-12"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="contact_email" className="text-sm font-medium text-slate-700">
                Email de Contato *
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contato@suamarca.com.br"
                  className="pl-11 h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_phone" className="text-sm font-medium text-slate-700">
                Telefone
              </Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="pl-11 h-12"
                />
              </div>
            </div>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-900">Quase lá!</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Após concluir, você será direcionado para escolher seu plano de assinatura e começar a criar campanhas.
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
        return formData.company_name && formData.company_name.trim().length >= 2 && formData.industry && formData.logo_url;
      case 2:
        return formData.description && formData.description.length >= 20;
      case 3:
        return formData.contact_email && formData.contact_email.includes('@');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Configure sua Marca</h1>
          <p className="text-slate-600">Complete seu perfil para começar a criar campanhas</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step >= s.number 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-200 text-slate-500'}
                `}>
                  {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                </div>
                <span className={`hidden sm:block text-sm ${step >= s.number ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.number ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0 mb-24">
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
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isStepValid() ? 'Preencha todos os campos obrigatórios' : ''}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === 3 ? (
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