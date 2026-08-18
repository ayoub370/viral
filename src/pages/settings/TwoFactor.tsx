import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { supabase } from '../../lib/api';

interface TwoFactorProps {
  onBack: () => void;
}

type Method = 'app' | 'sms' | 'email';

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-block w-[46px] h-[26px] flex-shrink-0"
    >
      <span
        className="absolute inset-0 rounded-[26px] transition-all duration-200"
        style={{ background: checked ? '#1b4d2e' : 'var(--switch-off-bg)' }}
      />
      <span
        className="absolute top-[3px] w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left: checked ? '23px' : '3px',
          background: checked ? '#eafbf0' : 'var(--switch-off-knob)',
        }}
      />
    </button>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        border: selected ? '1.5px solid #3ddc84' : `1.5px solid var(--radio-border)`,
      }}
    >
      {selected && <div className="w-[9px] h-[9px] rounded-full" style={{ background: '#3ddc84' }} />}
    </div>
  );
}

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function TwoFactor({ onBack }: TwoFactorProps) {
  const { preferences, updateTwoFactor, updateTwoFactorMethod, updatePhone, t } = useUserPreferences();
  const [enabled, setEnabled] = useState(false);
  const [method, setMethod] = useState<Method>('app');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('Non défini');
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPhoneEditor, setShowPhoneEditor] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.two_factor_enabled);
      setMethod((preferences.two_factor_method as Method) || 'app');
      setBackupCodesRemaining(preferences.backup_codes_remaining ?? 10);
      setUserPhone(preferences.phone || 'Non défini');
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, [preferences]);

  const handleToggle = async (v: boolean) => {
    if (!v) {
      setShowConfirmDialog(true);
      return;
    }
    try {
      setLoading(true);
      await updateTwoFactor(true);
      setEnabled(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async () => {
    try {
      setLoading(true);
      await updateTwoFactor(false);
      setEnabled(false);
      setShowConfirmDialog(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = async (m: Method) => {
    if (!enabled) return;
    setMethod(m);
    try {
      await updateTwoFactorMethod(m);
    } catch (e) {
      console.error('Error saving 2FA method:', e);
    }
  };

  const handleSavePhone = async () => {
    try {
      setPhoneSaving(true);
      await updatePhone(phoneInput);
      setUserPhone(phoneInput || 'Non défini');
      setShowPhoneEditor(false);
      setPhoneInput('');
    } catch (e) {
      console.error('Error saving phone:', e);
    } finally {
      setPhoneSaving(false);
    }
  };

  const methods: { id: Method; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'app',
      label: t('authApp'),
      sub: t('authAppSub'),
      icon: (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      ),
    },
    {
      id: 'sms',
      label: t('sms'),
      sub: userPhone,
      icon: (
        <>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </>
      ),
    },
    {
      id: 'email',
      label: t('email'),
      sub: userEmail || '—',
      icon: (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 6l10 7 10-7" />
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('twoFactorTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        <div
          className="flex items-center justify-between px-4 py-[14px] mb-1.5 rounded-2xl"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: 'var(--glass-border-accent)',
          }}
        >
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {enabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {enabled ? t('twoFactorEnabledSub') : t('twoFactorDisabledSub')}
              </div>
            </div>
          </div>
          <Switch checked={enabled} onChange={handleToggle} />
        </div>
        <p className="text-[11px] leading-relaxed px-1.5 pb-5" style={{ color: 'var(--text-faint)' }}>
          {t('twoFactorDesc')}
        </p>

        {enabled && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-5"
            style={{ background: 'rgba(201,138,58,0.1)', border: '0.5px solid rgba(201,138,58,0.3)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#c98a3a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-[11px]" style={{ color: '#c98a3a' }}>{t('comingSoon')}</span>
          </div>
        )}

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('verificationMethod')}</div>
        <div className="rounded-2xl overflow-hidden mb-6" style={glassStyle}>
          {methods.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => handleMethodChange(m.id)}
              disabled={!enabled}
              className="w-full flex items-center justify-between px-4 py-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderBottom: idx < methods.length - 1 ? 'var(--divider-border)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  {m.icon}
                </svg>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.sub}</div>
                </div>
              </div>
              <Radio selected={method === m.id && enabled} />
            </button>
          ))}
        </div>

        {enabled && method === 'sms' && (
          <div className="mb-6">
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('sms')}</div>
            {showPhoneEditor ? (
              <div className="rounded-2xl overflow-hidden" style={glassStyle}>
                <div className="px-4 py-3">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--input-text)' }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={handleSavePhone}
                    disabled={phoneSaving}
                    className="flex-1 rounded-[10px] py-2.5 text-sm font-medium disabled:opacity-50"
                    style={{ background: '#1b4d2e', color: '#eafbf0' }}
                  >
                    {phoneSaving ? t('saving') : t('save')}
                  </button>
                  <button
                    onClick={() => { setShowPhoneEditor(false); setPhoneInput(''); }}
                    className="flex-1 rounded-[10px] py-2.5 text-sm font-medium"
                    style={{ background: 'var(--switch-off-bg)', color: 'var(--text-secondary)' }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setShowPhoneEditor(true); setPhoneInput(userPhone !== 'Non défini' ? userPhone : ''); }}
                className="w-full rounded-2xl px-4 py-[13px] flex items-center justify-between transition-colors"
                style={glassStyle}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{userPhone}</span>
                <span className="text-xs" style={{ color: '#3ddc84' }}>{userPhone === 'Non défini' ? t('connect') : t('save')}</span>
              </button>
            )}
          </div>
        )}

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('backup')}</div>
        <div className="rounded-2xl overflow-hidden mb-3" style={glassStyle}>
          <div className="flex items-center justify-between px-4 py-[13px]">
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="15" r="4" />
                <path d="M10.5 12.5L20 3" />
                <path d="M17 6l3 3" />
                <path d="M14 9l2 2" />
              </svg>
              <div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('backupCodes')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {backupCodesRemaining} {t('backupCodesRemaining')}
                </div>
              </div>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>

        <div className="flex items-start gap-2 px-1.5 pt-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="#c98a3a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {t('backupWarning')}
          </span>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: 'var(--overlay-bg)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: 'var(--modal-bg)', border: '0.5px solid var(--modal-border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('disable2FA')}</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              {t('disable2FADesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 rounded-full text-sm font-semibold"
                style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-primary)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDisable}
                disabled={loading}
                className="flex-1 py-3 rounded-full text-white text-sm font-semibold bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {t('disable')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
