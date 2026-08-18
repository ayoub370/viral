import React, { useEffect, useRef } from 'react';
import { trackAdImpression } from '../lib/exoclick';

declare global {
  interface Window {
    AdProvider: any[];
  }
}

interface OutstreamAdProps {
  zoneId?: number;
  subId?: string;
  userId?: string;
}

const OutstreamAd: React.FC<OutstreamAdProps> = ({ zoneId = 5946880, subId = '123450000', userId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const adLoadedRef = useRef(false);
  const impressionTrackedRef = useRef(false);

  useEffect(() => {
    if (adLoadedRef.current) return;
    adLoadedRef.current = true;

    if (!window.AdProvider) {
      window.AdProvider = [];
    }

    window.AdProvider.push({ serve: {} });

    if (userId && !impressionTrackedRef.current) {
      impressionTrackedRef.current = true;
      trackAdImpression({
        user_id: userId,
        zone_id: zoneId,
        ad_type: 'outstream',
        sub_id: subId
      }).catch(console.error);
    }

    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Ad script auto-finds elements with the class
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [zoneId, subId, userId]);

  return (
    <div
      className="w-full bg-black flex items-center justify-center"
      style={{ height: 'calc(100vh - 65px)' }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <ins
          ref={containerRef}
          className="eas6a97888e37"
          data-zoneid={zoneId.toString()}
          data-sub={subId}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            minHeight: '300px'
          }}
        />
      </div>
    </div>
  );
};

export default OutstreamAd;
