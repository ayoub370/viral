import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface CountryProps {
  onBack: () => void;
  currentCountry?: string;
}

const countries: { flag: string; name: string; code: string }[] = [
  { flag: '🇫🇷', name: 'France', code: 'FR' },
  { flag: '🇧🇪', name: 'Belgique', code: 'BE' },
  { flag: '🇨🇭', name: 'Suisse', code: 'CH' },
  { flag: '🇨🇦', name: 'Canada', code: 'CA' },
  { flag: '🇲🇦', name: 'Maroc', code: 'MA' },
  { flag: '🇩🇿', name: 'Algérie', code: 'DZ' },
  { flag: '🇹🇳', name: 'Tunisie', code: 'TN' },
  { flag: '🇸🇳', name: 'Sénégal', code: 'SN' },
  { flag: "🇨🇮", name: "Côte d'Ivoire", code: 'CI' },
  { flag: '🇬🇧', name: 'Royaume-Uni', code: 'GB' },
  { flag: '🇺🇸', name: 'États-Unis', code: 'US' },
  { flag: '🇩🇪', name: 'Allemagne', code: 'DE' },
  { flag: '🇪🇸', name: 'Espagne', code: 'ES' },
  { flag: '🇮🇹', name: 'Italie', code: 'IT' },
  { flag: '🇵🇹', name: 'Portugal', code: 'PT' },
  { flag: '🇳🇱', name: 'Pays-Bas', code: 'NL' },
  { flag: '🇧🇷', name: 'Brésil', code: 'BR' },
  { flag: '🇲🇽', name: 'Mexique', code: 'MX' },
  { flag: '🇨🇲', name: 'Cameroun', code: 'CM' },
  { flag: '🇬🇳', name: 'Guinée', code: 'GN' },
  { flag: '🇲🇱', name: 'Mali', code: 'ML' },
  { flag: '🇧🇫', name: 'Burkina Faso', code: 'BF' },
  { flag: '🇳🇪', name: 'Niger', code: 'NE' },
  { flag: '🇨🇩', name: 'Congo (RDC)', code: 'CD' },
  { flag: '🇨🇬', name: 'Congo-Brazzaville', code: 'CG' },
  { flag: '🇬🇦', name: 'Gabon', code: 'GA' },
  { flag: '🇷🇺', name: 'Russie', code: 'RU' },
  { flag: '🇨🇳', name: 'Chine', code: 'CN' },
  { flag: '🇯🇵', name: 'Japon', code: 'JP' },
  { flag: '🇮🇳', name: 'Inde', code: 'IN' },
  { flag: '🇦🇺', name: 'Australie', code: 'AU' },
  { flag: '🇿🇦', name: 'Afrique du Sud', code: 'ZA' },
  { flag: '🇳🇬', name: 'Nigeria', code: 'NG' },
  { flag: '🇬🇭', name: 'Ghana', code: 'GH' },
  { flag: '🇹🇷', name: 'Turquie', code: 'TR' },
  { flag: '🇸🇦', name: 'Arabie Saoudite', code: 'SA' },
  { flag: '🇦🇪', name: 'Émirats Arabes Unis', code: 'AE' },
  { flag: '🇪🇬', name: 'Égypte', code: 'EG' },
  { flag: '🇱🇧', name: 'Liban', code: 'LB' },
  { flag: '🇦🇷', name: 'Argentine', code: 'AR' },
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

export default function Country({ onBack, currentCountry = 'France' }: CountryProps) {
  const { updateCountry, t } = useUserPreferences();
  const [selected, setSelected] = useState(currentCountry);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected(currentCountry);
  }, [currentCountry]);

  const query = search.toLowerCase();
  const others = countries.filter(
    (c) => c.name !== selected && c.name.toLowerCase().includes(query)
  );
  const current = countries.find((c) => c.name === selected);
  const currentMatchesSearch = current ? current.name.toLowerCase().includes(query) : false;

  const handleSelect = async (name: string) => {
    setSelected(name);
    try {
      await updateCountry(name);
    } catch (e) {
      console.error('Error saving country:', e);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-4 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('countryTitle')}</span>
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
            placeholder={t('searchCountry')}
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: 'var(--input-text)' }}
          />
        </div>

        {current && currentMatchesSearch && (
          <div className="mb-5">
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('currentCountry')}</div>
            <div className="flex items-center justify-between px-4 py-[14px] rounded-2xl" style={glassAccentStyle}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{current.flag}</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{current.name}</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth={2} strokeLinecap="round" className="w-[18px] h-[18px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('allCountries')}</div>
            <div className="rounded-2xl overflow-hidden" style={glassStyle}>
              {others.map((c, idx) => (
                <button
                  key={c.code}
                  onClick={() => handleSelect(c.name)}
                  className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors"
                  style={{
                    borderBottom: idx < others.length - 1 ? 'var(--divider-border)' : 'none',
                  }}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {others.length === 0 && !currentMatchesSearch && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-label)' }}>Aucun pays trouvé</p>
        )}
      </div>
    </div>
  );
}
