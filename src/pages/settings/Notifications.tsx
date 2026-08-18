import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';
import type { TranslationKey } from '../../lib/i18n';

interface NotificationsProps {
  onBack: () => void;
}

const ICON_PATHS: Record<string, React.ReactNode> = {
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  at: <><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.3" /></>,
  userplus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 6l10 7 10-7" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><circle cx="12" cy="7" r="4" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  broadcast: <><path d="M4.9 19.1a9 9 0 1 1 14.2 0" /><path d="M7.8 16.2a5 5 0 1 1 8.4 0" /><circle cx="12" cy="14" r="1" /></>,
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3" /></>,
  trending: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  coin: <><circle cx="12" cy="12" r="9" /><path d="M9 12h6" /><path d="M12 9v6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  gift: <><rect x="3" y="8" width="18" height="13" rx="1" /><path d="M12 8v13" /><path d="M3 12h18" /><path d="M12 8c-2 0-3-1-3-2.5S10 3 12 4c2-1 3 0 3 1.5S14 8 12 8z" /></>,
  shieldcheck: <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><polyline points="9 12 11 14 15 10" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
};

function Icon({ name }: { name: string }) {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
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

interface Item {
  icon: string;
  titleKey: TranslationKey;
  key: string;
  default: boolean;
}

interface Group {
  labelKey: TranslationKey;
  items: Item[];
}

const groups: Group[] = [
  {
    labelKey: 'interactions',
    items: [
      { icon: 'heart', titleKey: 'likesVideos', key: 'likes', default: true },
      { icon: 'message', titleKey: 'comments', key: 'comments', default: true },
      { icon: 'at', titleKey: 'mentions', key: 'mentions', default: true },
      { icon: 'userplus', titleKey: 'newFollowers', key: 'followers', default: true },
      { icon: 'share', titleKey: 'shares', key: 'shares', default: false },
    ],
  },
  {
    labelKey: 'messages',
    items: [
      { icon: 'mail', titleKey: 'privateMessages', key: 'dm', default: true },
      { icon: 'users', titleKey: 'groupInvites', key: 'group_invite', default: false },
    ],
  },
  {
    labelKey: 'livesContent',
    items: [
      { icon: 'broadcast', titleKey: 'liveCreators', key: 'lives', default: true },
      { icon: 'video', titleKey: 'newVideos', key: 'new_videos', default: true },
      { icon: 'trending', titleKey: 'trendingContent', key: 'trending', default: false },
    ],
  },
  {
    labelKey: 'rewards',
    items: [
      { icon: 'coin', titleKey: 'rewardsEarned', key: 'rewards', default: true },
      { icon: 'target', titleKey: 'goalsReached', key: 'targets', default: true },
      { icon: 'gift', titleKey: 'limitedOffers', key: 'offers', default: false },
    ],
  },
  {
    labelKey: 'system',
    items: [
      { icon: 'shieldcheck', titleKey: 'accountSecurity', key: 'security', default: true },
      { icon: 'refresh', titleKey: 'appUpdates', key: 'updates', default: false },
    ],
  },
];

function buildInitialState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  groups.forEach((g) => g.items.forEach((i) => { state[i.key] = i.default; }));
  return state;
}

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function Notifications({ onBack }: NotificationsProps) {
  const { preferences, updateNotifications, updateNotificationSettings, t } = useUserPreferences();
  const [allEnabled, setAllEnabled] = useState(true);
  const [settings, setSettings] = useState<Record<string, boolean>>(buildInitialState);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (preferences) {
      const savedSettings = preferences.notification_settings;
      if (savedSettings && Object.keys(savedSettings).length > 0) {
        const merged = buildInitialState();
        Object.keys(savedSettings).forEach((k) => {
          if (k in merged) merged[k] = savedSettings[k];
        });
        setSettings(merged);
        setAllEnabled(Object.values(merged).every(Boolean));
      } else {
        setAllEnabled(preferences.notifications_enabled);
        if (preferences.notifications_enabled === false) {
          const next: Record<string, boolean> = {};
          groups.forEach((g) => g.items.forEach((i) => { next[i.key] = false; }));
          setSettings(next);
        }
      }
    }
  }, [preferences]);

  const persist = async (newSettings: Record<string, boolean>) => {
    const anyOn = Object.values(newSettings).some(Boolean);
    try {
      await updateNotifications(anyOn);
      await updateNotificationSettings(newSettings);
      setToast(true);
      setTimeout(() => setToast(false), 1500);
    } catch (e) {
      console.error('Error saving notification settings:', e);
    }
  };

  const handleAll = (v: boolean) => {
    setAllEnabled(v);
    const next: Record<string, boolean> = {};
    groups.forEach((g) => g.items.forEach((i) => { next[i.key] = v; }));
    setSettings(next);
    persist(next);
  };

  const handleItem = (key: string, v: boolean) => {
    const next = { ...settings, [key]: v };
    setSettings(next);
    const allOn = Object.values(next).every(Boolean);
    setAllEnabled(allOn);
    persist(next);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-4 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('notificationsTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto px-0">
        <div
          className="flex items-center justify-between px-4 py-[14px] mb-5 rounded-2xl"
          style={glassStyle}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('enableAll')}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{t('enableAllSub')}</div>
          </div>
          <Switch checked={allEnabled} onChange={handleAll} />
        </div>

        {groups.map((group) => (
          <div key={group.labelKey} className="mb-[18px]">
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t(group.labelKey)}</div>
            <div className="rounded-2xl overflow-hidden" style={glassStyle}>
              {group.items.map((item, idx) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-4 py-[13px]"
                  style={{
                    borderBottom: idx < group.items.length - 1 ? 'var(--divider-border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon name={item.icon} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(item.titleKey)}</span>
                  </div>
                  <Switch checked={settings[item.key]} onChange={(v) => handleItem(item.key, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {toast && (
          <div className="text-center text-xs mt-2 transition-opacity duration-300" style={{ color: '#3ddc84' }}>
            {t('saved')}
          </div>
        )}
      </div>
    </div>
  );
}
