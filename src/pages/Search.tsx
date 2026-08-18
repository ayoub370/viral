import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, Play, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { VIDEO_CATEGORIES } from '../lib/recommendations';

interface VideoResult {
  id: number;
  videos: { medium: { url: string } };
  user: string;
  user_id: number;
  userImageURL: string;
  likes: number;
  type: 'video';
  category?: string;
}

interface PexelsVideo {
  id: number;
  user: { id: number; name: string };
  video_files: Array<{ quality: string; link: string }>;
}

const PIXABAY_API_KEY = '55347797-4c0e95303e5d504038b42fe1f';
const PIXABAY_API_URL = 'https://pixabay.com/api/videos/';
const PEXELS_API_KEY = '1OaC8a9BH8RnVM2WwKDrTYjwG9psnjWH6bMOGGTUM6pWRw3ItMXurOCg';
const PEXELS_API_URL = 'https://api.pexels.com/videos/';

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  nature: { emoji: '🌿', label: 'Nature' },
  travel: { emoji: '✈️', label: 'Voyage' },
  animals: { emoji: '🐾', label: 'Animaux' },
  city: { emoji: '🏙️', label: 'Ville' },
  beach: { emoji: '🏖️', label: 'Plage' },
  forest: { emoji: '🌲', label: 'Forêt' },
  mountains: { emoji: '⛰️', label: 'Montagnes' },
  ocean: { emoji: '🌊', label: 'Océan' },
  sunset: { emoji: '🌅', label: 'Coucher de soleil' },
  wildlife: { emoji: '🦁', label: 'Faune sauvage' },
  landscape: { emoji: '🏞️', label: 'Paysage' },
  adventure: { emoji: '🧗', label: 'Aventure' },
  drone: { emoji: '🚁', label: 'Drone' },
  aerial: { emoji: '🛩️', label: 'Aérien' },
  waterfall: { emoji: '💧', label: 'Cascade' },
  food: { emoji: '🍽️', label: 'Nourriture' },
  architecture: { emoji: '🏛️', label: 'Architecture' },
  people: { emoji: '👥', label: 'Personnes' },
  sports: { emoji: '⚽', label: 'Sport' },
  technology: { emoji: '💻', label: 'Technologie' },
  cars: { emoji: '🚗', label: 'Voitures' },
  fashion: { emoji: '👗', label: 'Mode' },
  music: { emoji: '🎵', label: 'Musique' },
  dance: { emoji: '💃', label: 'Danse' },
  fitness: { emoji: '💪', label: 'Fitness' },
  cooking: { emoji: '🍳', label: 'Cuisine' },
  art: { emoji: '🎨', label: 'Art' },
  space: { emoji: '🚀', label: 'Espace' },
  flowers: { emoji: '🌸', label: 'Fleurs' },
  snow: { emoji: '❄️', label: 'Neige' },
  desert: { emoji: '🏜️', label: 'Désert' },
};

const fetchVideosFromBothApis = async (query: string, page: number = 1): Promise<VideoResult[]> => {
  const [pixabayPromise, pexelsPromise] = await Promise.allSettled([
    fetch(
      `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=15&page=${page}&order=popular`,
      { method: 'GET' }
    ).then(r => r.ok ? r.json() : null),
    fetch(
      `${PEXELS_API_URL}search?query=${encodeURIComponent(query)}&per_page=15&page=${page}`,
      { method: 'GET', headers: { Authorization: PEXELS_API_KEY } }
    ).then(r => r.ok ? r.json() : null),
  ]);

  const results: VideoResult[] = [];
  const seenIds = new Set<number>();

  if (pixabayPromise.status === 'fulfilled' && pixabayPromise.value?.hits) {
    for (const video of pixabayPromise.value.hits) {
      if (!seenIds.has(video.id)) {
        seenIds.add(video.id);
        results.push({ ...video, type: 'video', category: query });
      }
    }
  }

  if (pexelsPromise.status === 'fulfilled' && pexelsPromise.value?.videos) {
    for (const pv of pexelsPromise.value.videos as PexelsVideo[]) {
      const videoId = pv.id + 1000000;
      if (!seenIds.has(videoId)) {
        seenIds.add(videoId);
        const videoFile = pv.video_files.find(v => v.quality === 'hd') ||
                          pv.video_files.find(v => v.quality === 'sd') ||
                          pv.video_files[0];
        if (videoFile) {
          results.push({
            id: videoId,
            videos: { medium: { url: videoFile.link } },
            user: pv.user.name,
            user_id: pv.user.id,
            userImageURL: '',
            likes: 0,
            type: 'video',
            category: query,
          });
        }
      }
    }
  }

  return results;
};

