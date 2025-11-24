import React, { createContext, useState, useContext, ReactNode } from 'react';

type ColorScheme = 'blue' | 'purple' | 'green' | 'orange';

type ThemeContextType = {
  isDarkMode: boolean;
  colorScheme: ColorScheme;
  toggleDarkMode: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
};

const colorSchemes = {
  blue: {
    primary: '#2563eb',
    primaryDark: '#1e40af',
    primaryLight: '#93c5fd',
  },
  purple: {
    primary: '#9333ea',
    primaryDark: '#7e22ce',
    primaryLight: '#c084fc',
  },
  green: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#86efac',
  },
  orange: {
    primary: '#ea580c',
    primaryDark: '#c2410c',
    primaryLight: '#fdba74',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('blue');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const schemeColors = colorSchemes[colorScheme];

  const colors = {
    ...schemeColors,
    background: isDarkMode ? '#111827' : '#f9fafb',
    surface: isDarkMode ? '#1f2937' : '#ffffff',
    text: isDarkMode ? '#f9fafb' : '#111827',
    textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
    border: isDarkMode ? '#374151' : '#e5e7eb',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, colorScheme, toggleDarkMode, setColorScheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
