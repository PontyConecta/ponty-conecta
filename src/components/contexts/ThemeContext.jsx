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
      '--background': '270 5% 97%',
      '--foreground': '270 22% 14%',
      '--card': '0 0% 100%',
      '--card-foreground': '270 22% 14%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '270 22% 14%',
      '--primary': '270 16% 56%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '270 10% 93%',
      '--secondary-foreground': '270 22% 14%',
      '--muted': '270 8% 91%',
      '--muted-foreground': '270 10% 50%',
      '--accent': '270 16% 56%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 84% 60%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '270 8% 88%',
      '--input': '270 8% 86%',
      '--ring': '270 16% 56%',
      '--radius': '0.75rem',
      '--chart-1': '270 16% 56%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%',
      '--sidebar-background': '0 0% 100%',
      '--sidebar-foreground': '270 22% 14%',
      '--sidebar-primary': '270 16% 56%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '270 10% 95%',
      '--sidebar-accent-foreground': '270 22% 14%',
      '--sidebar-border': '270 8% 88%',
      '--sidebar-ring': '270 16% 56%',
    },
    dark: {
      '--background': '270 28% 7%',
      '--foreground': '270 8% 92%',
      '--card': '270 22% 11%',
      '--card-foreground': '270 8% 92%',
      '--popover': '270 22% 11%',
      '--popover-foreground': '270 8% 92%',
      '--primary': '270 20% 67%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '270 18% 16%',
      '--secondary-foreground': '270 8% 88%',
      '--muted': '270 14% 18%',
      '--muted-foreground': '270 8% 56%',
      '--accent': '270 20% 67%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '270 14% 16%',
      '--input': '270 14% 18%',
      '--ring': '270 20% 67%',
      '--radius': '0.75rem',
      '--chart-1': '270 20% 67%',
      '--chart-2': '160 55% 42%',
      '--chart-3': '30 75% 55%',
      '--chart-4': '280 60% 62%',
      '--chart-5': '340 70% 58%',
      '--sidebar-background': '270 22% 10%',
      '--sidebar-foreground': '270 8% 92%',
      '--sidebar-primary': '270 20% 67%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '270 14% 14%',
      '--sidebar-accent-foreground': '270 8% 90%',
      '--sidebar-border': '270 14% 16%',
      '--sidebar-ring': '270 20% 67%',
    },
    neon: {
      '--background': '270 45% 5%',
      '--foreground': '270 10% 94%',
      '--card': '270 35% 9%',
      '--card-foreground': '270 10% 94%',
      '--popover': '270 35% 9%',
      '--popover-foreground': '270 10% 94%',
      '--primary': '270 30% 72%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '270 28% 12%',
      '--secondary-foreground': '270 10% 92%',
      '--muted': '270 22% 14%',
      '--muted-foreground': '270 10% 55%',
      '--accent': '270 30% 72%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 72% 55%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '270 18% 13%',
      '--input': '270 20% 15%',
      '--ring': '270 30% 72%',
      '--radius': '0.75rem',
      '--chart-1': '270 30% 72%',
      '--chart-2': '170 55% 42%',
      '--chart-3': '35 80% 58%',
      '--chart-4': '200 65% 62%',
      '--chart-5': '345 70% 58%',
      '--sidebar-background': '270 35% 9%',
      '--sidebar-foreground': '270 10% 94%',
      '--sidebar-primary': '270 30% 72%',
      '--sidebar-primary-foreground': '0 0% 100%',
      '--sidebar-accent': '270 22% 12%',
      '--sidebar-accent-foreground': '270 10% 92%',
      '--sidebar-border': '270 18% 13%',
      '--sidebar-ring': '270 30% 72%',
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