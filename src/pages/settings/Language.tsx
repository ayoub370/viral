import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface LanguageProps {
  onBack: () => void;
}

const languages: { flag: string; name: string; sub: string; locale: string }[] = [
  { flag: '🇫🇷', name: 'Français', sub: 'France', locale: 'fr' },
  { flag: '🇬🇧', name: 'English', sub: 'Anglais', locale: 'en' },
  { flag: '🇪🇸', name: 'Español', sub: 'Espagnol', locale: 'es' },
  { flag: '🇩🇪', name: 'Deutsch', sub: 'Allemand', locale: 'de' },
  { flag: '🇵🇹', name: 'Português', sub: 'Portugais', locale: 'pt' },
  { flag: '🇮🇹', name: 'Italiano', sub: 'Italien', locale: 'it' },
  { flag: '🇸🇦', name: 'العربية', sub: 'Arabe', locale: 'ar' },
  { flag: '🇹🇷', name: 'Türkçe', sub: 'Turc', locale: 'tr' },
  { flag: '🇨🇳', name: '中文', sub: 'Chinois', locale: 'zh' },
  { flag: '🇯🇵', name: '日本語', sub: 'Japonais', locale: 'ja' },
  { flag: '🇰🇷', name: '한국어', sub: 'Coréen', locale: 'ko' },
  { flag: '🇷🇺', name: 'Русский', sub: 'Russe', locale: 'ru' },
  { flag: '🇮🇳', name: 'हिन्दी', sub: 'Hindi', locale: 'hi' },
  { flag: '🇳🇱', name: 'Nederlands', sub: 'Néerlandais', locale: 'nl' },
  { flag: '🇵🇱', name: 'Polski', sub: 'Polonais', locale: 'pl' },
  { flag: '🇸🇪', name: 'Svenska', sub: 'Suédois', locale: 'sv' },
  { flag: '🇳🇴', name: 'Norsk', sub: 'Norvégien', locale: 'no' },
  { flag: '🇩🇰', name: 'Dansk', sub: 'Danois', locale: 'da' },
  { flag: '🇫🇮', name: 'Suomi', sub: 'Finnois', locale: 'fi' },
  { flag: '🇬🇷', name: 'Ελληνικά', sub: 'Grec', locale: 'el' },
  { flag: '🇺🇦', name: 'Українська', sub: 'Ukrainien', locale: 'uk' },
  { flag: '🇷🇴', name: 'Română', sub: 'Roumain', locale: 'ro' },
  { flag: '🇭🇺', name: 'Magyar', sub: 'Hongrois', locale: 'hu' },
  { flag: '🇹🇭', name: 'ไทย', sub: 'Thaï', locale: 'th' },
  { flag: '🇻🇳', name: 'Tiếng Việt', sub: 'Vietnamien', locale: 'vi' },
  { flag: '🇮🇩', name: 'Bahasa Indonesia', sub: 'Indonésien', locale: 'id' },
  { flag: '🇲🇾', name: 'Bahasa Melayu', sub: 'Malais', locale: 'ms' },
  { flag: '🇧🇩', name: 'বাংলা', sub: 'Bengali', locale: 'bn' },
];

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

const glassAccentStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border-accent)',
};

export default function Language({ onBack }: LanguageProps) {
  const { preferences, updateLanguage, t } = useUserPreferences();
  const [selectedLocale, setSelectedLocale] = useState('fr');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences?.language) setSelectedLocale(preferences.language);
  }, [preferences]);

  const handleSelect = async (locale: string) => {
    if (saving) return;
    try {
      setSaving(true);
      await updateLanguage(locale);
      setSelectedLocale(locale);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const current = languages.find((l) => l.locale === selectedLocale) ?? languages[0];
  const query = search.toLowerCase();
  const others = languages.filter(
    (l) =>
      l.locale !== selectedLocale &&
      (l.name.toLowerCase().includes(query) || l.sub.toLowerCase().includes(query))
  );
  const currentMatchesSearch =
    current.name.toLowerCase().includes(query) || current.sub.toLowerCase().includes(query);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-4 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('languageTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 mb-4 rounded-[14px]" style={glassStyle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth={1.8} strokeLinecap="round" className="w-[17px] h-[17px] flex-shrink-0">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchLanguage')}
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: 'var(--input-text)' }}
          />
        </div>

        {currentMatchesSearch && (
          <div className="mb-5">
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('currentLanguage')}</div>
            <div className="flex items-center justify-between px-4 py-[14px] rounded-2xl" style={glassAccentStyle}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{current.flag}</span>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{current.name}</div>
                  <div className="text-xs mt-px" style={{ color: 'var(--text-tertiary)' }}>{current.sub}</div>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth={2} strokeLinecap="round" className="w-[18px] h-[18px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('allLanguages')}</div>
            <div className="rounded-2xl overflow-hidden" style={glassStyle}>
              {others.map((lang, idx) => (
                <button
                  key={lang.locale}
                  onClick={() => handleSelect(lang.locale)}
                  disabled={saving}
                  className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors"
                  style={{
                    borderBottom: idx < others.length - 1 ? 'var(--divider-border)' : 'none',
                  }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lang.name}</div>
                    <div className="text-xs mt-px" style={{ color: 'var(--text-muted)' }}>{lang.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {others.length === 0 && !currentMatchesSearch && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-label)' }}>Aucune langue trouvée</p>
        )}
      </div>
    </div>
  );
}
