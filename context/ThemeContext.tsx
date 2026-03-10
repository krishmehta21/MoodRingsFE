import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, DarkColors, LightColors, ColorScheme } from '../constants/ThemeColors';
export { ThemeMode };

interface ThemeContextValue {
  mode: ThemeMode;           // what user selected: dark | light | system
  colors: ColorScheme;       // the resolved color set to use right now
  isDark: boolean;           // convenience boolean
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  colors: DarkColors,
  isDark: true,
  setMode: () => {},
});

const STORAGE_KEY = 'moodrings_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setModeState(saved as ThemeMode);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  };

  // Resolve which color set to actually use
  const resolvedIsDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme === 'dark'; // system fallback

  const colors = resolvedIsDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark: resolvedIsDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
