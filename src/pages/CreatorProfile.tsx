import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Send, User } from 'lucide-react';
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

interface CreatorProfileProps {
  userId: number;
  onBack: () => void;
  onNavigateToComments?: (videoId: number) => void;
}

const PIXABAY_API_KEY = '55347797-4c0e95303e5d504038b42fe1f';
const PIXABAY_API_URL = 'https://pixabay.com/api/videos/';

const CreatorProfile: React.FC<CreatorProfileProps> = ({ userId, onBack, onNavigateToComments }) => {
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

      const response = await fetch(
        `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=nature&per_page=50`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        const filteredVideos = data.hits.filter((v: VideoData) => v.user_id === userId);
        if (filteredVideos.length === 0) {
          setError('No videos from this creator');
        } else {
          setCreatorVideos(filteredVideos);
        }
      } else {
        setError('No videos found');
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
    const creator = creatorVideos[0];
    if (!creator) return;

    setFollowLoading(true);
    try {
      if (followState === 'none') {
        await apiClient.followCreator(userId, creator.user, creator.userImageURL);
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
      <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center relative">
        <button
          onClick={() => setSelectedVideo(null)}
          className="absolute top-6 left-6 z-10 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
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

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

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

  if (error && creatorVideos.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <p className="text-white mb-4">{error}</p>
        <button
          onClick={onBack}
          className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const creator = creatorVideos[0];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-10 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Header */}
      <div className="pt-20 pb-8 px-6 text-center border-b border-white/10">
        <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden mx-auto mb-4 bg-white/10 flex items-center justify-center">
          {creator.userImageURL ? (
            <img
              src={creator.userImageURL}
              alt={creator.user}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-white/60" />
          )}
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">{creator.user}</h1>
        <p className="text-white/60 text-sm mb-4">{creatorVideos.length} videos</p>

        {/* Follow + Message buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 disabled:opacity-50 ${
              followState === 'none'
                ? 'bg-white text-black hover:bg-gray-200'
                : followState === 'following'
                ? 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                : 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
            }`}
          >
            {followState === 'none' ? 'Suivre' : followState === 'following' ? 'Suivi' : 'Amis'}
          </button>
          <button
            className="px-6 py-2.5 rounded-full font-semibold text-sm bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="px-6 py-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {creatorVideos.map((video) => (
          <button
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="relative w-full aspect-square rounded-lg overflow-hidden group hover:scale-105 transition-transform"
          >
            <video
              src={video.videos.medium.url}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-transparent border-b-6 border-b-white ml-1"></div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
              {video.likes} ❤️
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CreatorProfile;
