import React, { useEffect, useRef, useState } from 'react';

interface ImaAdPlayerProps {
  adTagUrl?: string;
  onAdComplete: () => void;
  showCloseAfter?: number;
}

const DEFAULT_VAST_TAG = 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21753362765/viral/vast&description_url=https%3A%2F%2Fwww.viral.com&env=vp&gdfp_req=1&output=vast&unviewed_position_start=1&ad_type=video&sz=640x480&url=https%3A%2F%2Fwww.viral.com&vad_type=linear';

const ImaAdPlayer: React.FC<ImaAdPlayerProps> = ({
  adTagUrl = DEFAULT_VAST_TAG,
  onAdComplete,
  showCloseAfter = 5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adsManagerRef = useRef<google.ima.AdsManager | null>(null);
  const [showClose, setShowClose] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !videoRef.current || !adContainerRef.current) return;

    const videoElement = videoRef.current;
    const adContainer = adContainerRef.current;

    const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
    const adsLoader = new google.ima.AdsLoader();

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      (adsManagerLoadedEvent: google.ima.AdsManagerLoadedEvent) => {
        const adsManager = adsManagerLoadedEvent.getAdsManager();
        adsManagerRef.current = adsManager;

        adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, () => {
          adDisplayContainer.initialize();
          adsManager.init(640, 480, google.ima.ViewMode.NORMAL, adDisplayContainer);
          adsManager.start();
        });

        adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, () => {
          cleanup();
          onAdComplete();
        });

        adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
          cleanup();
          onAdComplete();
        });

        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, () => {
          cleanup();
          setAdError(true);
        });
      }
    );

    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      () => {
        cleanup();
        setAdError(true);
      }
    );

    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adTagUrl;
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 480;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);

    const closeTimer = setTimeout(() => {
      setShowClose(true);
    }, showCloseAfter * 1000);

    function cleanup() {
      clearTimeout(closeTimer);
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
        adsManagerRef.current = null;
      }
      adsLoader.destroy();
    }

    return () => {
      cleanup();
    };
  }, []);

  const handleClose = () => {
    if (adsManagerRef.current) {
      adsManagerRef.current.destroy();
      adsManagerRef.current = null;
    }
    onAdComplete();
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
      <div ref={adContainerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      {showClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-[2100] bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white font-semibold hover:bg-white/30 transition-all"
        >
          Passer
        </button>
      )}
      {adError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleClose}
            className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white font-semibold hover:bg-white/30 transition-all"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
};

export default ImaAdPlayer;
