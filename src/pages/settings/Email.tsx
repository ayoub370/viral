import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import { isPasswordLeaked } from '../../lib/hibp';

interface EmailProps {
  onBack: () => void;
}

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

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function Email({ onBack }: EmailProps) {
  const { preferences, updateEmailSettings, t } = useUserPreferences();
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchable, setSearchable] = useState(true);
  const [emailVerificationCode, setEmailVerificationCode] = useState(true);
  const [alertSuspicious, setAlertSuspicious] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' });
  const [pwError, setPwError] = useState('');
  const [pwToast, setPwToast] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        setVerified(!!user.email_confirmed_at);
        setCreatedAt(user.created_at || null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (preferences) {
      setSearchable(preferences.email_searchable);
      setEmailVerificationCode(preferences.email_verification_code);
      setAlertSuspicious(preferences.email_suspicious_alert);
    }
  }, [preferences]);

  const handleToggle = async (key: 'email_searchable' | 'email_verification_code' | 'email_suspicious_alert', value: boolean) => {
    if (key === 'email_searchable') setSearchable(value);
    if (key === 'email_verification_code') setEmailVerificationCode(value);
    if (key === 'email_suspicious_alert') setAlertSuspicious(value);
    try {
      await updateEmailSettings({ [key]: value });
    } catch (e) {
      console.error('Error saving email setting:', e);
    }
  };

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleChangeEmail = async () => {
    setMessage({ type: '', text: '' });
    if (!newEmail) return setMessage({ type: 'error', text: t('enterNewEmail') });
    if (!isValidEmail(newEmail)) return setMessage({ type: 'error', text: t('invalidEmail') });
    if (newEmail === email) return setMessage({ type: 'error', text: t('invalidEmail') });
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setMessage({ type: 'success', text: t('emailSent') });
      setNewEmail('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || t('invalidEmail') });
    } finally {
      setSaving(false);
    }
  };

  function passwordStrength(pw: string): number {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  const strengthScore = passwordStrength(newPassword);
  const strengthLabels = t('passwordStrength') as unknown as string[];
  const strengthLabel = newPassword ? (strengthLabels[strengthScore - 1] || strengthLabels[0]) : '—';

  const handleChangePassword = async () => {
    setPwError('');
    setPwMessage({ type: '', text: '' });
    if (!currentPassword) { setPwError(t('fillAllFields')); return; }
    if (newPassword.length < 8) { setPwError(t('passwordTooShort')); return; }
    if (newPassword !== confirmPassword) { setPwError(t('passwordsDontMatch')); return; }
    try {
      setPwSaving(true);
      const leaked = await isPasswordLeaked(newPassword);
      if (leaked) { setPwError(t('passwordLeaked')); return; }
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) { setPwError(t('passwordIncorrect')); return; }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwToast(true);
      setTimeout(() => setPwToast(false), 1800);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPwError(e.message || t('passwordIncorrect'));
    } finally {
      setPwSaving(false);
    }
  };

  const verifiedDate = (() => {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    const now = new Date();
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (months <= 0) return 'récemment';
    if (months === 1) return 'il y a 1 mois';
    return `il y a ${months} mois`;
  })();

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('emailAddress')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        <div className="flex items-center justify-between px-4 py-[14px] mb-2 rounded-2xl" style={glassStyle}>
          <div className="flex items-center gap-3">
            <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 6l10 7 10-7" />
            </svg>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {loading ? '—' : email || t('notDefined')}
            </span>
          </div>
          {verified && (
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                background: 'rgba(27,77,46,0.35)',
                border: '0.5px solid #1b4d2e',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth={2} strokeLinecap="round" className="w-[13px] h-[13px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[11px]" style={{ color: '#3ddc84' }}>{t('verified')}</span>
            </div>
          )}
        </div>
        <p className="text-[11px] leading-relaxed px-1.5 pb-5" style={{ color: 'var(--text-faint)' }}>
          {verified
            ? `${t('verified')} ${verifiedDate}.`
            : `${t('notVerified')}.`}
        </p>

        <div className="mb-5">
          <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('changeEmail')}</div>
          <div className="rounded-2xl overflow-hidden" style={glassStyle}>
            <div className="px-4 py-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvel@email.com"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--input-text)' }}
              />
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm mb-5 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleChangeEmail}
          disabled={saving}
          className="w-full rounded-[14px] py-[14px] text-[15px] font-medium mb-6 transition-colors disabled:opacity-50"
          style={{ background: '#1b4d2e', color: '#eafbf0' }}
        >
          {saving ? t('saving') : t('updateEmail')}
        </button>

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('searchPrivacy')}</div>
        <div className="rounded-2xl overflow-hidden mb-6" style={glassStyle}>
          <div className="flex items-center justify-between px-4 py-[13px]">
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="6" />
                <line x1="21" y1="21" x2="15" y2="15" />
              </svg>
              <div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('allowFindEmail')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('allowFindEmailSub')}</div>
              </div>
            </div>
            <Switch checked={searchable} onChange={(v) => handleToggle('email_searchable', v)} />
          </div>
        </div>

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('securityRecovery')}</div>
        <div className="rounded-2xl overflow-hidden mb-6" style={glassStyle}>
          <div className="flex items-center justify-between px-4 py-[13px]" style={{ borderBottom: 'var(--divider-border)' }}>
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('recoveryEmail')}</span>
            </div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3ddc84" strokeWidth={2} strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="flex items-center justify-between px-4 py-[13px]" style={{ borderBottom: 'var(--divider-border)' }}>
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="16" r="1" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('emailVerificationCode')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('emailVerificationCodeSub')}</div>
              </div>
            </div>
            <Switch checked={emailVerificationCode} onChange={(v) => handleToggle('email_verification_code', v)} />
          </div>

          <div className="flex items-center justify-between px-4 py-[13px]">
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('suspiciousAlert')}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('suspiciousAlertSub')}</div>
              </div>
            </div>
            <Switch checked={alertSuspicious} onChange={(v) => handleToggle('email_suspicious_alert', v)} />
          </div>
        </div>

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('modifyPassword')}</div>
        <div className="rounded-2xl overflow-hidden mb-2" style={glassStyle}>
          <div className="px-4 py-3" style={{ borderBottom: 'var(--divider-border)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('currentPassword')}</div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--input-text)' }}
            />
          </div>
          <div className="px-4 py-3" style={{ borderBottom: 'var(--divider-border)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('newPassword')}</div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--input-text)' }}
            />
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('confirmPassword')}</div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--input-text)' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-1.5 pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-[2px] transition-all duration-200"
              style={{
                background: i < strengthScore && newPassword ? '#1b4d2e' : 'var(--switch-off-bg)',
              }}
            />
          ))}
          <span className="text-[11px] ml-1" style={{ color: 'var(--text-tertiary)' }}>{strengthLabel}</span>
        </div>

        {pwError && (
          <div className="text-[11px] px-1.5 pb-2" style={{ color: '#e08080' }}>{pwError}</div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={pwSaving}
          className="w-full rounded-[14px] py-[14px] text-[15px] font-medium mb-3 transition-colors disabled:opacity-50"
          style={{ background: '#1b4d2e', color: '#eafbf0' }}
        >
          {pwSaving ? t('saving') : t('updatePassword')}
        </button>

        {pwToast && (
          <div className="text-center text-[12px] mb-5 transition-opacity duration-300" style={{ color: '#3ddc84' }}>
            {t('passwordChanged')}
          </div>
        )}

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('linkedAccounts')}</div>
        <div className="rounded-2xl overflow-hidden" style={glassStyle}>
          <div className="flex items-center justify-between px-4 py-[13px]" style={{ borderBottom: 'var(--divider-border)' }}>
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 4.2-5.35 4.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.5 0 2.8.55 3.85 1.5l2.2-2.2A9 9 0 1 0 12 21c4.9 0 9-3.5 9-9 0-.6-.05-1.2-.15-1.9z" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('google')}</span>
            </div>
            <span
              className="text-[10px] rounded-[10px] px-2 py-0.5"
              style={{ background: 'rgba(201,138,58,0.2)', border: '0.5px solid rgba(201,138,58,0.4)', color: '#c98a3a' }}
            >
              {t('comingSoon')}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-[13px]">
            <div className="flex items-center gap-3">
              <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 3c.2 1.2-.3 2.4-1 3.2-.8.9-2 1.6-3.2 1.5-.2-1.1.4-2.3 1-3 .8-.9 2.1-1.6 3.2-1.7zM20 17.3c-.6 1.3-.9 1.9-1.6 3-1 1.6-2.5 3.6-4.3 3.6-1.6 0-2-.9-4.1-.9-2.1 0-2.6.9-4.1.9-1.8 0-3.2-1.8-4.2-3.4C-1 16.6-1.3 11 1.8 8.1c1.5-1.4 3.1-1.6 4.5-1.6 1.6 0 3 1 4.1 1 1 0 2.9-1.2 4.9-1 .8 0 3.1.3 4.6 2.5-.1.1-2.7 1.6-2.7 4.8 0 3.8 3.3 5.1 3.3 5.1z" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('apple')}</span>
            </div>
            <span
              className="text-[10px] rounded-[10px] px-2 py-0.5"
              style={{ background: 'rgba(201,138,58,0.2)', border: '0.5px solid rgba(201,138,58,0.4)', color: '#c98a3a' }}
            >
              {t('comingSoon')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
