import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/api';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface ConnectedDevicesProps {
  onBack: () => void;
}

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  last_active: string;
  created_at: string;
  location?: string;
}

function getDeviceIcon(type: string): React.ReactNode {
  const t = type.toLowerCase();
  if (t === 'mobile' || t === 'smartphone')
    return (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </>
    );
  if (t === 'tablet')
    return (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </>
    );
  return (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </>
  );
}

function formatLastActive(dateStr: string, t: (key: any, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 5) return t('activeNow');
  if (diffMin < 60) return t('activeMin', { min: diffMin });
  if (diffH < 24) return t('activeHours', { h: diffH });
  if (diffD === 1) return t('activeDay');
  if (diffD < 7) return t('activeDays', { d: diffD });
  if (diffD < 14) return t('activeWeek');
  return t('activeWeeks', { w: Math.floor(diffD / 7) });
}

const glassStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: 'var(--glass-border)',
};

export default function ConnectedDevices({ onBack }: ConnectedDevicesProps) {
  const { t } = useUserPreferences();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('connected_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      const { error } = await supabase.from('connected_devices').delete().eq('id', deviceId);
      if (error) throw error;
      setDevices(devices.filter((d) => d.id !== deviceId));
      setMessage({ type: 'success', text: t('deviceDisconnected') });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || t('deviceDisconnected') });
    }
  };

  const currentDevice = devices[0];
  const otherDevices = devices.slice(1);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 px-1 pt-2 pb-5 max-w-[420px] mx-auto">
        <button onClick={onBack} className="flex-shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{t('devicesTitle')}</span>
      </div>

      <div className="max-w-[420px] mx-auto">
        {message.text && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm mb-5 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '2px solid var(--spinner-border)', borderTopColor: 'var(--spinner-active)' }} />
            <p className="text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
          </div>
        ) : (
          <>
            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('thisDevice')}</div>
            <div className="rounded-2xl overflow-hidden mb-5" style={glassStyle}>
              <div className="flex items-center justify-between px-4 py-[13px]">
                <div className="flex items-center gap-3">
                  <svg className="w-[19px] h-[19px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {currentDevice ? getDeviceIcon(currentDevice.device_type) : getDeviceIcon('mobile')}
                  </svg>
                  <div>
                    <div className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      {currentDevice?.device_name || t('thisDevice')}
                      <span
                        className="text-[10px] rounded-[10px] px-1.5 py-px"
                        style={{ background: 'rgba(27,77,46,0.35)', border: '0.5px solid #1b4d2e', color: '#3ddc84' }}
                      >
                        {t('current')}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {currentDevice?.location ? `${currentDevice.location} · ` : ''}
                      {currentDevice ? formatLastActive(currentDevice.last_active, t) : t('activeNow')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs px-1 pb-2 tracking-[0.03em]" style={{ color: 'var(--text-label)' }}>{t('otherDevices')}</div>
            {otherDevices.length > 0 ? (
              <div className="rounded-2xl overflow-hidden mb-5" style={glassStyle}>
                {otherDevices.map((device, idx) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between px-4 py-[13px]"
                    style={{
                      borderBottom: idx < otherDevices.length - 1 ? 'var(--divider-border)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-[19px] h-[19px] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        {getDeviceIcon(device.device_type)}
                      </svg>
                      <div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{device.device_name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {device.location ? `${device.location} · ` : ''}
                          {formatLastActive(device.last_active, t)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(device.id)}
                      className="text-xs flex-shrink-0 hover:text-red-400 transition-colors"
                      style={{ color: '#c96a6a' }}
                    >
                      {t('disconnect')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden mb-5" style={glassStyle}>
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('noOtherDevices')}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
