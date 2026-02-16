import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CampaignFormStep3({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tipo de Remuneração *</Label>
        <Select value={formData.remuneration_type} onValueChange={(v) => onChange('remuneration_type', v)}>
          <SelectTrigger className="mt-2 h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">💵 Pagamento em Dinheiro</SelectItem>
            <SelectItem value="barter">🎁 Permuta (Produtos/Serviços)</SelectItem>
            <SelectItem value="mixed">📦 Misto (Dinheiro + Permuta)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.remuneration_type === 'cash' || formData.remuneration_type === 'mixed') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Valor Mínimo (R$)</Label>
            <Input type="number" value={formData.budget_min} onChange={(e) => onChange('budget_min', e.target.value)} placeholder="500" className="mt-2 h-12" />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Valor Máximo (R$)</Label>
            <Input type="number" value={formData.budget_max} onChange={(e) => onChange('budget_max', e.target.value)} placeholder="2000" className="mt-2 h-12" />
          </div>
        </div>
      )}

      {(formData.remuneration_type === 'barter' || formData.remuneration_type === 'mixed') && (
        <>
          <div>
            <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Descrição da Permuta</Label>
            <Textarea value={formData.barter_description} onChange={(e) => onChange('barter_description', e.target.value)} placeholder="Descreva os produtos/serviços oferecidos..." className="mt-2" />
          </div>
          <div>
            <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Valor Estimado (R$)</Label>
            <Input type="number" value={formData.barter_value} onChange={(e) => onChange('barter_value', e.target.value)} placeholder="500" className="mt-2 h-12" />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Prazo de Candidaturas</Label>
          <Input type="date" value={formData.application_deadline} onChange={(e) => onChange('application_deadline', e.target.value)} className="mt-2 h-12" />
        </div>
        <div>
          <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Prazo de Entrega *</Label>
          <Input type="date" value={formData.deadline} onChange={(e) => onChange('deadline', e.target.value)} className="mt-2 h-12" />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Localização (opcional)</Label>
        <Input value={formData.location} onChange={(e) => onChange('location', e.target.value)} placeholder="Ex: São Paulo, SP ou Nacional" className="mt-2 h-12" />
      </div>
    </div>
  );
}