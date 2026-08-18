import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/api';
import { Heart, MessageCircle, Share2, ChevronDown, User } from 'lucide-react';
import { apiClient } from '../lib/api';
import { recommendationEngine } from '../lib/recommendations';
import OutstreamAd from './OutstreamAd';
import ImaAdPlayer from './ImaAdPlayer';
import InterstitialAd from './InterstitialAd';

interface VideoData {
  id: number;
  videos: {
    medium: {
      url: string;
    };
  };
  user: string;
  user_id: number;
  userImageURL: string;
  likes: number;
  category?: string;
}

interface PexelsVideo {
  id: number;
  url: string;
  image: string;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    link: string;
  }>;
}

interface VideoFeedProps {
  onNavigateToProfile?: (userId: number) => void;
  onNavigateToComments?: (videoId: number) => void;
  onRequireLogin?: () => void;
  onNavigateToLive?: () => void;
}

const PIXABAY_API_KEY = '55347797-4c0e95303e5d504038b42fe1f';
const PIXABAY_API_URL = 'https://pixabay.com/api/videos/';

const PEXELS_API_KEY = '1OaC8a9BH8RnVM2WwKDrTYjwG9psnjWH6bMOGGTUM6pWRw3ItMXurOCg';
const PEXELS_API_URL = 'https://api.pexels.com/videos/';

