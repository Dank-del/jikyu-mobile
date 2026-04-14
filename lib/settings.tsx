import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

export interface Settings {
    themeMode: 'system' | 'light' | 'dark';
    currency: string;
}

const DEFAULT_SETTINGS: Settings = {
    themeMode: 'system',
    currency: 'USD',
};

interface SettingsContextType {
    settings: Settings;
    updateSettings: (partial: Partial<Settings>) => void;
    isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => {},
    isLoaded: false,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                } catch {}
            }
            setIsLoaded(true);
        });
    }, []);

    const updateSettings = useCallback((partial: Partial<Settings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...partial };
            AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
};
