import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/api';
import { Heart, MessageCircle, Share2, ChevronDown, User, Volume2, VolumeX } from 'lucide-react';
import { apiClient } from '../lib/api';
import { recommendationEngine } from '../lib/recommendations';
import ImaAdPlayer from './ImaAdPlayer';
import { TopNav } from './TopNav';

interface VideoData {
  id: number;
  videos: { medium: { url: string } };
  user: string;
  user_id: number;
  userImageURL: string;
  likes: number;
  category?: string;
  source?: string;
  previewUrl?: string;
}

interface VideoFeedProps {
  onNavigateToProfile?: (userId: number, creatorName: string, creatorImageUrl: string) => void;
  onNavigateToComments?: (videoId: number) => void;
  onRequireLogin?: () => void;
  onNavigateToLive?: () => void;
  onNavigateToStories?: () => void;
}

const VIDEO_FEED_FUNCTION = 'video-feed';
const CATEGORIES_PER_FETCH = 5;
const PRELOAD_COUNT = 4;
const MIN_VIDEOS_BEFORE_LOAD = 8;

const shuffle = (array: VideoData[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const VideoFeed: React.FC<VideoFeedProps> = ({ onNavigateToProfile, onNavigateToComments, onRequireLogin, onNavigateToLive, onNavigateToStories }) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [showImaAd, setShowImaAd] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [exitingVideo, setExitingVideo] = useState<VideoData | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundControl, setShowSoundControl] = useState(false);
  const lastImaAdTimeRef = useRef<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadingMoreRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadCacheRef = useRef<Map<number, string>>(new Map());
  const fetchIdRef = useRef(0);
  const seenVideoIdsRef = useRef<Set<number>>(new Set());
  const nextPageRef = useRef(1);

  useEffect(() => {
    const video = videos[videoIndex];
    if (!video) return;
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('video_id', video.id).then(({ count }) => {
      if (count !== null) setCommentCounts(prev => ({ ...prev, [video.id]: count }));
    });
  }, [videoIndex, videos]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const initFeed = async () => { await recommendationEngine.init(); fetchVideos(); };
    initFeed(); loadLikedVideos(); loadCurrentUserId();
  }, []);

  const loadCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadLikedVideos = async () => {
    try { const { videoIds } = await apiClient.getLikedVideoIds(); setLikedVideos(new Set(videoIds)); }
    catch (error) { console.log('Could not load liked videos'); }
  };

  const preloadVideo = useCallback((video: VideoData) => {
    if (preloadCacheRef.current.has(video.id)) return;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.src = video.videos.medium.url;
    v.style.display = 'none';
    document.body.appendChild(v);
    preloadCacheRef.current.set(video.id, video.videos.medium.url);
  }, []);

  const fetchVideos = useCallback(async (append: boolean = false, retries: number = 0) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const currentFetchId = ++fetchIdRef.current;

    try {
      if (!append) { setLoading(true); setError(''); }

      const categories = recommendationEngine.nextCategories(CATEGORIES_PER_FETCH);
      const page = nextPageRef.current;
      nextPageRef.current = page >= 20 ? 1 : page + 1;

      const { data, error: invokeError } = await supabase.functions.invoke(VIDEO_FEED_FUNCTION, {
        body: { queries: categories, page },
      });

      if (currentFetchId !== fetchIdRef.current) return;

      if (invokeError) throw invokeError;

      const newVideos: VideoData[] = Array.isArray(data?.videos) ? data.videos : [];
      const uniqueVideos = newVideos.filter((video) => {
        if (!video?.id || !video.videos?.medium?.url || seenVideoIdsRef.current.has(video.id)) return false;
        seenVideoIdsRef.current.add(video.id);
        return true;
      });
      const shuffledVideos = shuffle(uniqueVideos);

      if (shuffledVideos.length > 0) {
        if (append) setVideos((prev) => [...prev, ...shuffledVideos]);
        else setVideos(shuffledVideos);
      } else if (retries < 8) {
        loadingMoreRef.current = false;
        await new Promise(r => setTimeout(r, 250));
        return fetchVideos(append, retries + 1);
      } else if (!append) {
        setError('No videos available');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      if (currentFetchId !== fetchIdRef.current) return;
      if (!append) setError('Failed to load videos');
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
        loadingMoreRef.current = false;
      }
    }
  }, []);

  const loadMoreVideos = useCallback(() => { fetchVideos(true); }, [fetchVideos]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !showImaAd) { video.muted = isMuted; video.load(); video.play().catch(() => console.log('Autoplay prevented')); }
  }, [videoIndex, showImaAd, videos, isMuted]);

  useEffect(() => {
    if (videoIndex >= videos.length - MIN_VIDEOS_BEFORE_LOAD && videos.length > 0 && !loadingMoreRef.current) {
      loadMoreVideos();
    }
  }, [videoIndex, videos.length, loadMoreVideos]);

  useEffect(() => {
    for (let i = 1; i <= PRELOAD_COUNT; i++) {
      const nextVideo = videos[videoIndex + i];
      if (nextVideo) preloadVideo(nextVideo);
    }
  }, [videoIndex, videos, preloadVideo]);

  const handleNext = () => {
    const elapsed = Date.now() - lastImaAdTimeRef.current;
    const imaReady = typeof window !== 'undefined' && !!(window as any).google?.ima;
    if (elapsed >= 60 * 1000 && imaReady) setShowImaAd(true);
    else advanceToNextVideo();
  };

  const handleImaAdComplete = () => { lastImaAdTimeRef.current = Date.now(); setShowImaAd(false); advanceToNextVideo(); };

  const advanceToNextVideo = () => {
    const nextIndex = videoIndex + 1;
    if (nextIndex < videos.length) {
      const currentVid = videos[videoIndex];
      setExitingVideo(currentVid);
      setTransitioning(true);
      setVideoIndex(nextIndex);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setExitingVideo(null);
        setTransitioning(false);
      }, 400);
    } else {
      loadMoreVideos();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
    setShowSoundControl(false);
  };

  const startLongPress = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setShowSoundControl(true);
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
      longPressTimerRef.current = null;
    }, 2000);
  };

  const cancelLongPress = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLike = async (video: VideoData) => {
    const videoId = video.id;
    const isCurrentlyLiked = likedVideos.has(videoId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { onRequireLogin?.(); return; }
    setLikedVideos((prev) => { const newSet = new Set(prev); if (newSet.has(videoId)) newSet.delete(videoId); else newSet.add(videoId); return newSet; });
    try {
      if (isCurrentlyLiked) { await apiClient.unlikeVideo(videoId); recommendationEngine.recordUnlike(video.category || ''); }
      else { await apiClient.likeVideo({ videoId: video.id, videoUrl: video.videos.medium.url, videoUser: video.user, videoUserId: video.user_id, videoUserImageUrl: video.userImageURL, videoLikes: video.likes, category: video.category }); recommendationEngine.recordLike(video.category || ''); }
    } catch (error) { console.error('Error updating like:', error); setLikedVideos((prev) => { const newSet = new Set(prev); if (isCurrentlyLiked) newSet.add(videoId); else newSet.delete(videoId); return newSet; }); }
  };

  if (loading) return (
    <div className="w-full relative" style={{ background: '#000000', height: 'calc(100vh - 65px)' }}>
      <div className="w-full h-full relative animate-pulse">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' }} />
        <div className="absolute bottom-28 right-6 flex flex-col gap-6 items-center">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );

  if (error || videos.length === 0) return (
    <div className="w-full flex items-center justify-center" style={{ background: '#000000', height: 'calc(100vh - 65px)' }}>
      <div className="text-center" style={{ color: 'var(--text-primary)' }}>
        <p className="mb-4">{error || 'No videos available'}</p>
        <button onClick={() => fetchVideos()} className="px-6 py-3 rounded-full font-semibold transition btn-primary">Retry</button>
      </div>
    </div>
  );

  const currentVideo = videos[videoIndex];

  if (!currentVideo && !error && videos.length > 0) return (
    <div className="w-full relative" style={{ background: '#000000', height: 'calc(100vh - 65px)' }}>
      <div className="w-full h-full relative animate-pulse">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' }} />
        <div className="absolute bottom-28 right-6 flex flex-col gap-6 items-center">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-6 h-6 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showImaAd && <ImaAdPlayer onAdComplete={handleImaAdComplete} showCloseAfter={5} />}
      <TopNav activeTab="feed" onNavigateToStories={() => onNavigateToStories?.()} onNavigateToLive={() => onNavigateToLive?.()} onNavigateToFeed={() => {}} />
      <div className="w-full relative box-border pt-16 overflow-hidden" style={{ background: '#000000', height: 'calc(100vh - 65px)' }}>
        <div className="w-full h-full relative">
          {!showImaAd && (exitingVideo || currentVideo) ? (
            <>
              {exitingVideo && (
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    animation: 'slideOutUp 400ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                    zIndex: 2,
                  }}
                >
                  <video
                    src={exitingVideo.videos.medium.url}
                    muted loop playsInline autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
                  <div className="absolute bottom-24 left-6 z-10">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{exitingVideo.user}</p>
                  </div>
                </div>
              )}

              {currentVideo && (
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    animation: exitingVideo ? 'slideInUp 400ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards' : 'none',
                    zIndex: 1,
                  }}
                >
                  <video
                    key={currentVideo.id}
                    ref={videoRef}
                    src={currentVideo.videos.medium.url}
                    muted={isMuted}
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    onPointerDown={startLongPress}
                    onPointerUp={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onContextMenu={(event) => event.preventDefault()}
                    style={{ touchAction: 'none' }}
                    className="absolute inset-0 z-[5]"
                  />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
                  {showSoundControl && (
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                      className="absolute bottom-36 left-6 z-20 flex h-11 items-center gap-2 rounded-full bg-black/70 px-4 backdrop-blur-md transition-transform hover:scale-105 active:scale-90"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                      <span className="text-xs font-semibold text-white">{isMuted ? 'Activer le son' : 'Couper le son'}</span>
                    </button>
                  )}
                  <div className="absolute bottom-24 left-6 z-10">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{currentVideo.user}</p>
                  </div>
                  <div className="absolute bottom-24 right-6 flex flex-col gap-6 z-10">
                    <button onClick={() => onNavigateToProfile?.(currentVideo.user_id, currentVideo.user, currentVideo.userImageURL)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ border: '2px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}>
                        {currentVideo.userImageURL ? <img src={currentVideo.userImageURL} alt={currentVideo.user} className="w-full h-full object-cover" /> : <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--text-primary)' }}></div>
                    </button>
                    <button onClick={() => handleLike(currentVideo)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                      <Heart className={`w-6 h-6 transition-colors ${likedVideos.has(currentVideo.id) ? 'fill-current' : ''}`} style={{ color: likedVideos.has(currentVideo.id) ? 'var(--danger)' : 'var(--text-primary)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentVideo.likes + (likedVideos.has(currentVideo.id) ? 1 : 0)}</p>
                    </button>
                    <button onClick={() => onNavigateToComments?.(currentVideo.id)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{commentCounts[currentVideo.id] || 0}</p>
                    </button>
                    <button className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 28%, transparent 58%)' }}
        />
        <button onClick={handleNext} disabled={transitioning} aria-label="Vidéo suivante" className="next-btn-suivant fixed bottom-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center justify-center p-3 rounded-full transition-all active:scale-95 glass disabled:opacity-60" style={{ color: 'var(--text-primary)' }}>
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </>
  );
};

export default VideoFeed;
