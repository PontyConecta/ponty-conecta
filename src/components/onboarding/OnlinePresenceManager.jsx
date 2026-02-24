import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, Globe, Instagram, Linkedin, Youtube, Facebook, Twitter, ExternalLink } from 'lucide-react';
import FieldHint from './FieldHint';
import { getPresenceUrl, getPresenceLabel } from '@/components/utils/phoneFormatter';

const PRESENCE_TYPES = [
  { value: 'website', label: 'Website', icon: Globe, placeholder: 'https://suamarca.com.br', color: 'bg-blue-100 text-blue-700' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'suamarca (sem @)', color: 'bg-pink-100 text-pink-700' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/company/suamarca', color: 'bg-sky-100 text-sky-700' },
  { value: 'tiktok', label: 'TikTok', icon: Globe, placeholder: 'suamarca (sem @)', color: 'bg-purple-100 text-purple-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@suamarca', color: 'bg-red-100 text-red-700' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/suamarca', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'suamarca (sem @)', color: 'bg-slate-100 text-slate-700' },
];

export default function OnlinePresenceManager({ presences = [], onChange, showLinks = false }) {
  const [selectedType, setSelectedType] = useState('');
  const [inputValue, setInputValue] = useState('');

  const getTypeConfig = (type) => PRESENCE_TYPES.find(t => t.value === type);

  // Strip @ from handle-based platforms on add
  const sanitizeValue = (type, value) => {
    if (['instagram', 'tiktok', 'twitter'].includes(type)) {
      return value.replace(/^@/, '').trim();
    }
    return value.trim();
  };

  const addPresence = () => {
    if (!selectedType || !inputValue.trim()) return;
    const sanitized = sanitizeValue(selectedType, inputValue);
    const updated = [...presences, { type: selectedType, value: sanitized }];
    onChange(updated);
    setSelectedType('');
    setInputValue('');
  };

  const removePresence = (index) => {
    onChange(presences.filter((_, i) => i !== index));
  };

  // Filter out already added types (except website which can be multiple)
  const availableTypes = PRESENCE_TYPES.filter(t => 
    t.value === 'website' || !presences.some(p => p.type === t.value)
  );

  const currentConfig = getTypeConfig(selectedType);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Presenças Online
        </Label>
        <FieldHint text="Adicione suas redes sociais e website para que creators possam conhecer melhor sua marca." />
      </div>

      {/* List of added presences */}
      {presences.length > 0 && (
        <div className="space-y-2">
          {presences.map((p, i) => {
            const config = getTypeConfig(p.type);
            const IconComp = config?.icon || Globe;
            const url = getPresenceUrl(p);
            const label = getPresenceLabel(p);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config?.color || 'bg-slate-100 text-slate-700'}`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    {config?.label || p.type}
                  </span>
                  {showLinks ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm truncate font-medium flex items-center gap-1 hover:underline" style={{ color: '#9038fa' }}>
                      {label}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm truncate font-medium" style={{ color: 'var(--text-primary)' }}>{p.value}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePresence(i)} className="h-8 w-8 text-red-400 hover:text-red-500 flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new presence */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setInputValue(''); }}>
            <SelectTrigger className="h-11 sm:w-[180px]">
              <SelectValue placeholder="Selecione a rede" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(t => {
                const Icon = t.icon;
                return (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentConfig?.placeholder || 'URL ou usuário'}
            className="h-11 flex-1"
            disabled={!selectedType}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPresence(); } }}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={addPresence} 
          disabled={!selectedType || !inputValue.trim()} 
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>
    </div>
  );
}