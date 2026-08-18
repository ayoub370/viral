import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import { isPasswordLeaked } from '../../lib/hibp';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface SecurityProps {
  onBack: () => void;
}

function getStrength(pwd: string): { score: number; label: string } {
  if (!pwd) return { score: 0, label: '' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  return { score: s, label: labels[s] };
}

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function Security({ onBack }: SecurityProps) {
  const { t } = useUserPreferences();
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setCurrentEmail(user.email);
      }
    });
  }, []);

  const strength = getStrength(newPassword);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleEmailChange = async () => {
    setMessage({ type: '', text: '' });
    if (!newEmail) return setMessage({ type: 'error', text: t('enterNewEmail') });
    if (!isValidEmail(newEmail)) return setMessage({ type: 'error', text: t('invalidEmail') });
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setMessage({
        type: 'success',
        text: t('emailSent'),
      });
      setNewEmail('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || t('invalidEmail') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setMessage({ type: '', text: '' });
    if (!currentPassword || !newPassword || !confirmPassword)
      return setMessage({ type: 'error', text: t('fillAllFields') });
    if (newPassword !== confirmPassword)
      return setMessage({ type: 'error', text: t('passwordsDontMatch') });
    if (newPassword.length < 6)
      return setMessage({ type: 'error', text: t('passwordTooShort') });
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Utilisateur non connecté');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error(t('passwordIncorrect'));
      const leaked = await isPasswordLeaked(newPassword);
      if (leaked)
        throw new Error(t('passwordLeaked'));
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({
    label,
    value,
    onChange,
    show,
    onToggle,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
  }) => (
    <div className="px-4 py-3" style={{ borderBottom: 'var(--divider-border)' }}>
      <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <div className="flex items-center gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--input-text)' }}
        />
        <button type="button" onClick={onToggle} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
            {show ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('securityTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        {message.text && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm mb-5 ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('modifyEmail')}</div>
        <div className="rounded-2xl overflow-hidden mb-2.5" style={glassStyle}>
          <div className="px-4 py-3" style={{ borderBottom: 'var(--divider-border)' }}>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('currentEmailLabel')}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{currentEmail || '—'}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('newEmailLabel')}</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--input-text)' }}
            />
          </div>
        </div>
        <button
          onClick={handleEmailChange}
          disabled={loading}
          className="w-full rounded-[14px] py-3 text-sm font-medium mb-7 transition-colors disabled:opacity-50"
          style={{
            background: 'var(--btn-secondary-bg)',
            border: '0.5px solid var(--btn-secondary-border)',
            color: 'var(--text-secondary)',
          }}
        >
          {t('updateEmail')}
        </button>

        <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('modifyPassword')}</div>
        <div className="rounded-2xl overflow-hidden" style={glassStyle}>
          <PasswordField
            label={t('currentPassword')}
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label={t('newPassword')}
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <div className="px-4 py-3">
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>{t('confirmPassword')}</p>
            <div className="flex items-center gap-2">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--input-text)' }}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[16px] h-[16px]">
                  {showConfirm ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {newPassword.length > 0 && (
          <div className="flex items-center gap-2 px-1.5 pt-2 pb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 h-[3px] rounded-[2px] transition-all"
                style={{
                  background: strength.score > i ? '#1b4d2e' : 'var(--switch-off-bg)',
                }}
              />
            ))}
            <span className="text-[11px] ml-1" style={{ color: 'var(--text-tertiary)' }}>{t('passwordStrength')[strength.score - 1] as string}</span>
          </div>
        )}

        <button
          onClick={handlePasswordChange}
          disabled={loading}
          className="w-full rounded-[14px] py-[14px] text-[15px] font-medium transition-colors disabled:opacity-50"
          style={{ background: '#1b4d2e', color: '#eafbf0' }}
        >
          {t('updatePassword')}
        </button>
      </div>
    </div>
  );
}
