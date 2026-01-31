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
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'musk', icon: Zap },
  ];

  const currentThemeIcon = themes.find(t => t.value === theme)?.icon || Sun;
  const CurrentIcon = currentThemeIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:h-9 lg:w-9 hover:bg-white/10 transition-all">
          <CurrentIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem key={t.value} onClick={() => changeTheme(t.value)}>
              <Icon className="w-4 h-4 mr-2" />
              <span className="capitalize">{t.value}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}