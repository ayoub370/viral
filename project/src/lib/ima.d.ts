// Type declarations for Google IMA SDK

interface google {
  namespace: {
    ima: {
      AdDisplayContainer: {
        new (container: HTMLElement, videoElement?: HTMLVideoElement): google.ima.AdDisplayContainer;
      };
      AdsLoader: {
        new (): google.ima.AdsLoader;
      };
      AdsRequest: {
        new (): google.ima.AdsRequest;
      };
      AdsManagerLoadedEvent: {
        Type: {
          ADS_MANAGER_LOADED: string;
        };
      };
      AdErrorEvent: {
        Type: {
          AD_ERROR: string;
        };
      };
      AdEvent: {
        Type: {
          LOADED: string;
          STARTED: string;
          COMPLETE: string;
          ALL_ADS_COMPLETED: string;
          CONTENT_PAUSE_REQUESTED: string;
          CONTENT_RESUME_REQUESTED: string;
        };
      };
    };
  };
  ima: {
    AdDisplayContainer: {
      new (container: HTMLElement, videoElement?: HTMLVideoElement): google.ima.AdDisplayContainer;
    };
    AdsLoader: {
      new (): google.ima.AdsLoader;
    };
    AdsRequest: {
      new (): google.ima.AdsRequest;
    };
    AdsManagerLoadedEvent: {
      Type: {
        ADS_MANAGER_LOADED: string;
      };
    };
    AdErrorEvent: {
      Type: {
        AD_ERROR: string;
      };
    };
    AdEvent: {
      Type: {
        LOADED: string;
        STARTED: string;
        COMPLETE: string;
        ALL_ADS_COMPLETED: string;
        CONTENT_PAUSE_REQUESTED: string;
        CONTENT_RESUME_REQUESTED: string;
      };
    };
    settings: {
      setAutoPlayAdBreaks(autoPlay: boolean): void;
      setPlayerType(playerType: string): void;
      setPlayerVersion(version: string): void;
    };
    ViewMode: {
      NORMAL: string;
      FULLSCREEN: string;
    };
  };
}

declare namespace google {
  namespace ima {
    interface AdDisplayContainer {
      initialize(): void;
      destroy(): void;
    }

    interface AdsLoader {
      requestAds(adsRequest: google.ima.AdsRequest): void;
      addEventListener(type: string, listener: (e: any) => void): void;
      contentComplete(): void;
      destroy(): void;
    }

    interface AdsRequest {
      adTagUrl: string;
      linearAdSlotWidth: number;
      linearAdSlotHeight: number;
      nonLinearAdSlotWidth: number;
      nonLinearAdSlotHeight: number;
      forceNonLinearFullSlot?: boolean;
    }

    interface AdsManager {
      start(): void;
      init(width: number, height: number, viewMode: string, adDisplayContainer: google.ima.AdDisplayContainer): void;
      addEventListener(type: string, listener: (e: any) => void): void;
      destroy(): void;
      resize(width: number, height: number, viewMode: string): void;
      pause(): void;
      resume(): void;
    }

    interface AdsManagerLoadedEvent {
      getAdsManager(adsRenderingSettings?: any): google.ima.AdsManager;
    }

    interface AdErrorEvent {
      getError(): { getErrorCode(): number; getMessage(): string };
    }

    interface AdEvent {
      type: string;
      getAd(): { isLinear(): boolean; getDuration(): number };
    }
  }
}
