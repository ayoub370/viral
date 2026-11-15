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
    try { const { comments: data } = await apiClient.getComments(videoId); setComments(data); }
    catch (err) { console.error('Failed to load comments:', err); }
    finally { setLoading(false); }
  }, [videoId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try { const { comment } = await apiClient.addComment(videoId, trimmed); setComments([comment, ...comments]); setNewComment(''); }
    catch (err) { console.error('Failed to post comment:', err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId: string) => {
    try { await apiClient.deleteComment(commentId); setComments(comments.filter(c => c.id !== commentId)); }
    catch (err) { console.error('Failed to delete comment:', err); }
  };

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--divider-border)' }}>
        <button onClick={onBack} className="p-2 rounded-full transition-colors btn-secondary">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Commentaires{comments.length > 0 ? ` (${comments.length})` : ''}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <p className="text-center mt-8" style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Aucun commentaire</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Soyez le premier à commenter</p>
          </div>
        ) : (
          comments.map((comment) => {
            const profile = comment.user_profiles;
            const displayName = profile?.username || profile?.full_name || 'Utilisateur';
            return (
              <div key={comment.id} className="flex gap-3 pb-4" style={{ borderBottom: '1px solid var(--divider-border)' }}>
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTimestamp(comment.created_at)}</p>
                  </div>
                  <p className="text-sm mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{comment.text}</p>
                  <button onClick={() => handleDelete(comment.id)} className="text-xs mt-2 transition-colors" style={{ color: 'var(--text-faint)' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--divider-border)', background: 'var(--modal-bg)' }}>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            disabled={submitting}
            className="flex-1 input-field rounded-full"
          />
          <button onClick={handleAddComment} disabled={!newComment.trim() || submitting} className="p-3 rounded-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comments;
