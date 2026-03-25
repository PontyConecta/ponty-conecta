import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

// Migrate legacy theme name "musk" → canonical "neon"
const normalizeTheme = (t) => (t === 'musk' ? 'neon' : t);
const VALID_THEMES = ['light', 'dark', 'neon'];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const raw = localStorage.getItem('ponty-theme') || 'light';
    const normalized = normalizeTheme(raw);
    const safe = VALID_THEMES.includes(normalized) ? normalized : 'light';
    if (raw !== safe) localStorage.setItem('ponty-theme', safe);
    applyTheme(safe);
    // Ensure theme is always set even without interaction
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', safe);
    }
  }, []);

  const THEME_TOKENS = {
    light: {
      '--background': '267 100% 98%',
      '--foreground': '276 12% 16%',
      '--card': '0 0% 100%',
      '--card-foreground': '276 12% 16%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '276 12% 16%',
      '--primary': '279 20% 48%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '273 13% 83%',
      '--secondary-foreground': '276 12% 16%',
      '--muted': '273 13% 91%',
      '--muted-foreground': '276 10% 46%',
      '--accent': '279 20% 48%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 84% 60%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '273 13% 83%',
      '--input': '273 12% 88%',
      '--ring': '279 20% 48%',
      '--radius': '0.75rem',
      '--chart-1': '279 20% 48%',
      '--chart-2': '279 14% 62%',
      '--chart-3': '276 12% 35%',
      '--chart-4': '283 16% 58%',
      '--chart-5': '265 14% 52%',
      '--sidebar-background': '0 0% 100%',
      '--sidebar-foreground': '276 12% 16%',
      '--sidebar-primary': '279 20% 48%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '273 13% 95%',
      '--sidebar-accent-foreground': '276 12% 16%',
      '--sidebar-border': '273 13% 88%',
      '--sidebar-ring': '279 20% 48%',
    },
    dark: {
      '--background': '276 18% 7%',
      '--foreground': '273 15% 92%',
      '--card': '276 14% 12%',
      '--card-foreground': '273 15% 92%',
      '--popover': '276 14% 10%',
      '--popover-foreground': '273 15% 92%',
      '--primary': '279 30% 68%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '276 12% 18%',
      '--secondary-foreground': '273 12% 82%',
      '--muted': '276 10% 20%',
      '--muted-foreground': '273 8% 52%',
      '--accent': '279 30% 68%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 70% 58%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '276 12% 17%',
      '--input': '276 12% 19%',
      '--ring': '279 30% 68%',
      '--radius': '0.75rem',
      '--chart-1': '279 30% 68%',
      '--chart-2': '279 22% 55%',
      '--chart-3': '276 18% 44%',
      '--chart-4': '283 26% 62%',
      '--chart-5': '265 24% 58%',
      '--sidebar-background': '276 18% 9%',
      '--sidebar-foreground': '273 15% 92%',
      '--sidebar-primary': '279 30% 68%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '276 12% 16%',
      '--sidebar-accent-foreground': '273 12% 82%',
      '--sidebar-border': '276 12% 15%',
      '--sidebar-ring': '279 30% 68%',
    },
    neon: {
      '--background': '276 25% 4%',
      '--foreground': '270 20% 96%',
      '--card': '276 22% 8%',
      '--card-foreground': '270 20% 96%',
      '--popover': '276 22% 7%',
      '--popover-foreground': '270 20% 96%',
      '--primary': '279 70% 72%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '276 20% 12%',
      '--secondary-foreground': '270 15% 88%',
      '--muted': '276 18% 14%',
      '--muted-foreground': '273 12% 54%',
      '--accent': '279 70% 72%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 80% 62%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '276 20% 14%',
      '--input': '276 20% 16%',
      '--ring': '279 70% 72%',
      '--radius': '0.75rem',
      '--chart-1': '279 70% 72%',
      '--chart-2': '290 60% 68%',
      '--chart-3': '265 65% 66%',
      '--chart-4': '305 55% 70%',
      '--chart-5': '248 58% 64%',
      '--sidebar-background': '276 25% 6%',
      '--sidebar-foreground': '270 20% 96%',
      '--sidebar-primary': '279 70% 72%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '276 18% 12%',
      '--sidebar-accent-foreground': '270 15% 88%',
      '--sidebar-border': '276 20% 12%',
      '--sidebar-ring': '279 70% 72%',
    },
  };

  const applyTheme = (themeName) => {
    setTheme(themeName);
    const el = document.documentElement;
    el.setAttribute('data-theme', themeName);
    
    // Apply tokens directly via inline style to guarantee highest specificity
    // This overrides any CSS file regardless of load order
    const tokens = THEME_TOKENS[themeName] || THEME_TOKENS.light;
    Object.entries(tokens).forEach(([key, value]) => {
      el.style.setProperty(key, value);
    });
  };

  const changeTheme = (newTheme) => {
    const safe = normalizeTheme(newTheme);
    localStorage.setItem('ponty-theme', safe);
    applyTheme(safe);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};