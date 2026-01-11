import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const light = {
    name: 'light',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111111',
    subtext: '#666666',
    border: '#E3E3E3',
    primary: '#51225B',
    primarySoft: '#BA93CA',
    primarySoftAlt: '#E8D5EE',
    overlay: 'rgba(0,0,0,0.4)',
};

const dark = {
    name: 'dark',
    background: '#0F0F10',
    card: '#1A1B1E',
    text: '#F2F2F2',
    subtext: '#B5B5B5',
    border: '#2E2F33',
    primary: '#BA93CA',
    primarySoft: '#8B00C4',
    primarySoftAlt: '#2A2230',
    overlay: 'rgba(0,0,0,0.6)',
};

const ThemeContext = createContext({
    theme: light,
    mode: 'light',
    setMode: () => { },
    toggle: () => { },
});

export function ThemeProvider({ children }) {
    const system = useColorScheme();
    const [mode, setMode] = useState(system || 'light');

    const theme = useMemo(() => (mode === 'dark' ? dark : light), [mode]);
    const value = useMemo(() => ({
        theme,
        mode,
        setMode,
        toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }), [theme, mode]);

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export const themes = { light, dark };
