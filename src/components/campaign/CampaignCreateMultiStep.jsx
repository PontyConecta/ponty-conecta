import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from '@/components/utils/toast';
import { campaignSchema, validate } from '@/components/utils/validationSchemas';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import CampaignFormStep1 from './CampaignFormStep1';
import CampaignFormStep2 from './CampaignFormStep2';
import CampaignFormStep3 from './CampaignFormStep3';
import CampaignFormStep4 from './CampaignFormStep4';

const STEPS = [
  { number: 1, title: 'Informações' },
  { number: 2, title: 'Segmentação' },
  { number: 3, title: 'Remuneração' },
  { number: 4, title: 'Diretrizes' },
];

const DEFAULT_FORM = {
  title: '', description: '', requirements: '', platforms: [], content_type: [],
  niche_required: [], location: '', deadline: '', application_deadline: '',
  remuneration_type: 'cash', budget_min: '', budget_max: '', barter_description: '',
  barter_value: '', slots_total: 1, profile_size_min: '', proof_requirements: '',
  target_audience: '', content_guidelines: '', dos: [''], donts: [''],
  hashtags: [''], mentions: [''], cover_image_url: ''
};

export default function CampaignCreateMultiStep({ brandId, editingCampaign, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (editingCampaign) {
      return {
        ...DEFAULT_FORM,
        ...editingCampaign,
        budget_min: editingCampaign.budget_min || '',
        budget_max: editingCampaign.budget_max || '',
        barter_value: editingCampaign.barter_value || '',
        dos: editingCampaign.dos?.length ? editingCampaign.dos : [''],
        donts: editingCampaign.donts?.length ? editingCampaign.donts : [''],
        hashtags: editingCampaign.hashtags?.length ? editingCampaign.hashtags : [''],
        mentions: editingCampaign.mentions?.length ? editingCampaign.mentions : [''],
      };
    }
    return { ...DEFAULT_FORM };
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayField = (field) => setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  const removeArrayField = (field, index) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('cover_image_url', file_url);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.title?.trim().length >= 3 && formData.description?.length >= 10;
      case 2: return formData.platforms.length > 0;
      case 3: return formData.deadline;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    const campaignData = {
      ...formData,
      brand_id: brandId,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      barter_value: formData.barter_value ? parseFloat(formData.barter_value) : null,
      slots_total: parseInt(formData.slots_total) || 1,
      dos: formData.dos.filter(d => d.trim()),
      donts: formData.donts.filter(d => d.trim()),
      hashtags: formData.hashtags.filter(h => h.trim()),
      mentions: formData.mentions.filter(m => m.trim()),
      status: editingCampaign ? editingCampaign.status : 'draft'
    };

    const validation = validate(campaignSchema, campaignData);
    if (!validation.success) {
      toast.error(Object.values(validation.errors)[0]);
      return;
    }

    setSaving(true);
    if (editingCampaign) {
      await base44.entities.Campaign.update(editingCampaign.id, campaignData);
      toast.success('Campanha atualizada!');
    } else {
      await base44.entities.Campaign.create(campaignData);
      toast.success('Campanha criada com sucesso!');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-6">
      <OnboardingProgress steps={STEPS} currentStep={step} accentColor="indigo" />

      <Card className="border-0 shadow-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 1 && <CampaignFormStep1 formData={formData} onChange={handleChange} onCoverUpload={handleCoverUpload} />}
              {step === 2 && <CampaignFormStep2 formData={formData} onChange={handleChange} toggleArrayItem={toggleArrayItem} />}
              {step === 3 && <CampaignFormStep3 formData={formData} onChange={handleChange} />}
              {step === 4 && <CampaignFormStep4 formData={formData} onChange={handleChange} onArrayFieldChange={handleArrayFieldChange} addArrayField={addArrayField} removeArrayField={removeArrayField} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            )}

            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!isStepValid()} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving || !formData.title || !formData.description || !formData.deadline} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Salvar Campanha</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}