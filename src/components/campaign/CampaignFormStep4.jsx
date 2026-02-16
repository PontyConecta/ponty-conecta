import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, XCircle, ListChecks, Ban, Hash, AtSign } from 'lucide-react';

export default function CampaignFormStep4({ formData, onChange, onArrayFieldChange, addArrayField, removeArrayField }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Requisitos e Entregas *</Label>
        <Textarea value={formData.requirements} onChange={(e) => onChange('requirements', e.target.value)} placeholder="Liste exatamente o que o criador deve entregar..." className="mt-2 min-h-[80px]" />
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Diretrizes de Conteúdo</Label>
        <Textarea value={formData.content_guidelines} onChange={(e) => onChange('content_guidelines', e.target.value)} placeholder="Estilo, tom, referências visuais..." className="mt-2" />
      </div>

      {/* Do's and Don'ts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ListChecks className="w-4 h-4 text-emerald-600" /> O que FAZER
          </Label>
          <div className="space-y-2 mt-2">
            {formData.dos.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input value={item} onChange={(e) => onArrayFieldChange('dos', index, e.target.value)} placeholder="Ex: Usar luz natural" />
                {formData.dos.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeArrayField('dos', index)}><XCircle className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayField('dos')}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Ban className="w-4 h-4 text-red-600" /> O que NÃO FAZER
          </Label>
          <div className="space-y-2 mt-2">
            {formData.donts.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input value={item} onChange={(e) => onArrayFieldChange('donts', index, e.target.value)} placeholder="Ex: Mencionar concorrentes" />
                {formData.donts.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeArrayField('donts', index)}><XCircle className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayField('donts')}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </div>
        </div>
      </div>

      {/* Hashtags & Mentions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Hash className="w-4 h-4" /> Hashtags
          </Label>
          <div className="space-y-2 mt-2">
            {formData.hashtags.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input value={item} onChange={(e) => onArrayFieldChange('hashtags', index, e.target.value)} placeholder="#suamarca" />
                {formData.hashtags.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeArrayField('hashtags', index)}><XCircle className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayField('hashtags')}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <AtSign className="w-4 h-4" /> Menções
          </Label>
          <div className="space-y-2 mt-2">
            {formData.mentions.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input value={item} onChange={(e) => onArrayFieldChange('mentions', index, e.target.value)} placeholder="@suamarca" />
                {formData.mentions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeArrayField('mentions', index)}><XCircle className="w-4 h-4" /></Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayField('mentions')}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Como Provar a Entrega</Label>
        <Textarea value={formData.proof_requirements} onChange={(e) => onChange('proof_requirements', e.target.value)} placeholder="Ex: Screenshot do post publicado, link do conteúdo..." className="mt-2" />
      </div>
    </div>
  );
}