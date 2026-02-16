import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, XCircle } from 'lucide-react';

export default function CampaignFormStep1({ formData, onChange, onCoverUpload }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Imagem de Capa</Label>
        <div className="mt-2">
          {formData.cover_image_url ? (
            <div className="relative h-36 rounded-xl overflow-hidden">
              <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover" />
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70" onClick={() => onChange('cover_image_url', '')}>
                <XCircle className="w-4 h-4 text-white" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center h-36 border-2 border-dashed rounded-xl cursor-pointer hover:border-indigo-400 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload de imagem</span>
              </div>
            </label>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Título da Campanha *</Label>
        <Input value={formData.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Ex: Lançamento Coleção Verão 2024" className="mt-2 h-12" />
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descrição *</Label>
        <Textarea value={formData.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Descreva o objetivo da campanha..." className="mt-2 min-h-[120px]" />
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Público-Alvo</Label>
        <Textarea value={formData.target_audience} onChange={(e) => onChange('target_audience', e.target.value)} placeholder="Descreva o público que você quer atingir..." className="mt-2" />
      </div>
    </div>
  );
}