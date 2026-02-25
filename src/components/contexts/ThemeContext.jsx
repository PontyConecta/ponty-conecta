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

  const applyTheme = (themeName) => {
    setTheme(themeName);
    const el = document.documentElement;
    el.setAttribute('data-theme', themeName);
    
    // Force browser to recompute styles synchronously
    // This ensures CSS specificity battle is resolved immediately
    void el.offsetHeight;
    
    // Debug proof — runs after paint
    requestAnimationFrame(() => {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--background').trim();
      const fg = cs.getPropertyValue('--foreground').trim();
      const card = cs.getPropertyValue('--card').trim();
      const muted = cs.getPropertyValue('--muted').trim();
      console.log(`[Theme PROOF] data-theme="${el.dataset.theme}" on <${el.tagName.toLowerCase()}>`);
      console.log(`[Theme PROOF] --background: "${bg}"`);
      console.log(`[Theme PROOF] --foreground: "${fg}"`);
      console.log(`[Theme PROOF] --card: "${card}"`);
      console.log(`[Theme PROOF] --muted: "${muted}"`);
      console.log(`[Theme PROOF] body bg computed: "${getComputedStyle(document.body).backgroundColor}"`);
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