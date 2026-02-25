import React from 'react';
import { useTheme } from '@/components/contexts/ThemeContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Zap } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, changeTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'neon', label: 'Neon', icon: Zap },
  ];

  const CurrentIcon = themes.find(t => t.value === theme)?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          <CurrentIcon className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem key={t.value} onClick={() => changeTheme(t.value)}>
              <Icon className="w-4 h-4 mr-2" />
              <span>{t.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}