import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Tag } from 'lucide-react';

const SUGGESTED_TAGS = [
  { label: 'VIP', color: 'bg-amber-100 text-amber-700' },
  { label: 'Teste', color: 'bg-slate-100 text-slate-600' },
  { label: 'Sinalizado', color: 'bg-red-100 text-red-700' },
  { label: 'Parceiro', color: 'bg-blue-100 text-blue-700' },
  { label: 'Influente', color: 'bg-purple-100 text-purple-700' },
  { label: 'Inativo', color: 'bg-gray-100 text-gray-600' },
  { label: 'Prioritário', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Excluir Financeiro', color: 'bg-orange-100 text-orange-700' },
];

export function getTagColor(tag) {
  const found = SUGGESTED_TAGS.find(t => t.label.toLowerCase() === tag.toLowerCase());
  if (found) return found.color;
  // Hash-based color for custom tags
  const colors = [
    'bg-sky-100 text-sky-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700',
    'bg-lime-100 text-lime-700',
    'bg-rose-100 text-rose-700',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function UserTagBadges({ tags = [], size = 'sm', maxShow = 3 }) {
  if (!tags || tags.length === 0) return null;
  const visible = tags.slice(0, maxShow);
  const remaining = tags.length - maxShow;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map(tag => (
        <Badge key={tag} className={`${getTagColor(tag)} border-0 ${size === 'xs' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'}`}>
          {tag}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className={`${size === 'xs' ? 'text-[9px] px-1 py-0' : 'text-[10px] px-1.5 py-0'}`} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

export default function UserTagManager({ tags = [], onSave, loading }) {
  const [currentTags, setCurrentTags] = useState(tags);
  const [newTag, setNewTag] = useState('');
  const hasChanges = JSON.stringify(currentTags.sort()) !== JSON.stringify((tags || []).sort());

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed || currentTags.includes(trimmed)) return;
    setCurrentTags([...currentTags, trimmed]);
    setNewTag('');
  };

  const removeTag = (tag) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4" style={{ color: '#9038fa' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Tags</span>
      </div>

      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5">
        {currentTags.map(tag => (
          <Badge key={tag} className={`${getTagColor(tag)} border-0 text-xs px-2 py-1 flex items-center gap-1`}>
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:opacity-70 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {currentTags.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nenhuma tag adicionada</p>
        )}
      </div>

      {/* Add tag input */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nova tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-8 text-sm"
          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
        />
        <Button size="sm" variant="outline" className="h-8" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Suggested tags */}
      <div>
        <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sugestões</p>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_TAGS.filter(t => !currentTags.includes(t.label)).map(t => (
            <button
              key={t.label}
              onClick={() => addTag(t.label)}
              className={`${t.color} border-0 text-[10px] px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity`}
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      {hasChanges && (
        <Button
          onClick={() => onSave(currentTags)}
          disabled={loading}
          className="w-full bg-[#9038fa] hover:bg-[#7a2de0] text-white"
          size="sm"
        >
          Salvar Tags
        </Button>
      )}
    </div>
  );
}