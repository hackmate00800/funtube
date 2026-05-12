import React, { createContext, useState, useEffect, useCallback } from 'react';
import { generatePalette, CUSTOM_THEME_KEY } from '../utils/themes';

export const themes = [
  { id: 'dark', name: 'Dark', mode: 'dark', primary: '#a21caf', description: 'Purple accents on deep dark' },
  { id: 'light', name: 'Light', mode: 'light', primary: '#a21caf', description: 'Purple accents on light' },
  { id: 'ocean', name: 'Ocean', mode: 'dark', primary: '#3b82f6', description: 'Blue tones on dark' },
  { id: 'forest', name: 'Forest', mode: 'dark', primary: '#22c55e', description: 'Green tones on dark' },
  { id: 'sunset', name: 'Sunset', mode: 'dark', primary: '#f97316', description: 'Warm orange on dark' },
  { id: 'midnight', name: 'Midnight', mode: 'dark', primary: '#6366f1', description: 'Deep indigo on dark' },
  { id: 'custom', name: 'Custom', mode: 'dark', primary: '#ffffff', description: 'Your custom colors' },
];

export const ThemeContext = createContext();

const getInitialTheme = () => {
  const saved = localStorage.getItem('funtime-theme');
  return saved && themes.some((t) => t.id === saved) ? saved : 'dark';
};

const applyPalette = (palette) => {
  const root = document.documentElement;
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  for (const level of levels) {
    root.style.setProperty(`--color-primary-${level}`, palette[level]);
  }
};

const clearCustomPalette = () => {
  const root = document.documentElement;
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  for (const level of levels) {
    root.style.removeProperty(`--color-primary-${level}`);
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  const applyTheme = useCallback((t) => {
    const cfg = themes.find((x) => x.id === t);
    const root = document.documentElement;
    root.setAttribute('data-theme', t);

    if (t === 'custom') {
      const saved = localStorage.getItem(CUSTOM_THEME_KEY);
      if (saved) {
        try {
          applyPalette(JSON.parse(saved));
        } catch { }
      }
      root.classList.add('dark');
    } else {
      clearCustomPalette();
      if (cfg?.mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('funtime-theme', t);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = (t) => {
    if (themes.some((x) => x.id === t)) {
      setThemeState(t);
    }
  };

  const toggleTheme = () => {
    const cur = themes.find((x) => x.id === theme);
    const next = cur?.mode === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const setCustomPalette = (hexColor) => {
    const palette = generatePalette(hexColor);
    localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(palette));
    if (theme === 'custom') {
      applyPalette(palette);
    }
    return palette;
  };

  const current = themes.find((x) => x.id === theme);
  const isDark = current ? current.mode === 'dark' : true;

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, themes, isDark, toggleTheme, setCustomPalette,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