const SearchPage: React.FC<{
  onNavigateToProfile?: (userId: number) => void;
  onNavigateToCreator?: (userId: number) => void;
  onNavigate?: (page: string) => void;
}> = () => {
  const [query, setQuery] = useState('');
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [loadingMoreCategory, setLoadingMoreCategory] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    loadLikedVideos();
  }, []);

  const loadLikedVideos = async () => {
    try {
      const { videoIds } = await apiClient.getLikedVideoIds();
      setLikedVideos(new Set(videoIds));
    } catch {
      console.log('Could not load liked videos');
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setVideoResults([]);
      return;
    }

    setSelectedCategory(null);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const videos = await fetchVideosFromBothApis(searchQuery);
      if (reqId === requestIdRef.current) {
        setVideoResults(videos);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  const handleCategoryClick = useCallback(async (category: string) => {
    setSelectedCategory(category);
    setQuery('');
    setLoading(true);
    setCategoryPage(1);

    const videos = await fetchVideosFromBothApis(category, 1);
    setVideoResults(videos);
    setLoading(false);
  }, []);

  const loadMoreCategoryVideos = useCallback(async () => {
    if (loadingMoreCategory || !selectedCategory) return;
    setLoadingMoreCategory(true);
    const nextPage = categoryPage + 1;
    setCategoryPage(nextPage);
    const moreVideos = await fetchVideosFromBothApis(selectedCategory, nextPage);
    setVideoResults(prev => [...prev, ...moreVideos]);
    setLoadingMoreCategory(false);
  }, [loadingMoreCategory, selectedCategory, categoryPage]);

  const handleLike = async (video: VideoResult) => {
    const videoId = video.id;
    const isCurrentlyLiked = likedVideos.has(videoId);

    setLikedVideos((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) newSet.delete(videoId);
      else newSet.add(videoId);
      return newSet;
    });

    try {
      if (isCurrentlyLiked) {
        await apiClient.unlikeVideo(videoId);
      } else {
        await apiClient.likeVideo({
          videoId: video.id,
          videoUrl: video.videos.medium.url,
          videoUser: video.user,
          videoUserId: video.user_id,
          videoUserImageUrl: video.userImageURL,
          videoLikes: video.likes,
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const showCategoryGrid = !query.trim() && !selectedCategory;
  const showCategoryVideos = selectedCategory && !query.trim();

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 pt-12 pb-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des vidéos..."
            className="w-full bg-gray-900 text-white rounded-full py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-gray-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Category grid - shown by default before any search */}
        {showCategoryGrid && (
          <div>
            <h2 className="text-white font-bold text-lg mb-4">Catégories</h2>
            <div className="grid grid-cols-3 gap-3">
              {VIDEO_CATEGORIES.map((category) => {
                const info = CATEGORY_LABELS[category] || { emoji: '🎬', label: category };
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{info.emoji}</span>
                    <span className="text-white text-xs font-semibold capitalize">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category videos view */}
        {showCategoryVideos && (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-white mb-4 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold capitalize">
                {CATEGORY_LABELS[selectedCategory]?.label || selectedCategory}
              </span>
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Chargement des vidéos...</p>
              </div>
            ) : videoResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Play className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-gray-500 text-sm">Aucune vidéo trouvée</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {videoResults.map((video) => (
                    <div
                      key={video.id}
                      className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group cursor-pointer"
                    >
                      <video
                        src={video.videos.medium.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs font-semibold truncate">{video.user}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Heart className="w-3 h-3 text-gray-300" />
                          <span className="text-gray-300 text-xs">{video.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={loadMoreCategoryVideos}
                  disabled={loadingMoreCategory}
                  className="w-full mt-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loadingMoreCategory ? 'Chargement...' : 'Voir plus de vidéos'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Search results */}
        {query.trim().length >= 2 && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Recherche en cours...</p>
            </div>
          ) : videoResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Play className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm">Aucune vidéo trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {videoResults.map((video) => (
                <div
                  key={video.id}
                  className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group cursor-pointer"
                >
                  <video
                    src={video.videos.medium.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs font-semibold truncate">{video.user}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3 text-gray-300" />
                      <span className="text-gray-300 text-xs">{video.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SearchPage;
