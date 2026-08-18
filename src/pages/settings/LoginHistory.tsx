import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import type { TranslationKey } from '../../lib/i18n';

interface LoginHistoryProps {
  onBack: () => void;
}

interface LoginRecord {
  id: string;
  login_date: string;
  ip_address: string;
  city: string;
  country: string;
  device_info: string;
  status?: string;
}

function formatRelativeDate(dateStr: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);

  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

    if (diffD === 0 && diffH < 24) {
    if (diffH < 1) return `${t('today')}, ${time}`;
    return `${t('today')}, ${time}`;
  }
  if (diffD === 1) return `${t('yesterday')}, ${time}`;
  if (diffD < 7) return `${t('daysAgo', { d: diffD })}, ${time}`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date) + `, ${time}`;
}

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function LoginHistory({ onBack }: LoginHistoryProps) {
  const { t } = useUserPreferences();
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('login_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('historyTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('recentLogins')}</div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid var(--spinner-border)', borderTopColor: 'var(--spinner-active)' }} />
            <p className="text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl overflow-hidden" style={glassStyle}>
            <div className="px-4 py-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('noLogins')}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden mb-5" style={glassStyle}>
            {history.map((record, idx) => {
              const isWarn = record.status === 'warn';
              const strokeColor = isWarn ? '#c98a3a' : '#3ddc84';
              const location = [record.city, record.country].filter(Boolean).join(', ') || t('unknownLocation');

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-4 py-[13px]"
                  style={{
                    borderBottom: idx < history.length - 1 ? 'var(--divider-border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-[19px] h-[19px] flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {isWarn ? (
                        <>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </>
                      ) : (
                        <polyline points="20 6 9 17 4 12" />
                      )}
                    </svg>
                    <div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{record.device_info || t('unknownDevice')}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {location} · {formatRelativeDate(record.login_date, t)}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[11px] flex-shrink-0"
                    style={{ color: isWarn ? '#c98a3a' : '#3ddc84' }}
                  >
                    {isWarn ? t('checkLogin') : t('successLogin')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
