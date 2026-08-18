import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiClient } from '../lib/api';

interface Comment {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  user_profiles: {
    username: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface CommentsProps {
  videoId: number;
  onBack: () => void;
}

const formatTimestamp = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return 'maintenant';
};

const Comments: React.FC<CommentsProps> = ({ videoId, onBack }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const { comments: data } = await apiClient.getComments(videoId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const { comment } = await apiClient.addComment(videoId, trimmed);
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiClient.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-xl font-bold">
          Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
        </h1>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <p className="text-white/50 text-center mt-8">Chargement...</p>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <p className="text-white/50 text-lg">Aucun commentaire</p>
            <p className="text-white/30 text-sm mt-1">Soyez le premier à commenter</p>
          </div>
        ) : (
          comments.map((comment) => {
            const profile = comment.user_profiles;
            const displayName = profile?.username || profile?.full_name || 'Utilisateur';
            return (
              <div key={comment.id} className="flex gap-3 pb-4 border-b border-white/10">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{displayName}</p>
                    <p className="text-white/50 text-xs">{formatTimestamp(comment.created_at)}</p>
                  </div>
                  <p className="text-white/80 text-sm mt-1 break-words">{comment.text}</p>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-white/30 hover:text-red-400 text-xs mt-2 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Field */}
      <div className="px-6 py-4 border-t border-white/10 bg-gradient-to-t from-gray-950 to-transparent">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            disabled={submitting}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || submitting}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comments;
