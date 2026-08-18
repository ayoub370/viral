declare namespace google.ima {
  class AdDisplayContainer {
    constructor(
      containerElement: HTMLElement,
      videoElement: HTMLVideoElement
    );
    initialize(): void;
    destroy(): void;
  }

  class AdsLoader extends EventDispatcher {
    constructor();
    requestAds(adsRequest: AdsRequest): void;
    contentComplete(): void;
  }

  class AdsManager extends EventDispatcher {
    init(
      width: number,
      height: number,
      viewMode: string,
      adElement?: string
    ): void;
    start(): void;
    pause(): void;
    resume(): void;
    getRemainingTime(): number;
    getCuePoints(): number[];
    setVolume(volume: number): void;
    getVolume(): number;
    resize(width: number, height: number, viewMode: string): void;
    destroy(): void;
  }

  class AdsRequest {
    adsResponse?: string;
    adTagUrl?: string;
    linearAdSlotWidth: number;
    linearAdSlotHeight: number;
    nonLinearAdSlotWidth: number;
    nonLinearAdSlotHeight: number;
    forceNonLinearFullSlot?: boolean;
    vastLoadTimeout?: number;
  }

  class AdsRenderingSettings {
    autoScale: boolean;
    bitrate: number;
    loadVideoTimeout: number;
  }

  class AdsManagerLoadedEvent extends Event {
    getAdsManager(
      adsRenderingSettings?: AdsRenderingSettings
    ): AdsManager;
  }

  class AdErrorEvent extends Event {
    getError(): AdError;
  }

  class AdError {
    getErrorCode(): number;
    getErrorMessage(): string;
    getVastErrorCode(): number;
  }

  class AdEvent extends Event {
    type: string;
    getAd(): Ad;
    getAdData(): any;
  }

  class Ad {
    getAdPodInfo(): AdPodInfo;
    getDuration(): number;
    getSkipTimeOffset(): number;
  }

  class AdPodInfo {
    getAdPosition(): number;
    getTotalAds(): number;
  }

  class EventDispatcher {
    addEventListener(
      type: string,
      listener: (event: any) => void
    ): void;
    removeEventListener(
      type: string,
      listener: (event: any) => void
    ): void;
  }

  class UiElements {
    static AD_ATTRIBUTION: string;
    static COUNTDOWN: string;
  }

  const ViewMode: {
    NORMAL: string;
    FULLSCREEN: string;
  };

  const AdEvent: {
    Type: {
      LOADED: string;
      STARTED: string;
      CONTENT_PAUSE_REQUESTED: string;
      CONTENT_RESUME_REQUESTED: string;
      PAUSED: string;
      RESUMED: string;
      COMPLETE: string;
      ALL_ADS_COMPLETED: string;
      SKIPPABLE_STATE_CHANGED: string;
      LOG: string;
      ERROR: string;
    };
  };

  const AdErrorEvent: {
    Type: {
      AD_ERROR: string;
    };
  };

  const AdsManagerLoadedEvent: {
    Type: {
      ADS_MANAGER_LOADED: string;
    };
  };
}
