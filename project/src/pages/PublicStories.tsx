import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, X, Users, UserCheck, Plus, Camera, Sparkles } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { apiClient, supabase } from '../lib/api';
import { recommendationEngine, VIDEO_CATEGORIES } from '../lib/recommendations';

interface Story {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  profilePhotoUrl?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  caption?: string;
  createdAt: string;
  viewed: boolean;
}

interface StoryGroup {
  userId: string;
  username: string;
  fullName: string;
  profilePhotoUrl?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

interface PublicVideo {
  id: string;
  title: string;
  creator: string;
  previewUrl: string;
  videoUrl: string;
  source: 'Pixabay' | 'Pexels';
}

interface PublicStoriesProps {
  onBack: () => void;
  onNavigateToLive?: () => void;
  onNavigateToFeed?: () => void;
  onNavigateToCamera?: () => void;
}

const topics = ['travel', 'nature', 'city', 'food', 'sports', 'animals'];

const PublicStories: React.FC<PublicStoriesProps> = ({ onBack, onNavigateToLive, onNavigateToFeed, onNavigateToCamera }) => {
  const [friendStories, setFriendStories] = useState<StoryGroup[]>([]);
  const [followingStories, setFollowingStories] = useState<StoryGroup[]>([]);
  const [discoverVideos, setDiscoverVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [error, setError] = useState('');

  // Story viewer state
  const [activeGroup, setActiveGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [discoverIndex, setDiscoverIndex] = useState<number | null>(null);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadMediaUrl, setUploadMediaUrl] = useState('');
  const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');
  const [uploadPreview, setUploadPreview] = useState('');

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      await recommendationEngine.init();
      const preferredCategories = recommendationEngine.getTopCategories(8);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get friend IDs (accepted friendships)
      const [friendsRes, followsRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        supabase
          .from('follows')
          .select('creator_numeric_id')
          .eq('follower_id', user.id),
      ]);

      const friendIds = new Set<string>();
      (friendsRes.data || []).forEach((f: any) => {
        if (f.sender_id === user.id) friendIds.add(f.receiver_id);
        else friendIds.add(f.sender_id);
      });

      const followedNumericIds = (followsRes.data || []).map((f: any) => f.creator_numeric_id);

      // Get profiles for followed creators (by numeric_id)
      let followedProfileIds: string[] = [];
      if (followedNumericIds.length > 0) {
        const { data: followedProfiles } = await supabase
          .from('user_profiles')
          .select('id, numeric_id')
          .in('numeric_id', followedNumericIds);
        followedProfileIds = (followedProfiles || []).map((p: any) => p.id);
      }

      // Combine all user IDs to fetch stories for
      const allUserIds = [...friendIds, ...followedProfileIds];
      if (allUserIds.length === 0) {
        setFriendStories([]);
        setFollowingStories([]);
        setLoading(false);
        return;
      }

      // Fetch non-expired stories from these users
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id, user_id, media_url, media_type, thumbnail_url, caption, created_at, viewed_by,
          user_profiles!inner(id, username, full_name, profile_photo_url)
        `)
        .in('user_id', allUserIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) {
        // Table might not exist yet — gracefully degrade
        setFriendStories([]);
        setFollowingStories([]);
        setLoading(false);
        return;
      }

      const friendIdSet = new Set(friendIds);
      const followedIdSet = new Set(followedProfileIds);

      const friendGroupsMap = new Map<string, StoryGroup>();
      const followingGroupsMap = new Map<string, StoryGroup>();

      (storiesData || []).forEach((s: any) => {
        const profile = Array.isArray(s.user_profiles) ? s.user_profiles[0] : s.user_profiles;
        if (!profile) return;

        const story: Story = {
          id: s.id,
          userId: s.user_id,
          username: profile.username,
          fullName: profile.full_name,
          profilePhotoUrl: profile.profile_photo_url,
          mediaUrl: s.media_url,
          mediaType: s.media_type,
          thumbnailUrl: s.thumbnail_url,
          caption: s.caption,
          createdAt: s.created_at,
          viewed: (s.viewed_by || []).includes(user.id),
        };

        const isFriend = friendIdSet.has(s.user_id);
        const isFollowed = followedIdSet.has(s.user_id);

        const targetMap = isFriend ? friendGroupsMap : isFollowed ? followingGroupsMap : null;
        if (!targetMap) return;

        let group = targetMap.get(s.user_id);
        if (!group) {
          group = {
            userId: s.user_id,
            username: profile.username,
            fullName: profile.full_name,
            profilePhotoUrl: profile.profile_photo_url,
            stories: [],
            hasUnviewed: false,
          };
          targetMap.set(s.user_id, group);
        }
        group.stories.push(story);
        if (!story.viewed) group.hasUnviewed = true;
      });

      const scoreGroup = (group: StoryGroup, relationshipScore: number): number => {
        const newestStory = group.stories.reduce((latest, story) =>
          story.createdAt > latest.createdAt ? story : latest,
        group.stories[0]);
        const ageHours = Math.max(0, (Date.now() - new Date(newestStory.createdAt).getTime()) / 3_600_000);
        const captionText = group.stories.map((story) => story.caption || '').join(' ').toLowerCase();
        const preferenceScore = preferredCategories.reduce((score, category, index) => {
          const matchesCaption = captionText.includes(category.toLowerCase());
          return score + (matchesCaption ? Math.max(2, 16 - index * 2) : 0);
        }, 0);
        const topicScore = VIDEO_CATEGORIES.some((category) => captionText.includes(category)) ? 4 : 0;
        return (group.hasUnviewed ? 100 : 0) + relationshipScore + preferenceScore + topicScore + Math.max(0, 24 - ageHours);
      };

      const sortGroups = (groups: StoryGroup[], relationshipScore: number) =>
        groups.sort((a, b) => scoreGroup(b, relationshipScore) - scoreGroup(a, relationshipScore));

      setFriendStories(sortGroups(Array.from(friendGroupsMap.values()), 30));
      setFollowingStories(sortGroups(Array.from(followingGroupsMap.values()), 20));
    } catch (err) {
      console.error('Error loading stories:', err);
      setFriendStories([]);
      setFollowingStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDiscoverVideos = useCallback(async () => {
    try {
      setLoadingDiscover(true);
      await recommendationEngine.init();
      const preferredTopics = recommendationEngine.nextCategories(4);
      const topicsToLoad = preferredTopics.length > 0 ? preferredTopics : [topics[Math.floor(Math.random() * topics.length)]];
      const results: PublicVideo[] = [];
      const responses = await Promise.all(
        topicsToLoad.map((topic, index) => apiClient.fetchVideoFeed(topic, index + 1)),
      );
      for (const [index, response] of responses.entries()) {
        if (response.error && index === 0) throw response.error;
        const topic = topicsToLoad[index];
        const data = response.data;
        for (const video of data.videos ?? []) {
        if (video.videos?.medium?.url) {
          results.push({
            id: `${video.source?.toLowerCase() || 'video'}-${video.id}`,
            title: video.title || topic,
            creator: video.user || 'Créateur public',
            previewUrl: video.previewUrl || '',
            videoUrl: video.videos.medium.url,
            source: video.source === 'Pexels' ? 'Pexels' : 'Pixabay',
          });
        }
        }
      }

      const unique = results.filter(
        (video, index, list) => list.findIndex((item) => item.videoUrl === video.videoUrl) === index
      );
      setDiscoverVideos(unique);
    } catch (err) {
      console.error('Error loading discover videos:', err);
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
    loadDiscoverVideos();
  }, [loadStories, loadDiscoverVideos]);

  const markStoryViewed = useCallback(async (storyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.rpc('mark_story_viewed', { story_id: storyId, viewer_id: user.id });
    } catch {
      // RPC might not exist — try direct update
      try {
        await supabase
          .from('stories')
          .update({ viewed_by: [...(activeGroup?.stories[activeStoryIndex]?.viewed ? [] : []), user.id] })
          .eq('id', storyId);
      } catch (e) {
        console.error('Could not mark story as viewed:', e);
      }
    }
  }, [activeGroup, activeStoryIndex]);

  const openStoryGroup = (group: StoryGroup) => {
    setActiveGroup(group);
    setActiveStoryIndex(0);
    const firstStory = group.stories[0];
    if (firstStory && !firstStory.viewed) {
      markStoryViewed(firstStory.id);
    }
  };

  const nextStory = () => {
    if (!activeGroup) return;
    if (activeStoryIndex < activeGroup.stories.length - 1) {
      const next = activeStoryIndex + 1;
      setActiveStoryIndex(next);
      if (!activeGroup.stories[next].viewed) {
        markStoryViewed(activeGroup.stories[next].id);
      }
    } else {
      setActiveGroup(null);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
  };

  const moveDiscover = (dir: number) => {
    if (discoverIndex === null || discoverVideos.length === 0) return;
    setDiscoverIndex((discoverIndex + dir + discoverVideos.length) % discoverVideos.length);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setUploadMediaType(isVideo ? 'video' : 'image');
    setUploadPreview(URL.createObjectURL(file));

    // Upload to Supabase Storage
    const uploadFile = async () => {
      try {
        setUploading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('stories').getPublicUrl(path);
        setUploadMediaUrl(urlData.publicUrl);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Erreur lors du téléversement. Le bucket "stories" n\'est peut-être pas créé.');
      } finally {
        setUploading(false);
      }
    };

    uploadFile();
  };

  const submitStory = async () => {
    if (!uploadMediaUrl) return;
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: uploadMediaUrl,
        media_type: uploadMediaType,
        thumbnail_url: uploadMediaType === 'video' ? uploadPreview : null,
        caption: uploadCaption.trim() || null,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      setShowUpload(false);
      setUploadCaption('');
      setUploadMediaUrl('');
      setUploadPreview('');
      await loadStories();
    } catch (err) {
      console.error('Error submitting story:', err);
      alert('Erreur lors de la publication. La table "stories" n\'est peut-être pas encore créée.');
    } finally {
      setUploading(false);
    }
  };

  const hasAnyStories = friendStories.length > 0 || followingStories.length > 0;
  const activeDiscoverVideo = useMemo(
    () => (discoverIndex === null ? null : discoverVideos[discoverIndex] ?? null),
    [discoverIndex, discoverVideos]
  );

  const renderStoryRing = (group: StoryGroup, onClick: () => void) => (
    <button key={group.userId} onClick={onClick} className="flex-shrink-0 text-center group">
      <div className={`relative h-16 w-16 overflow-hidden rounded-full border-2 bg-gray-800 transition-transform group-active:scale-90 ${
        group.hasUnviewed ? '' : ''
      }
      style={{ borderColor: group.hasUnviewed ? 'var(--text-primary)' : 'var(--card-border)' }}`}>
        {group.profilePhotoUrl ? (
          <img src={group.profilePhotoUrl} alt={group.username} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Users className="h-6 w-6 text-gray-500" />
          </div>
        )}
      </div>
      <p className="mt-2 max-w-[72px] truncate text-xs font-medium text-white/70">
        @{group.username}
      </p>
    </button>
  );

  return (
    <main className="dark-surface min-h-screen pb-10 text-white" style={{ background: '#000000' }}>
      <TopNav
        activeTab="story"
        onNavigateToStories={() => {}}
        onNavigateToLive={() => onNavigateToLive?.()}
        onNavigateToFeed={() => onNavigateToFeed?.()}
      />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-5 pb-4 pt-20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={onBack}
            aria-label="Retour à l'accueil"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition-transform active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-lg font-semibold">Story</p>
            <p className="text-xs text-white/55">Les stories de vos amis et créateurs suivis</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            aria-label="Créer une story"
            className="flex h-10 w-10 items-center justify-center rounded-full btn-primary transition-transform active:scale-90"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-7">
        {/* Amis section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-lg font-bold tracking-tight">Amis</h2>
            <span className="ml-auto text-xs text-white/40">{friendStories.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                  <div className="mt-2 h-3 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : friendStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
              <Users className="mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/50">Aucun ami n'a posté de story</p>
              <p className="mt-1 text-xs text-white/30">Les stories de vos amis apparaîtront ici</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {friendStories.map((group) => renderStoryRing(group, () => openStoryGroup(group)))}
            </div>
          )}
        </div>

        {/* Suivis section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-lg font-bold tracking-tight">Suivis</h2>
            <span className="ml-auto text-xs text-white/40">{followingStories.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                  <div className="mt-2 h-3 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : followingStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
              <UserCheck className="mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/50">Aucun créateur suivi n'a posté de story</p>
              <p className="mt-1 text-xs text-white/30">Suivez des créateurs pour voir leurs stories</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {followingStories.map((group) => renderStoryRing(group, () => openStoryGroup(group)))}
            </div>
          )}
        </div>

        {/* Discover section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-lg font-bold tracking-tight">Découvrir</h2>
          </div>
          <p className="mb-4 text-sm text-white/50">
            {!hasAnyStories
              ? 'Aucune story disponible pour le moment. Découvrez des vidéos ci-dessous.'
              : 'Des vidéos publiques à découvrir pendant que vous attendez de nouvelles stories.'}
          </p>

          {loadingDiscover && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[9/14] animate-pulse rounded-3xl bg-white/10" />
              ))}
            </div>
          )}

          {!loadingDiscover && discoverVideos.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/50">Aucune vidéo à découvrir pour le moment.</p>
            </div>
          )}

          {!loadingDiscover && discoverVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {discoverVideos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setDiscoverIndex(index)}
                  className="group relative aspect-[9/14] overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left shadow-2xl transition-transform hover:-translate-y-1 active:scale-[.98]"
                >
                  {video.previewUrl ? (
                    <img src={video.previewUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <video src={video.videoUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                    {video.source}
                  </span>
                  <span className="absolute bottom-4 left-4 right-4">
                    <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                    <span className="mt-3 block truncate text-sm font-semibold">{video.creator}</span>
                    <span className="mt-1 block text-xs capitalize text-white/60">{video.title}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Story viewer modal */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {activeGroup.stories.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    i < activeStoryIndex ? 'w-full' : i === activeStoryIndex ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-10 left-4 right-4 z-20 flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/30 bg-gray-800">
              {activeGroup.profilePhotoUrl ? (
                <img src={activeGroup.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">@{activeGroup.username}</p>
              <p className="text-xs text-white/50">
                {new Date(activeGroup.stories[activeStoryIndex].createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <button onClick={() => setActiveGroup(null)} aria-label="Fermer" className="absolute right-5 top-14 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <X className="h-5 w-5" />
          </button>

          <button onClick={prevStory} aria-label="Story précédente" className="absolute left-3 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 sm:flex">
            <ChevronLeft />
          </button>

          <div className="relative h-[82vh] w-full max-w-[440px] overflow-hidden rounded-3xl" style={{ background: 'var(--card-bg)' }}>
            {activeGroup.stories[activeStoryIndex].mediaType === 'video' ? (
              <video
                key={activeGroup.stories[activeStoryIndex].id}
                src={activeGroup.stories[activeStoryIndex].mediaUrl}
                poster={activeGroup.stories[activeStoryIndex].thumbnailUrl}
                autoPlay
                playsInline
                controls
                onEnded={nextStory}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                key={activeGroup.stories[activeStoryIndex].id}
                src={activeGroup.stories[activeStoryIndex].mediaUrl}
                alt=""
                onClick={nextStory}
                className="h-full w-full cursor-pointer object-cover"
              />
            )}
            {activeGroup.stories[activeStoryIndex].caption && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <p className="text-sm">{activeGroup.stories[activeStoryIndex].caption}</p>
              </div>
            )}
          </div>

          <button onClick={nextStory} aria-label="Story suivante" className="absolute right-3 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 sm:flex">
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Discover video viewer */}
      {activeDiscoverVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <button onClick={() => setDiscoverIndex(null)} aria-label="Fermer" className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => moveDiscover(-1)} aria-label="Vidéo précédente" className="absolute left-3 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 sm:flex">
            <ChevronLeft />
          </button>
          <div className="relative h-[82vh] w-full max-w-[440px] overflow-hidden rounded-3xl" style={{ background: 'var(--card-bg)' }}>
            <video key={activeDiscoverVideo.id} src={activeDiscoverVideo.videoUrl} poster={activeDiscoverVideo.previewUrl} autoPlay playsInline controls className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
              <p className="font-semibold">{activeDiscoverVideo.creator}</p>
              <p className="mt-1 text-sm capitalize text-white/60">{activeDiscoverVideo.title} · {activeDiscoverVideo.source}</p>
            </div>
          </div>
          <button onClick={() => moveDiscover(1)} aria-label="Vidéo suivante" className="absolute right-3 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 sm:flex">
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Créer une story</h3>
              <button onClick={() => { setShowUpload(false); setUploadPreview(''); setUploadMediaUrl(''); setUploadCaption(''); }} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!uploadPreview ? (
              <label className="flex aspect-[9/14] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:border-white/40">
                <Camera className="mb-3 h-10 w-10 text-white/30" />
                <p className="text-sm text-white/50">Touchez pour sélectionner une photo ou vidéo</p>
                <p className="mt-1 text-xs text-white/30">La story expirera dans 24h</p>
                <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
              </label>
            ) : (
              <>
                <div className="mb-4 aspect-[9/14] overflow-hidden rounded-2xl bg-black">
                  {uploadMediaType === 'video' ? (
                    <video src={uploadPreview} muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    <img src={uploadPreview} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Légende (optionnel)"
                  maxLength={200}
                  className="mb-4 w-full rounded-xl px-4 py-3 text-sm focus:outline-none input-field"
                />
                <button
                  onClick={submitStory}
                  disabled={!uploadMediaUrl || uploading}
                  className="w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-50 btn-primary"
                >
                  {uploading ? 'Publication...' : !uploadMediaUrl ? 'Téléversement...' : 'Publier la story'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default PublicStories;