const shuffle = (array: VideoData[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const VideoFeed: React.FC<VideoFeedProps> = ({ onNavigateToProfile, onNavigateToComments, onRequireLogin, onNavigateToLive }) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Navigation state
  const [videoIndex, setVideoIndex] = useState(0);
  const [showOutstream, setShowOutstream] = useState(false); // 5-min outstream (ExoClick)
  const [showImaOutstream, setShowImaOutstream] = useState(false); // 1-min outstream (VAST IMA)
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [activeNav, setActiveNav] = useState<'friends' | 'camera' | 'video' | null>(null);

  const lastOutstreamTimeRef = useRef<number>(0);
  const lastImaOutstreamTimeRef = useRef<number>(0);

  useEffect(() => {
    const video = videos[videoIndex];
    if (!video) return;

    supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('video_id', video.id)
      .then(({ count }) => {
        if (count !== null) {
          setCommentCounts(prev => ({ ...prev, [video.id]: count }));
        }
      });
  }, [videoIndex, videos]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pageRef = useRef<number>(1);
  const usedVideoIdsRef = useRef<Set<number>>(new Set());
  const loadingMoreRef = useRef<boolean>(false);
  const consecutiveEmptyResultsRef = useRef<number>(0);

  useEffect(() => {
    const initFeed = async () => {
      await recommendationEngine.init();
      const randomPage = Math.floor(Math.random() * 20) + 1;
      pageRef.current = randomPage;
      fetchVideos(randomPage);
    };
    initFeed();
    loadLikedVideos();
    loadCurrentUserId();
  }, []);

  const loadCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadLikedVideos = async () => {
    try {
      const { videoIds } = await apiClient.getLikedVideoIds();
      setLikedVideos(new Set(videoIds));
    } catch (error) {
      console.log('Could not load liked videos (user not logged in)');
    }
  };

  const fetchVideos = async (page: number = 1, append: boolean = false) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    try {
      if (!append) {
        setLoading(true);
        setError('');
      }

      const currentQuery = recommendationEngine.nextCategory();
      const allNewVideos: VideoData[] = [];

      // Fetch from Pixabay
      try {
        const pixabayResponse = await fetch(
          `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(currentQuery)}&per_page=10&page=${page}&order=latest`,
          { method: 'GET' }
        );

        if (pixabayResponse.ok) {
          const pixabayData = await pixabayResponse.json();
          if (pixabayData.hits) {
            pixabayData.hits.forEach((video: any) => {
              if (!usedVideoIdsRef.current.has(video.id)) {
                usedVideoIdsRef.current.add(video.id);
                allNewVideos.push({ ...video, category: currentQuery });
              }
            });
          }
        }
      } catch (e) {
        console.error('Pixabay fetch error:', e);
      }

      // Fetch from Pexels
      try {
        const pexelsResponse = await fetch(
          `${PEXELS_API_URL}search?query=${encodeURIComponent(currentQuery)}&per_page=10&page=${page}`,
          {
            method: 'GET',
            headers: {
              'Authorization': PEXELS_API_KEY
            }
          }
        );

        if (pexelsResponse.ok) {
          const pexelsData = await pexelsResponse.json();
          if (pexelsData.videos) {
            pexelsData.videos.forEach((pexelsVideo: PexelsVideo) => {
              const videoId = pexelsVideo.id + 1000000; // Offset to avoid ID collision with Pixabay
              if (!usedVideoIdsRef.current.has(videoId)) {
                usedVideoIdsRef.current.add(videoId);

                // Find the best quality video file (prefer HD)
                const videoFile = pexelsVideo.video_files.find(v => v.quality === 'hd') ||
                                  pexelsVideo.video_files.find(v => v.quality === 'sd') ||
                                  pexelsVideo.video_files[0];

                if (videoFile) {
                  allNewVideos.push({
                    id: videoId,
                    videos: {
                      medium: {
                        url: videoFile.link
                      }
                    },
                    user: pexelsVideo.user.name,
                    user_id: pexelsVideo.user.id,
                    userImageURL: '',
                    likes: 0,
                    category: currentQuery,
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        console.error('Pexels fetch error:', e);
      }

      // Shuffle and add videos
      let shuffledVideos = shuffle(allNewVideos);

      if (shuffledVideos.length === 0) {
        consecutiveEmptyResultsRef.current++;
        if (consecutiveEmptyResultsRef.current >= 3) {
          pageRef.current = 1;
          consecutiveEmptyResultsRef.current = 0;
        }
      } else {
        consecutiveEmptyResultsRef.current = 0;
      }

      if (append) {
        setVideos((prev) => [...prev, ...shuffledVideos]);
      } else {
        setVideos(shuffledVideos);
      }

      // If no videos at all, try next category from the engine
      if (shuffledVideos.length === 0 && !append) {
        pageRef.current = 1;
        fetchVideos(1, append);
        return;
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      if (!append) {
        setError('Failed to load videos');
      }
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  const loadMoreVideos = useCallback(() => {
    pageRef.current += 1;
    if (pageRef.current > 50) {
      pageRef.current = 1;
    }
    fetchVideos(pageRef.current, true);
  }, []);

  // Auto-play video when it changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && !showOutstream && !showImaOutstream && !showInterstitial) {
      video.play().catch(() => console.log('Autoplay prevented'));
    }
  }, [videoIndex, showOutstream, showImaOutstream, showInterstitial, videos]);

  // Load more videos when approaching end
  useEffect(() => {
    if (videoIndex >= videos.length - 3 && videos.length > 0 && !loadingMoreRef.current) {
      loadMoreVideos();
    }
  }, [videoIndex, videos.length, loadMoreVideos]);

  // Handle "Next" button click - show interstitial, then advance
  const handleNext = () => {
    setShowInterstitial(true);
  };

  // Handle interstitial close - advance to next video (with outstream if due)
  const handleInterstitialClose = () => {
    setShowInterstitial(false);

    // Priority 1: 5-min outstream (ExoClick)
    const elapsed5 = Date.now() - lastOutstreamTimeRef.current;
    if (elapsed5 >= 5 * 60 * 1000) {
      setShowOutstream(true);
      return;
    }

    // Priority 2: 1-min outstream (VAST IMA)
    const elapsed1 = Date.now() - lastImaOutstreamTimeRef.current;
    if (elapsed1 >= 1 * 60 * 1000) {
      setShowImaOutstream(true);
      return;
    }

    // No outstream due → next video
    setVideoIndex((prev) => Math.min(prev + 1, videos.length - 1));
  };

  // Handle 5-min outstream close - check 1-min outstream next
  const handleOutstreamClose = () => {
    lastOutstreamTimeRef.current = Date.now();
    setShowOutstream(false);

    // Check if 1-min IMA outstream is also due
    const elapsed1 = Date.now() - lastImaOutstreamTimeRef.current;
    if (elapsed1 >= 1 * 60 * 1000) {
      setShowImaOutstream(true);
      return;
    }

    setVideoIndex((prev) => Math.min(prev + 1, videos.length - 1));
  };

  // Handle 1-min IMA outstream close - advance to next video
  const handleImaOutstreamClose = () => {
    lastImaOutstreamTimeRef.current = Date.now();
    setShowImaOutstream(false);
    setVideoIndex((prev) => Math.min(prev + 1, videos.length - 1));
  };

  const handleLike = async (video: VideoData) => {
    const videoId = video.id;
    const isCurrentlyLiked = likedVideos.has(videoId);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onRequireLogin?.();
      return;
    }

    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyLiked) {
        await apiClient.unlikeVideo(videoId);
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
    } catch (error) {
      console.error('Error updating like:', error);
      setLikedVideos((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(videoId);
        } else {
          newSet.delete(videoId);
        }
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-black flex items-center justify-center" style={{ height: 'calc(100vh - 65px)' }}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="w-full bg-black flex items-center justify-center" style={{ height: 'calc(100vh - 65px)' }}>
        <div className="text-white text-center">
          <p className="mb-4">{error || 'No videos available'}</p>
          <button
            onClick={() => fetchVideos()}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[videoIndex];
  const buttonLabel = (showOutstream || showImaOutstream) ? 'Continuer' : 'Suivant';

  return (
    <>
      {/* Interstitial Ad overlay (ExoClick) */}
      {showInterstitial && (
        <InterstitialAd
          subId="123450000"
          onClose={handleInterstitialClose}
          userId={currentUserId || undefined}
        />
      )}

      {/* 1-min VAST IMA outstream overlay */}
      {showImaOutstream && (
        <ImaAdPlayer
          onAdComplete={handleImaOutstreamClose}
          showCloseAfter={5}
        />
      )}

      {/* Top Navigation Bar - thin, rounded, floating */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100]">
        <nav
          className="flex items-center gap-1 px-2 py-1.5 rounded-full"
          style={{
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* LEFT — Group/Friends */}
          <button
            onClick={() => setActiveNav(activeNav === 'friends' ? null : 'friends')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: activeNav === 'friends' ? 'white' : 'transparent',
              color: activeNav === 'friends' ? 'black' : 'white',
            }}
          >
            {activeNav === 'friends' ? (
              /* Filled glyph */
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="7" r="4" />
                <path d="M2 21c0-3.87 3.13-7 7-7s7 3.13 7 7H2z" />
                <circle cx="17.5" cy="6.5" r="2.8" />
                <path d="M22 20c0-2.76-2.02-5.03-4.72-5.42A8.96 8.96 0 0119 17c0 1.05-.18 2.07-.5 3H22z" />
              </svg>
            ) : (
              /* Outline */
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="3.5" />
                <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                <circle cx="17" cy="6" r="2.5" />
                <path d="M22 19c0-2.5-2.2-4.5-5-4.5" />
              </svg>
            )}
          </button>

          {/* MIDDLE — Live */}
          <button
            onClick={() => onNavigateToLive?.()}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: 'transparent',
              color: 'white',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>

          {/* RIGHT — Screen/Video player */}
          <button
            onClick={() => setActiveNav(activeNav === 'video' ? null : 'video')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              background: activeNav === 'video' ? 'white' : 'transparent',
              color: activeNav === 'video' ? 'black' : 'white',
            }}
          >
            {activeNav === 'video' ? (
              /* Filled glyph */
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="1" y="3" width="22" height="15" rx="2.5" ry="2.5" />
                <rect x="4" y="20" width="16" height="2" rx="1" />
                <polygon points="9,7.5 9,13.5 15.5,10.5" fill="white" />
              </svg>
            ) : (
              /* Outline */
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="14" rx="2.5" ry="2.5" />
                <line x1="5" y1="21" x2="19" y2="21" strokeWidth="2.5" />
                <polygon points="9.5,8.5 9.5,13.5 15,11" fill="currentColor" stroke="none" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      <div className="w-full bg-black relative" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Main Content Area */}
        <div className="w-full h-full relative">
          {!showOutstream && currentVideo ? (
            <>
              <video
                ref={videoRef}
                src={currentVideo.videos.medium.url}
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

              {/* Creator Info - Bottom Left */}
              <div className="absolute bottom-24 left-6 z-10">
                <p className="text-white text-sm font-semibold">{currentVideo.user}</p>
              </div>

              {/* Right Side Actions */}
              <div className="absolute bottom-24 right-6 flex flex-col gap-6 z-10">
                {/* Profile Button */}
                <button
                  onClick={() => onNavigateToProfile?.(currentVideo.user_id)}
                  className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white/10 flex items-center justify-center">
                    {currentVideo.userImageURL ? (
                      <img
                        src={currentVideo.userImageURL}
                        alt={currentVideo.user}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white/60" />
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </button>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(currentVideo)}
                  className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-6 h-6 transition-colors ${
                      likedVideos.has(currentVideo.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                  />
                  <p className="text-white text-xs font-semibold">
                    {currentVideo.likes + (likedVideos.has(currentVideo.id) ? 1 : 0)}
                  </p>
                </button>

                {/* Comments Button */}
                <button
                  onClick={() => onNavigateToComments?.(currentVideo.id)}
                  className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <p className="text-white text-xs font-semibold">{commentCounts[currentVideo.id] || 0}</p>
                </button>

                {/* Share Button */}
                <button className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>
            </>
          ) : showOutstream ? (
            <OutstreamAd zoneId={5946880} subId="123450000" userId={currentUserId || undefined} />
          ) : showImaOutstream ? (
            <div className="w-full h-full flex items-center justify-center bg-black" />
          ) : null}
        </div>

        {/* Next Button - Bottom Center, fixed so it sits above BottomNav */}
        <button
          onClick={handleNext}
          className="next-btn-suivant fixed bottom-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all active:scale-95"
          style={{ color: '#fff' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#fff' }}>{buttonLabel}</span>
          <ChevronDown className="w-5 h-5" style={{ color: '#fff' }} />
        </button>
      </div>
    </>
  );
};

export default VideoFeed;
