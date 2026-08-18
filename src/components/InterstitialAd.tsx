import React, { useEffect, useRef } from 'react';
import { trackAdImpression } from '../lib/exoclick';

declare global {
  interface Window {
    AdProvider: any[];
  }
}

interface InterstitialAdProps {
  zoneId?: number;
  subId?: string;
  onClose: () => void;
  userId?: string;
}

const DESKTOP_CONFIG = {
  scriptUrl: 'https://a.magsrv.com/ad-provider.js',
  className: 'eas6a97888e35',
  zoneId: 5947342,
};

const MOBILE_CONFIG = {
  scriptUrl: 'https://a.pemsrv.com/ad-provider.js',
  className: 'eas6a97888e33',
  zoneId: 5956288,
};

const isMobile = () => window.innerWidth < 768;

const InterstitialAd: React.FC<InterstitialAdProps> = ({
  zoneId,
  subId = '123450000',
  onClose,
  userId
}) => {
  const adInitializedRef = useRef(false);
  const impressionTrackedRef = useRef(false);

  const config = isMobile() ? MOBILE_CONFIG : DESKTOP_CONFIG;
  const finalZoneId = zoneId ?? config.zoneId;

  useEffect(() => {
    if (adInitializedRef.current) return;
    adInitializedRef.current = true;

    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${config.scriptUrl}"]`) as HTMLScriptElement;
        if (existingScript) {
          if ((existingScript as any).loaded) {
            resolve();
            return;
          }
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject());
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.type = 'application/javascript';
        script.src = config.scriptUrl;
        script.onload = () => {
          (script as any).loaded = true;
          resolve();
        };
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    const initAd = async () => {
      try {
        await loadScript();
        await new Promise((r) => setTimeout(r, 100));

        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({ serve: {} });

        if (userId && !impressionTrackedRef.current) {
          impressionTrackedRef.current = true;
          await trackAdImpression({
            user_id: userId,
            zone_id: finalZoneId,
            ad_type: 'interstitial',
            sub_id: subId
          });
        }
      } catch (err) {
        console.error('Failed to load interstitial ad script:', err);
      }
    };

    initAd();

    const timeout = setTimeout(() => {
      onClose();
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
      <ins
        className={config.className}
        data-zoneid={finalZoneId.toString()}
        data-sub={subId}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default InterstitialAd;
