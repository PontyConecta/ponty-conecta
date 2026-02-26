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
      '--primary': '268 94% 58%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '220 14% 95%',
      '--secondary-foreground': '224 24% 12%',
      '--muted': '220 14% 93%',
      '--muted-foreground': '220 10% 46%',
      '--accent': '268 94% 58%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 84% 60%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '220 13% 91%',
      '--input': '220 13% 89%',
      '--ring': '268 94% 58%',
      '--radius': '0.75rem',
      '--chart-1': '268 94% 58%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%',
      '--sidebar-background': '0 0% 100%',
      '--sidebar-foreground': '224 71% 4%',
      '--sidebar-primary': '268 94% 58%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '268 94% 97%',
      '--sidebar-accent-foreground': '224 71% 4%',
      '--sidebar-border': '250 12% 90%',
      '--sidebar-ring': '268 94% 58%',
    },
    dark: {
      '--background': '230 25% 5%',
      '--foreground': '220 20% 93%',
      '--card': '230 20% 9%',
      '--card-foreground': '220 20% 93%',
      '--popover': '230 20% 9%',
      '--popover-foreground': '220 20% 93%',
      '--primary': '268 80% 72%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '230 18% 13%',
      '--secondary-foreground': '220 20% 90%',
      '--muted': '230 14% 15%',
      '--muted-foreground': '220 12% 55%',
      '--accent': '268 80% 72%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '230 12% 14%',
      '--input': '230 14% 16%',
      '--ring': '268 75% 68%',
      '--radius': '0.75rem',
      '--chart-1': '268 80% 72%',
      '--chart-2': '160 55% 42%',
      '--chart-3': '30 75% 55%',
      '--chart-4': '280 60% 62%',
      '--chart-5': '340 70% 58%',
      '--sidebar-background': '230 20% 9%',
      '--sidebar-foreground': '220 20% 93%',
      '--sidebar-primary': '268 80% 72%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '230 14% 14%',
      '--sidebar-accent-foreground': '220 20% 90%',
      '--sidebar-border': '230 12% 14%',
      '--sidebar-ring': '268 75% 68%',
    },
    neon: {
      '--background': '268 40% 4%',
      '--foreground': '270 15% 94%',
      '--card': '268 32% 8%',
      '--card-foreground': '270 15% 94%',
      '--popover': '268 32% 8%',
      '--popover-foreground': '270 15% 94%',
      '--primary': '270 100% 68%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '268 28% 12%',
      '--secondary-foreground': '270 15% 92%',
      '--muted': '268 22% 14%',
      '--muted-foreground': '270 10% 55%',
      '--accent': '270 100% 68%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '268 18% 13%',
      '--input': '268 20% 15%',
      '--ring': '270 100% 68%',
      '--radius': '0.75rem',
      '--chart-1': '270 100% 68%',
      '--chart-2': '170 55% 42%',
      '--chart-3': '35 80% 58%',
      '--chart-4': '290 65% 62%',
      '--chart-5': '345 70% 58%',
      '--sidebar-background': '268 32% 8%',
      '--sidebar-foreground': '270 15% 94%',
      '--sidebar-primary': '270 100% 68%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '268 22% 12%',
      '--sidebar-accent-foreground': '270 15% 92%',
      '--sidebar-border': '268 18% 13%',
      '--sidebar-ring': '270 100% 68%',
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