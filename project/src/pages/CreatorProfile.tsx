import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Send, User, Play } from 'lucide-react';
import { apiClient } from '../lib/api';

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
}

interface PexelsVideo {
  id: number;
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    link: string;
  }>;
  user: {
    id: number;
    name: string;
    url: string;
  };
}

interface CreatorProfileProps {
  userId: number;
  creatorName?: string;
  creatorImageUrl?: string;
  onBack: () => void;
  onNavigateToComments?: (videoId: number) => void;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ userId, creatorName, creatorImageUrl, onBack, onNavigateToComments }) => {
  const [creatorVideos, setCreatorVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [followState, setFollowState] = useState<'none' | 'following' | 'friends'>('none');
  const [followLoading, setFollowLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchCreatorVideos();
    loadLikedVideos();
    loadFollowState();
  }, [userId]);

  const loadLikedVideos = async () => {
    try {
      const { videoIds } = await apiClient.getLikedVideoIds();
      setLikedVideos(new Set(videoIds));
    } catch (error) {
      console.log('Could not load liked videos');
    }
  };

  const fetchCreatorVideos = async () => {
    try {
      setLoading(true);
      setError('');

      const allCreatorVideos: VideoData[] = [];

      const queries = ['nature', 'people', 'city', 'animals', 'food', 'travel', 'sports', 'music', 'business', 'technology'];
      for (const query of queries) {
        const { data, error } = await apiClient.fetchVideoFeed(query, 1);
        if (!error && data.videos) {
          allCreatorVideos.push(...data.videos.filter((video: VideoData) => video.user_id === userId));
        }
      }

      // Deduplicate by video ID
      const uniqueVideos = Array.from(
        allCreatorVideos.reduce((map, v) => map.set(v.id, v), new Map<number, VideoData>()).values()
      );

      if (uniqueVideos.length > 0) {
        setCreatorVideos(uniqueVideos);
      } else {
        // No videos found from external APIs - this is normal for many creators
        setCreatorVideos([]);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (video: VideoData) => {
    const videoId = video.id;
    const isCurrentlyLiked = likedVideos.has(videoId);

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

  const loadFollowState = async () => {
    try {
      const { isFollowing } = await apiClient.isFollowing(userId);
      if (!isFollowing) {
        setFollowState('none');
        return;
      }
      const { isMutual } = await apiClient.isMutualFollow(userId);
      setFollowState(isMutual ? 'friends' : 'following');
    } catch (err) {
      console.error('Failed to load follow state:', err);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;

    setFollowLoading(true);
    try {
      if (followState === 'none') {
        await apiClient.followCreator(userId, creatorName || '', creatorImageUrl || '');
        setFollowState('following');
      } else {
        await apiClient.unfollowCreator(userId);
        setFollowState('none');
      }
    } catch (err) {
      console.error('Failed to update follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen pb-20" style={{ background: 'var(--page-bg)' }}>
        <div className="pt-20 pb-8 px-6 text-center animate-pulse" style={{ borderBottom: '1px solid var(--divider-border)' }}>
          <div className="w-24 h-24 rounded-full mx-auto mb-4" style={{ background: 'var(--card-bg)' }} />
          <div className="h-5 w-32 mx-auto rounded mb-2" style={{ background: 'var(--card-bg)' }} />
          <div className="h-4 w-20 mx-auto rounded mb-4" style={{ background: 'var(--card-bg)' }} />
          <div className="flex justify-center gap-4">
            <div className="h-8 w-16 rounded" style={{ background: 'var(--card-bg)' }} />
            <div className="h-8 w-20 rounded" style={{ background: 'var(--card-bg)' }} />
            <div className="h-8 w-16 rounded" style={{ background: 'var(--card-bg)' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden animate-pulse" style={{ background: 'var(--card-bg)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className="w-full h-screen flex items-center justify-center relative" style={{ background: '#000' }}>
        <button
          onClick={() => setSelectedVideo(null)}
          className="absolute top-6 left-6 z-10 p-2 rounded-full transition-colors glass"
        >
          <ArrowLeft className="w-6 h-6" style={{ color: '#fff' }} />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={selectedVideo.videos.medium.url}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, transparent, rgba(0,0,0,0.3))' }} />

          <div className="absolute bottom-6 left-6 z-10">
            <p className="text-white text-sm font-semibold">{selectedVideo.user}</p>
          </div>

          <div className="absolute bottom-6 right-6 flex flex-col gap-6 z-10">
            <button
              onClick={() => handleLike(selectedVideo)}
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  likedVideos.has(selectedVideo.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-white'
                }`}
              />
              <p className="text-white text-xs font-semibold">
                {selectedVideo.likes + (likedVideos.has(selectedVideo.id) ? 1 : 0)}
              </p>
            </button>

            <button
              onClick={() => onNavigateToComments?.(selectedVideo.id)}
              className="flex flex-col items-center gap-2 hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <p className="text-white text-xs font-semibold">0</p>
            </button>

            <button className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = creatorName || creatorVideos[0]?.user || 'Creator';
  const displayImage = creatorImageUrl || creatorVideos[0]?.userImageURL || '';

  return (
    <div className="w-full min-h-screen pb-20" style={{ background: 'var(--page-bg)' }}>
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-10 p-2 rounded-full transition-colors glass"
      >
        <ArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
      </button>

      <div className="pt-20 pb-8 px-6 text-center" style={{ borderBottom: '1px solid var(--divider-border)' }}>
        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 flex items-center justify-center" style={{ border: '4px solid var(--card-border)', background: 'var(--card-bg)' }}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {creatorVideos.length > 0
            ? `${creatorVideos.length} ${creatorVideos.length === 1 ? 'vidéo' : 'vidéos'}`
            : 'Aucune vidéo disponible'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-50 btn-primary"
          >
            {followState === 'none' ? 'Suivre' : followState === 'following' ? 'Suivi' : 'Amis'}
          </button>
          <button
            className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 btn-secondary"
          >
            <Send className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      {creatorVideos.length > 0 ? (
        <div className="px-6 py-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {creatorVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="relative w-full aspect-square rounded-lg overflow-hidden group hover:scale-105 transition-transform"
              style={{ background: 'var(--card-bg)' }}
            >
              <video
                src={video.videos.medium.url}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Play className="w-6 h-6" style={{ color: '#fff' }} />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                {video.likes} ❤️
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ce créateur n'a pas encore de vidéos visibles.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreatorProfile;
