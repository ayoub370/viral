import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface ThemeProps {
  onBack: () => void;
}

export default function Theme({ onBack }: ThemeProps) {
  const { preferences, updateTheme, t } = useUserPreferences();
  const [selected, setSelected] = useState('dark');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences?.theme) setSelected(preferences.theme);
  }, [preferences]);

  const handleSelect = async (themeId: string) => {
    if (themeId === selected || saving) return;
    try {
      setSaving(true);
      await updateTheme(themeId);
      setSelected(themeId);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const description = selected === 'dark' ? t('themeNoteDark') : t('themeNoteLight');

  const LightPreview = () => (
    <div
      className="rounded-2xl overflow-hidden p-3 h-[150px] flex flex-col gap-2"
      style={{
        background: '#f2f2f2',
        border: selected === 'light' ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(255,255,255,0.12)',
      }}
    >
      <div className="rounded-[10px] px-2 py-2 flex items-center gap-1.5" style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div className="w-4 h-4 rounded-full" style={{ background: '#ddd' }} />
        <div className="h-1.5 w-[60%] rounded" style={{ background: '#ddd' }} />
      </div>
      <div className="flex-1 rounded-[10px]" style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)' }} />
      <div className="h-6 w-[60%] rounded-[10px]" style={{ background: '#fff' }} />
    </div>
  );

  const DarkPreview = () => (
    <div
      className="rounded-2xl overflow-hidden p-3 h-[150px] flex flex-col gap-2"
      style={{
        background: '#0d0d0d',
        border: selected === 'dark' ? '1px solid #1b4d2e' : '1px solid #1b4d2e',
      }}
    >
      <div
        className="rounded-[10px] px-2 py-2 flex items-center gap-1.5"
        style={{
          background: 'rgba(120,120,120,0.14)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="w-4 h-4 rounded-full" style={{ background: '#3a3a3a' }} />
        <div className="h-1.5 w-[60%] rounded" style={{ background: '#3a3a3a' }} />
      </div>
      <div
        className="flex-1 rounded-[10px]"
        style={{
          background: 'rgba(120,120,120,0.14)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
        }}
      />
      <div className="h-6 w-[60%] rounded-[10px]" style={{ background: '#1b4d2e' }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('themeTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        {/* Options */}
        <div className="flex gap-3.5">
          {/* Light */}
          <button
            onClick={() => handleSelect('light')}
            disabled={saving}
            className="flex-1 outline-none"
          >
            <LightPreview />
            <div className="flex items-center justify-center gap-2 pt-3">
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                style={{
                  border: selected === 'light' ? '1.5px solid #3ddc84' : '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                {selected === 'light' && (
                  <div className="w-[9px] h-[9px] rounded-full" style={{ background: '#3ddc84' }} />
                )}
              </div>
              <span
                className={`text-sm ${selected === 'light' ? 'font-medium' : ''}`}
                style={{ color: selected === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {t('light')}
              </span>
            </div>
          </button>

          {/* Dark */}
          <button
            onClick={() => handleSelect('dark')}
            disabled={saving}
            className="flex-1 outline-none"
          >
            <DarkPreview />
            <div className="flex items-center justify-center gap-2 pt-3">
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                style={{
                  border: selected === 'dark' ? '1.5px solid #3ddc84' : '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                {selected === 'dark' && (
                  <div className="w-[9px] h-[9px] rounded-full" style={{ background: '#3ddc84' }} />
                )}
              </div>
              <span
                className={`text-sm ${selected === 'dark' ? 'font-medium' : ''}`}
                style={{ color: selected === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {t('dark')}
              </span>
            </div>
          </button>
        </div>

        {/* Note */}
        <p className="text-xs leading-relaxed text-center px-1.5 pt-6" style={{ color: 'var(--text-faint)' }}>{description}</p>
      </div>
    </div>
  );
}
