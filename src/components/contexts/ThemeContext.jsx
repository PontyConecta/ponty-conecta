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
    // Persist canonical name if it was legacy
    if (raw !== safe) localStorage.setItem('ponty-theme', safe);
    setTheme(safe);
    document.documentElement.setAttribute('data-theme', safe);
  }, []);

  const changeTheme = (newTheme) => {
    const safe = normalizeTheme(newTheme);
    setTheme(safe);
    localStorage.setItem('ponty-theme', safe);
    document.documentElement.setAttribute('data-theme', safe);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};