import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, Share2, ChevronDown, User, Volume2, VolumeX } from 'lucide-react';
import { supabase, apiClient } from '../lib/api';
import { recommendationEngine } from '../lib/recommendations';

interface LikedVideo {
  id: number;
  videos: { medium: { url: string } };
  user: string;
  user_id: number;
  userImageURL: string;
  likes: number;
  category?: string;
}

interface LikedVideoViewerProps {
  initialVideos: LikedVideo[];
  startIndex: number;
  onBack: () => void;
  onNavigateToProfile?: (userId: number, creatorName: string, creatorImageUrl: string) => void;
  onNavigateToComments?: (videoId: number) => void;
}

const LikedVideoViewer: React.FC<LikedVideoViewerProps> = ({
  initialVideos,
  startIndex,
  onBack,
  onNavigateToProfile,
  onNavigateToComments,
}) => {
  const [videos, setVideos] = useState<LikedVideo[]>(initialVideos);
  const [index, setIndex] = useState(startIndex);
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set(initialVideos.map((v) => v.id)));
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [transitioning, setTransitioning] = useState(false);
  const [exitingVideo, setExitingVideo] = useState<LikedVideo | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundControl, setShowSoundControl] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetRef = useRef(initialVideos.length);

  useEffect(() => {
    const video = videos[index];
    if (!video) return;
    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('video_id', video.id)
      .then(({ count }) => {
        if (count !== null) setCommentCounts((prev) => ({ ...prev, [video.id]: count }));
      });
  }, [index, videos]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      video.load();
      video.play().catch(() => {});
    }
  }, [index, videos, isMuted]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { likedVideos: more } = await apiClient.getLikedVideos();
      const offset = offsetRef.current;
      const newSlice = more.slice(offset, offset + 10);
      offsetRef.current = offset + newSlice.length;
      if (newSlice.length < 10) setHasMore(false);
      if (newSlice.length > 0) {
        setVideos((prev) => {
          const existing = new Set(prev.map((v) => v.id));
          const unique = newSlice.filter((v) => !existing.has(v.id));
          return [...prev, ...unique];
        });
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const advance = () => {
    const nextIndex = index + 1;
    if (nextIndex < videos.length) {
      setExitingVideo(videos[index]);
      setTransitioning(true);
      setIndex(nextIndex);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setExitingVideo(null);
        setTransitioning(false);
      }, 400);
    } else if (hasMore) {
      loadMore();
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

  const goBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleLike = async (video: LikedVideo) => {
    const isCurrentlyLiked = likedSet.has(video.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLikedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(video.id)) newSet.delete(video.id);
      else newSet.add(video.id);
      return newSet;
    });
    try {
      if (isCurrentlyLiked) {
        await apiClient.unlikeVideo(video.id);
        recommendationEngine.recordUnlike(video.category || '');
      } else {
        await apiClient.likeVideo({
          videoId: video.id,
          videoUrl: video.videos.medium.url,
          videoUser: video.user,
          videoUserId: video.user_id,
          videoUserImageUrl: video.userImageURL,
          videoLikes: video.likes,
          category: video.category,
        });
        recommendationEngine.recordLike(video.category || '');
      }
    } catch {
      setLikedSet((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) newSet.add(video.id);
        else newSet.delete(video.id);
        return newSet;
      });
    }
  };

  const handleShare = async (video: LikedVideo) => {
    const shareUrl = video.videos.medium.url;
    if (navigator.share) {
      try { await navigator.share({ title: `Vidéo de ${video.user}`, url: shareUrl }); } catch {}
    } else {
      navigator.clipboard?.writeText(shareUrl);
    }
  };

  const currentVideo = videos[index];

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="mb-4 text-sm text-white/60">Aucune vidéo à lire</p>
          <button onClick={onBack} className="rounded-full px-6 py-3 text-sm font-semibold bg-white text-black">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black overflow-hidden">
      {exitingVideo && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ animation: 'slideOutUp 400ms cubic-bezier(0.25,0.1,0.25,1) forwards', zIndex: 2 }}
        >
          <video src={exitingVideo.videos.medium.url} muted loop playsInline autoPlay className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
        </div>
      )}

      <div
        className="absolute inset-0 w-full h-full"
        style={{ animation: exitingVideo ? 'slideInUp 400ms cubic-bezier(0.25,0.1,0.25,1) forwards' : 'none', zIndex: 1 }}
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
      </div>

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20">
        <button onClick={onBack} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform active:scale-90">
          <X className="h-5 w-5 text-white" strokeWidth={1.8} />
        </button>
        <span className="text-sm font-semibold text-white/90">Vidéos likées</span>
        <span className="h-10 w-10" aria-hidden />
      </div>

      <div className="absolute bottom-24 left-6 z-10">
        <p className="text-sm font-semibold text-white">{currentVideo.user}</p>
      </div>

      <div className="absolute bottom-24 right-6 flex flex-col gap-6 z-10">
        <button
          onClick={() => onNavigateToProfile?.(currentVideo.user_id, currentVideo.user, currentVideo.userImageURL)}
          className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
            {currentVideo.userImageURL ? <img src={currentVideo.userImageURL} alt={currentVideo.user} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-white/60" />}
          </div>
          <div className="w-2 h-2 rounded-full bg-white" />
        </button>
        <button onClick={() => handleLike(currentVideo)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
          <Heart className={`w-6 h-6 transition-colors ${likedSet.has(currentVideo.id) ? 'fill-current' : ''}`} style={{ color: likedSet.has(currentVideo.id) ? 'var(--danger)' : 'white' }} />
          <p className="text-xs font-semibold text-white">{currentVideo.likes + (likedSet.has(currentVideo.id) ? 1 : 0)}</p>
        </button>
        <button onClick={() => onNavigateToComments?.(currentVideo.id)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
          <MessageCircle className="w-6 h-6 text-white" />
          <p className="text-xs font-semibold text-white">{commentCounts[currentVideo.id] || 0}</p>
        </button>
        <button onClick={() => handleShare(currentVideo)} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
          <Share2 className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.38) 28%, transparent 58%)' }} />

      <button
        onClick={goBack}
        disabled={index === 0}
        aria-label="Vidéo précédente"
        className="absolute top-1/2 left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-all active:scale-90 disabled:opacity-30"
      >
        <ChevronDown className="h-5 w-5 rotate-180 text-white" />
      </button>

      <button
        onClick={advance}
        disabled={transitioning || (!hasMore && index >= videos.length - 1)}
        aria-label="Vidéo suivante"
        className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-full bg-black/40 backdrop-blur-md p-3 transition-all active:scale-95 disabled:opacity-40"
      >
        <ChevronDown className="h-6 w-6 text-white" />
      </button>

      {loadingMore && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      )}
    </div>
  );
};

export default LikedVideoViewer;
