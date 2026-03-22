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
      '--background': '220 14% 96%',
      '--foreground': '224 24% 12%',
      '--card': '0 0% 100%',
      '--card-foreground': '224 24% 12%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '224 24% 12%',
      '--primary': '90 40% 49%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '220 14% 95%',
      '--secondary-foreground': '224 24% 12%',
      '--muted': '220 14% 93%',
      '--muted-foreground': '220 10% 46%',
      '--accent': '90 40% 49%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 84% 60%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '220 13% 91%',
      '--input': '220 13% 89%',
      '--ring': '90 40% 49%',
      '--radius': '0.75rem',
      '--chart-1': '90 40% 49%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%',
      '--sidebar-background': '0 0% 100%',
      '--sidebar-foreground': '224 71% 4%',
      '--sidebar-primary': '90 40% 49%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '90 40% 95%',
      '--sidebar-accent-foreground': '224 71% 4%',
      '--sidebar-border': '250 12% 90%',
      '--sidebar-ring': '90 40% 49%',
    },
    dark: {
      '--background': '230 25% 5%',
      '--foreground': '220 20% 93%',
      '--card': '230 20% 9%',
      '--card-foreground': '220 20% 93%',
      '--popover': '230 20% 9%',
      '--popover-foreground': '220 20% 93%',
      '--primary': '89 49% 57%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '230 18% 13%',
      '--secondary-foreground': '220 20% 90%',
      '--muted': '230 14% 15%',
      '--muted-foreground': '220 12% 55%',
      '--accent': '89 49% 57%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '230 12% 14%',
      '--input': '230 14% 16%',
      '--ring': '89 49% 57%',
      '--radius': '0.75rem',
      '--chart-1': '89 49% 57%',
      '--chart-2': '160 55% 42%',
      '--chart-3': '30 75% 55%',
      '--chart-4': '280 60% 62%',
      '--chart-5': '340 70% 58%',
      '--sidebar-background': '230 20% 9%',
      '--sidebar-foreground': '220 20% 93%',
      '--sidebar-primary': '89 49% 57%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '230 14% 14%',
      '--sidebar-accent-foreground': '220 20% 90%',
      '--sidebar-border': '230 12% 14%',
      '--sidebar-ring': '89 49% 57%',
    },
    neon: {
      '--background': '93 40% 4%',
      '--foreground': '93 10% 94%',
      '--card': '93 32% 8%',
      '--card-foreground': '93 10% 94%',
      '--popover': '93 32% 8%',
      '--popover-foreground': '93 10% 94%',
      '--primary': '93 67% 48%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '93 28% 12%',
      '--secondary-foreground': '93 10% 92%',
      '--muted': '93 22% 14%',
      '--muted-foreground': '93 10% 55%',
      '--accent': '93 67% 48%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '93 18% 13%',
      '--input': '93 20% 15%',
      '--ring': '93 67% 48%',
      '--radius': '0.75rem',
      '--chart-1': '93 67% 48%',
      '--chart-2': '170 55% 42%',
      '--chart-3': '35 80% 58%',
      '--chart-4': '290 65% 62%',
      '--chart-5': '345 70% 58%',
      '--sidebar-background': '93 32% 8%',
      '--sidebar-foreground': '93 10% 94%',
      '--sidebar-primary': '93 67% 48%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '93 22% 12%',
      '--sidebar-accent-foreground': '93 10% 92%',
      '--sidebar-border': '93 18% 13%',
      '--sidebar-ring': '93 67% 48%',
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