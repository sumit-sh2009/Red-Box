import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName } from '../types/index.js';
import { sound } from '../utils/sound.js';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  crtEffect: boolean;
  setCrtEffect: (val: boolean | ((prev: boolean) => boolean)) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem('pixel_theme');
    if (stored === 'gameboy') return 'civic';
    if (stored === 'arcade' || stored === 'nes' || stored === 'cyberpunk' || stored === 'civic') {
      return stored;
    }
    return 'civic';
  });

  const [crtEffect, setCrtEffectState] = useState<boolean>(() => {
    return false;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('pixel_sfx');
    return stored !== 'false'; // default true
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pixel_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (crtEffect) {
      document.body.classList.add('crt-effect');
      localStorage.setItem('pixel_crt', 'true');
    } else {
      document.body.classList.remove('crt-effect');
      localStorage.setItem('pixel_crt', 'false');
    }
  }, [crtEffect]);

  useEffect(() => {
    sound.setEnabled(soundEnabled);
    localStorage.setItem('pixel_sfx', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    sound.playTab();
  };

  const setCrtEffect = (val: boolean | ((prev: boolean) => boolean)) => {
    setCrtEffectState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      sound.playClick();
      return next;
    });
  };

  const setSoundEnabled = (val: boolean | ((prev: boolean) => boolean)) => {
    setSoundEnabledState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (next) {
        sound.setEnabled(true);
        sound.playLike();
      } else {
        sound.setEnabled(false);
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        crtEffect,
        setCrtEffect,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
