import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/api';
import { getTranslation, type TranslationKey } from '../lib/i18n';

interface UserPreferences {
  language: string;
  theme: string;
  notifications_enabled: boolean;
  two_factor_enabled: boolean;
  two_factor_method: string | null;
  country: string | null;
  phone: string | null;
  notification_settings: Record<string, boolean> | null;
  backup_codes_remaining: number;
  email_searchable: boolean;
  email_verification_code: boolean;
  email_suspicious_alert: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  updateLanguage: (language: string) => Promise<void>;
  updateTheme: (theme: string) => Promise<void>;
  updateNotifications: (enabled: boolean) => Promise<void>;
  updateTwoFactor: (enabled: boolean) => Promise<void>;
  updateTwoFactorMethod: (method: string) => Promise<void>;
  updateCountry: (country: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateNotificationSettings: (settings: Record<string, boolean>) => Promise<void>;
  updateEmailSettings: (settings: { email_searchable?: boolean; email_verification_code?: boolean; email_suspicious_alert?: boolean }) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('language, theme, notifications_enabled, two_factor_enabled, two_factor_method, country, phone, notification_settings, backup_codes_remaining, email_searchable, email_verification_code, email_suspicious_alert')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          language: data.language || 'fr',
          theme: data.theme || 'dark',
          notifications_enabled: data.notifications_enabled ?? true,
          two_factor_enabled: data.two_factor_enabled ?? false,
          two_factor_method: data.two_factor_method || 'app',
          country: data.country || null,
          phone: data.phone || null,
          notification_settings: data.notification_settings || null,
          backup_codes_remaining: data.backup_codes_remaining ?? 10,
          email_searchable: data.email_searchable ?? true,
          email_verification_code: data.email_verification_code ?? true,
          email_suspicious_alert: data.email_suspicious_alert ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        (async () => { await fetchPreferences(); })();
      } else if (event === 'SIGNED_OUT') {
        setPreferences(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const applyTheme = (theme: string | undefined) => {
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    };

    if (preferences) {
      applyTheme(preferences.theme);
    } else {
      const stored = localStorage.getItem('viral_theme');
      applyTheme(stored || 'dark');
    }
  }, [preferences?.theme, preferences]);

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return getTranslation(preferences?.language || 'fr', key, params);
  };

  const updateDb = async (updates: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', user.id);
    if (error) throw error;
  };

  const updateLanguage = async (language: string) => {
    await updateDb({ language });
    setPreferences(prev => prev ? { ...prev, language } : null);
  };

  const updateTheme = async (theme: string) => {
    localStorage.setItem('viral_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    await updateDb({ theme });
    setPreferences(prev => prev ? { ...prev, theme } : null);
  };

  const updateNotifications = async (enabled: boolean) => {
    await updateDb({ notifications_enabled: enabled });
    setPreferences(prev => prev ? { ...prev, notifications_enabled: enabled } : null);
  };

  const updateTwoFactor = async (enabled: boolean) => {
    await updateDb({ two_factor_enabled: enabled });
    setPreferences(prev => prev ? { ...prev, two_factor_enabled: enabled } : null);
  };

  const updateTwoFactorMethod = async (method: string) => {
    await updateDb({ two_factor_method: method });
    setPreferences(prev => prev ? { ...prev, two_factor_method: method } : null);
  };

  const updateCountry = async (country: string) => {
    await updateDb({ country });
    setPreferences(prev => prev ? { ...prev, country } : null);
  };

  const updatePhone = async (phone: string) => {
    await updateDb({ phone });
    setPreferences(prev => prev ? { ...prev, phone } : null);
  };

  const updateNotificationSettings = async (settings: Record<string, boolean>) => {
    await updateDb({ notification_settings: settings });
    setPreferences(prev => prev ? { ...prev, notification_settings: settings } : null);
  };

  const updateEmailSettings = async (settings: { email_searchable?: boolean; email_verification_code?: boolean; email_suspicious_alert?: boolean }) => {
    await updateDb(settings);
    setPreferences(prev => prev ? { ...prev, ...settings } : null);
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        loading,
        t,
        updateLanguage,
        updateTheme,
        updateNotifications,
        updateTwoFactor,
        updateTwoFactorMethod,
        updateCountry,
        updatePhone,
        updateNotificationSettings,
        updateEmailSettings,
        refreshPreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
