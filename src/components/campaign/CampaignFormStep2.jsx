import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads'];
const CONTENT_TYPES = ['Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Unboxing', 'Reviews'];
const NICHES = ['Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde', 'Viagens', 'Gastronomia'];

export default function CampaignFormStep2({ formData, onChange, toggleArrayItem }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Plataformas *</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {PLATFORMS.map(p => (
            <Badge key={p} variant={formData.platforms.includes(p) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${formData.platforms.includes(p) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
              onClick={() => toggleArrayItem('platforms', p)}>
              {p}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tipos de Conteúdo</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CONTENT_TYPES.map(ct => (
            <Badge key={ct} variant={formData.content_type.includes(ct) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${formData.content_type.includes(ct) ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
              onClick={() => toggleArrayItem('content_type', ct)}>
              {ct}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nichos Preferidos</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {NICHES.map(n => (
            <Badge key={n} variant={formData.niche_required.includes(n) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${formData.niche_required.includes(n) ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => toggleArrayItem('niche_required', n)}>
              {n}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Número de Vagas</Label>
          <Input type="number" min="1" value={formData.slots_total} onChange={(e) => onChange('slots_total', e.target.value)} className="mt-2 h-12" />
        </div>
        <div>
          <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tamanho Mínimo</Label>
          <Select value={formData.profile_size_min} onValueChange={(v) => onChange('profile_size_min', v)}>
            <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nano">Nano (1K-10K)</SelectItem>
              <SelectItem value="micro">Micro (10K-50K)</SelectItem>
              <SelectItem value="mid">Mid (50K-500K)</SelectItem>
              <SelectItem value="macro">Macro (500K-1M)</SelectItem>
              <SelectItem value="mega">Mega (1M+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}