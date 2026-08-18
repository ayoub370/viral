import React, { useRef, useEffect, useState } from 'react';

const VAST_TAG_URL = 'https://s.magsrv.com/v1/vast.php?idzone=5968258';

interface ImaAdPlayerProps {
  onAdComplete: () => void;
  showCloseAfter?: number;
}

const ImaAdPlayer: React.FC<ImaAdPlayerProps> = ({ onAdComplete, showCloseAfter = 5 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adsLoaderRef = useRef<google.ima.AdsLoader | null>(null);
  const adsManagerRef = useRef<google.ima.AdsManager | null>(null);
  const adDisplayContainerRef = useRef<google.ima.AdDisplayContainer | null>(null);
  const [showClose, setShowClose] = useState(false);
  const [adError, setAdError] = useState(false);
  const [countdown, setCountdown] = useState(showCloseAfter);

  useEffect(() => {
    const video = videoRef.current;
    const adContainer = adContainerRef.current;
    if (!video || !adContainer) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const initAds = () => {
      if (typeof google === 'undefined' || !google.ima) {
        console.error('IMA SDK not loaded');
        setAdError(true);
        return;
      }

      const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, video);
      adDisplayContainerRef.current = adDisplayContainer;
      adDisplayContainer.initialize();

      const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
      adsLoaderRef.current = adsLoader;

      adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (event: google.ima.AdsManagerLoadedEvent) => {
          const adsRenderingSettings = new google.ima.AdsRenderingSettings();
          adsRenderingSettings.autoScale = true;
          adsRenderingSettings.loadVideoTimeout = 15000;

          const adsManager = event.getAdsManager(adsRenderingSettings);
          adsManagerRef.current = adsManager;

          adsManager.addEventListener(
            google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
            () => {
              video.pause();
            }
          );

          adsManager.addEventListener(
            google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
            () => {
              cleanup();
              onAdComplete();
            }
          );

          adsManager.addEventListener(
            google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
            () => {
              cleanup();
              onAdComplete();
            }
          );

          adsManager.addEventListener(
            google.ima.AdEvent.Type.STARTED,
            () => {
              closeTimer = setTimeout(() => setShowClose(true), showCloseAfter * 1000);
              interval = setInterval(() => {
                setCountdown((prev) => Math.max(0, prev - 1));
              }, 1000);
            }
          );

          adsManager.addEventListener(
            google.ima.AdEvent.Type.COMPLETE,
            () => {
              cleanup();
              onAdComplete();
            }
          );

          adsManager.addEventListener(
            google.ima.AdEvent.Type.ERROR,
            (adEvent: google.ima.AdEvent) => {
              console.error('Ad event error');
              cleanup();
              onAdComplete();
            }
          );

          try {
            const w = adContainer.clientWidth || 640;
            const h = adContainer.clientHeight || 360;
            adsManager.init(w, h, google.ima.ViewMode.NORMAL);
            adsManager.start();
          } catch (err) {
            console.error('Failed to start ads manager:', err);
            cleanup();
            onAdComplete();
          }
        }
      );

      adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        (errorEvent: google.ima.AdErrorEvent) => {
          const err = errorEvent.getError();
          console.error('IMA Ad Error:', err.getErrorCode(), err.getErrorMessage());
          setAdError(true);
          cleanup();
          onAdComplete();
        }
      );

      const adsRequest = new google.ima.AdsRequest();
      adsRequest.adTagUrl = VAST_TAG_URL;
      adsRequest.linearAdSlotWidth = adContainer.clientWidth || 640;
      adsRequest.linearAdSlotHeight = adContainer.clientHeight || 360;
      adsRequest.nonLinearAdSlotWidth = adContainer.clientWidth || 640;
      adsRequest.nonLinearAdSlotHeight = adContainer.clientHeight / 3 || 120;
      adsRequest.vastLoadTimeout = 10000;

      adsLoader.requestAds(adsRequest);
    };

    const cleanup = () => {
      if (interval) { clearInterval(interval); interval = null; }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      if (adsManagerRef.current) {
        try { adsManagerRef.current.destroy(); } catch {}
        adsManagerRef.current = null;
      }
      if (adsLoaderRef.current) {
        try { adsLoaderRef.current.contentComplete(); } catch {}
      }
      if (adDisplayContainerRef.current) {
        try { adDisplayContainerRef.current.destroy(); } catch {}
        adDisplayContainerRef.current = null;
      }
    };

    initAds();

    return () => {
      cleanup();
    };
  }, []);

  const handleClose = () => {
    if (adsManagerRef.current) {
      try { adsManagerRef.current.destroy(); } catch {}
      adsManagerRef.current = null;
    }
    onAdComplete();
  };

  if (adError) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center">
      <div ref={adContainerRef} className="w-full h-full relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          muted={false}
          autoPlay
        />
      </div>

      {showClose ? (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-[2100] bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-all active:scale-95"
        >
          Fermer
        </button>
      ) : (
        <div className="absolute top-4 right-4 z-[2100] bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
          Pub {countdown}s
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2100] text-white/60 text-xs">
        Publicité
      </div>
    </div>
  );
};

export default ImaAdPlayer;
