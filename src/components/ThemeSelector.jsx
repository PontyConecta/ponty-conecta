import React from 'react';
import { useTheme } from '@/components/contexts/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Zap } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, changeTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'musk', label: 'Musk', icon: Zap },
  ];

  return (
    <Select value={theme} onValueChange={changeTheme}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Selecionar tema" />
      </SelectTrigger>
      <SelectContent>
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <SelectItem key={t.value} value={t.value}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {t.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}