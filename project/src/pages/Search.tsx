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
  const { data, error } = await apiClient.fetchVideoFeed(query, page);
  if (error) throw error;
  return (data.videos || []).map((video: VideoResult) => ({ ...video, type: 'video', category: query }));
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

  useEffect(() => { loadLikedVideos(); }, []);

  const loadLikedVideos = async () => {
    try { const { videoIds } = await apiClient.getLikedVideoIds(); setLikedVideos(new Set(videoIds)); } catch { console.log('Could not load liked videos'); }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setVideoResults([]); return; }
    setSelectedCategory(null);
    debounceRef.current = setTimeout(() => { performSearch(query); }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    try { const videos = await fetchVideosFromBothApis(searchQuery); if (reqId === requestIdRef.current) setVideoResults(videos); }
    catch (error) { console.error('Search error:', error); }
    finally { if (reqId === requestIdRef.current) setLoading(false); }
  };

  const handleCategoryClick = useCallback(async (category: string) => {
    setSelectedCategory(category); setQuery(''); setLoading(true); setCategoryPage(1);
    const videos = await fetchVideosFromBothApis(category, 1);
    setVideoResults(videos); setLoading(false);
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
    setLikedVideos((prev) => { const newSet = new Set(prev); if (isCurrentlyLiked) newSet.delete(videoId); else newSet.add(videoId); return newSet; });
    try {
      if (isCurrentlyLiked) await apiClient.unlikeVideo(videoId);
      else await apiClient.likeVideo({ videoId: video.id, videoUrl: video.videos.medium.url, videoUser: video.user, videoUserId: video.user_id, videoUserImageUrl: video.userImageURL, videoLikes: video.likes });
    } catch (error) { console.error('Error updating like:', error); }
  };

  const showCategoryGrid = !query.trim() && !selectedCategory;
  const showCategoryVideos = selectedCategory && !query.trim();

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--page-bg)' }}>
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4" style={{ background: 'var(--nav-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--nav-border)' }}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des vidéos..."
            className="w-full rounded-full py-3 pl-12 pr-10 focus:outline-none input-field"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {showCategoryGrid && (
          <div>
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Catégories</h2>
            <div className="grid grid-cols-3 gap-3">
              {VIDEO_CATEGORIES.map((category) => {
                const info = CATEGORY_LABELS[category] || { emoji: '🎬', label: category };
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="relative aspect-square rounded-2xl overflow-hidden transition-all flex flex-col items-center justify-center gap-2 group glass"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{info.emoji}</span>
                    <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showCategoryVideos && (
          <div>
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 mb-4 transition-colors" style={{ color: 'var(--text-primary)' }}>
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold capitalize">{CATEGORY_LABELS[selectedCategory!]?.label || selectedCategory}</span>
            </button>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden animate-pulse" style={{ background: 'var(--card-bg)' }}>
                    <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5">
                      <div className="h-3 w-20 rounded bg-white/10" />
                      <div className="h-2 w-12 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : videoResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Play className="w-16 h-16 mb-4" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune vidéo trouvée</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {videoResults.map((video) => (
                    <div key={video.id} className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer" style={{ background: 'var(--card-bg)' }}>
                      <video src={video.videos.medium.url} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <Play className="w-12 h-12" style={{ color: '#fff' }} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                        <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{video.user}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Heart className="w-3 h-3" style={{ color: likedVideos.has(video.id) ? 'var(--danger)' : 'rgba(255,255,255,0.7)' }} fill={likedVideos.has(video.id) ? 'var(--danger)' : 'none'} />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{video.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={loadMoreCategoryVideos} disabled={loadingMoreCategory} className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 btn-secondary">
                  {loadingMoreCategory ? 'Chargement...' : 'Voir plus de vidéos'}
                </button>
              </>
            )}
          </div>
        )}

        {query.trim().length >= 2 && (
          loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden animate-pulse" style={{ background: 'var(--card-bg)' }}>
                  <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-2 w-12 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : videoResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Play className="w-16 h-16 mb-4" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune vidéo trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {videoResults.map((video) => (
                <div key={video.id} className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer" style={{ background: 'var(--card-bg)' }}>
                  <video src={video.videos.medium.url} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <Play className="w-12 h-12" style={{ color: '#fff' }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <p className="text-xs font-semibold truncate" style={{ color: '#fff' }}>{video.user}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3" style={{ color: likedVideos.has(video.id) ? 'var(--danger)' : 'rgba(255,255,255,0.7)' }} fill={likedVideos.has(video.id) ? 'var(--danger)' : 'none'} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{video.likes}</span>
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
