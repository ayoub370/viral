import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, MessageCircle, Send, User, Search, ArrowLeft, Play, X, Check, UserPlus, Clock, CheckCheck, ChevronDown, Archive, Star, Mic } from 'lucide-react';
import { supabase } from '../lib/api';

interface Friend {
  id: string;
  username: string;
  fullName: string;
  profilePhotoUrl?: string;
  friendshipId: string;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderFullName: string;
  senderPhotoUrl?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  videoId?: number;
  videoUrl?: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  friendId: string;
  lastMessage: Message | null;
  unreadCount: number;
  hasStory: boolean;
  isFavorite: boolean;
  isArchived: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'maintenant';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHr < 24) return `${diffHr} h`;
  if (diffDay === 1) return 'hier';
  if (diffDay < 7) return `${diffDay} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <div className="w-12 h-12 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--card-bg)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--card-bg)' }} />
        <div className="h-3 w-40 rounded animate-pulse" style={{ background: 'var(--card-bg)' }} />
      </div>
    </div>
  );
}

function SkeletonConversationRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <div className="w-12 h-12 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--card-bg)' }} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded animate-pulse" style={{ background: 'var(--card-bg)' }} />
          <div className="h-3 w-10 rounded animate-pulse" style={{ background: 'var(--card-bg)' }} />
        </div>
        <div className="h-3 w-48 rounded animate-pulse" style={{ background: 'var(--card-bg)' }} />
      </div>
    </div>
  );
}

function SkeletonChatBubbles() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-[75%] rounded-2xl px-4 py-3 space-y-2 animate-pulse" style={{ background: 'var(--card-bg)', width: `${120 + (i % 3) * 60}px` }}>
            <div className="h-3 rounded" style={{ background: 'var(--divider-border)' }} />
            {i % 2 === 0 && <div className="h-3 w-2/3 rounded" style={{ background: 'var(--divider-border)' }} />}
            <div className="h-2 w-12 rounded" style={{ background: 'var(--divider-border)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AvatarRing({ photoUrl, username, hasStory, size = 'w-12 h-12' }: { photoUrl?: string; username: string; hasStory?: boolean; size?: string }) {
  const ringClass = hasStory
    ? 'p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500'
    : 'p-[2px] rounded-full';
  const innerSize = size === 'w-12 h-12' ? 'w-full h-full' : size;

  return (
    <div className={`${ringClass} flex-shrink-0`}>
      <div className={`${innerSize} rounded-full overflow-hidden`} style={{ background: 'var(--card-bg)', border: hasStory ? '2px solid var(--page-bg)' : '1px solid var(--card-border)' }}>
        {photoUrl ? (
          <img src={photoUrl} alt={username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

const FriendsPage: React.FC<{
  onNavigateToCreator?: (userId: number) => void;
  onNavigate?: (page: string) => void;
}> = ({ onNavigateToCreator }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'messages'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [msgSearch, setMsgSearch] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFriends(), loadFriendRequests(), loadConversations()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          sender_id,
          receiver_id,
          user_profiles!friendships_receiver_id_fkey (id, username, full_name, profile_photo_url),
          sender:user_profiles!friendships_sender_id_fkey (id, username, full_name, profile_photo_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      const friendsList: Friend[] = (data || []).map((f: any) => {
        const isSender = f.sender_id === user.id;
        const profile = isSender ? f.user_profiles : f.sender;
        return {
          id: profile.id,
          username: profile.username,
          fullName: profile.full_name,
          profilePhotoUrl: profile.profile_photo_url,
          friendshipId: f.id,
        };
      });

      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          sender_id,
          sender:user_profiles!friendships_sender_id_fkey (id, username, full_name, profile_photo_url)
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading friend requests:', error);
        return;
      }

      const requests: FriendRequest[] = (data || []).map((r: any) => ({
        id: r.id,
        senderId: r.sender.id,
        senderUsername: r.sender.username,
        senderFullName: r.sender.full_name,
        senderPhotoUrl: r.sender.profile_photo_url,
      }));

      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          video_id,
          video_url,
          read,
          created_at
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (friendId: string) => {
    try {
      setMessagesLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friendId)
        .eq('read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedFriend.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedFriend.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const pattern = `%${query}%`;
      const [usernameRes, fullNameRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, username, full_name, profile_photo_url')
          .ilike('username', pattern)
          .limit(10),
        supabase
          .from('user_profiles')
          .select('id, username, full_name, profile_photo_url')
          .ilike('full_name', pattern)
          .limit(10),
      ]);

      const all = [...(usernameRes.data || []), ...(fullNameRes.data || [])];
      const seen = new Set<string>();
      const unique = all.filter((u) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });

      setSearchResults(unique);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('friendships')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          alert('Demande déjà envoyée');
        } else {
          throw error;
        }
      } else {
        alert('Demande envoyée');
      }

      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const getLastMessage = (friendId: string): Message | null => {
    const friendMessages = messages.filter(
      m => m.senderId === friendId || m.receiverId === friendId
    );
    return friendMessages.length > 0 ? friendMessages[friendMessages.length - 1] : null;
  };

  const getUnreadCount = (friendId: string): number => {
    return messages.filter(m => m.senderId === friendId && !m.read).length;
  };

  const conversations = useMemo<Conversation[]>(() => {
    return friends.map((friend) => {
      const lastMsg = getLastMessage(friend.id);
      const unread = getUnreadCount(friend.id);
      return {
        friendId: friend.id,
        lastMessage: lastMsg,
        unreadCount: unread,
        hasStory: false,
        isFavorite: favorites.has(friend.id),
        isArchived: archived.has(friend.id),
      };
    }).sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [friends, messages, favorites, archived]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (msgFilter === 'unread') result = result.filter(c => c.unreadCount > 0);
    else if (msgFilter === 'favorites') result = result.filter(c => c.isFavorite);
    else if (msgFilter === 'groups') result = [];
    if (msgFilter !== 'groups') result = result.filter(c => !c.isArchived);
    if (msgSearch.trim()) {
      const q = msgSearch.toLowerCase();
      result = result.filter(c => {
        const friend = friends.find(f => f.id === c.friendId);
        return friend && (friend.username.toLowerCase().includes(q) || friend.fullName.toLowerCase().includes(q));
      });
    }
    return result;
  }, [conversations, msgFilter, msgSearch, friends]);

  const archivedConversations = useMemo(() => {
    return conversations.filter(c => c.isArchived);
  }, [conversations]);

  const toggleFavorite = (friendId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const toggleArchive = (friendId: string) => {
    setArchived(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const msgFilterTabs: { key: typeof msgFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'unread', label: 'Non lus' },
    { key: 'favorites', label: 'Favoris' },
    { key: 'groups', label: 'Groupes' },
  ];

  if (selectedFriend) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--nav-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--nav-border)' }}>
          <button onClick={() => setSelectedFriend(null)} style={{ color: 'var(--text-primary)' }}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer" style={{ background: 'var(--card-bg)' }}
            onClick={() => {
              setSelectedFriend(null);
              onNavigateToCreator?.(parseInt(selectedFriend.id.substring(0, 8), 16) % 1000000);
            }}
          >
            {selectedFriend.profilePhotoUrl ? (
              <img
                src={selectedFriend.profilePhotoUrl}
                alt={selectedFriend.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>@{selectedFriend.username}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selectedFriend.fullName}</p>
          </div>
          <button onClick={() => toggleFavorite(selectedFriend.id)} className="p-2 rounded-full transition-colors">
            <Star className={`w-5 h-5 ${favorites.has(selectedFriend.id) ? 'fill-amber-400 text-amber-400' : ''}`} style={favorites.has(selectedFriend.id) ? {} : { color: 'var(--text-muted)' }} />
          </button>
        </div>

        {messagesLoading ? (
          <SkeletonChatBubbles />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Envoyez votre premier message</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId !== selectedFriend.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-800 text-white rounded-bl-sm'
                      }`}
                    >
                      {msg.videoUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <video
                            src={msg.videoUrl}
                            className="w-full max-w-[200px] rounded-lg"
                            controls
                          />
                        </div>
                      )}
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                        <p className="text-xs text-gray-300">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {isMine && (
                          <CheckCheck className={`w-3.5 h-3.5 ${msg.read ? 'text-blue-300' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="sticky bottom-0 px-4 py-3" style={{ background: 'var(--modal-bg)', borderTop: '1px solid var(--divider-border)' }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message..."
              className="flex-1 input-field rounded-full"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-3 rounded-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--page-bg)' }}>
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4" style={{ background: 'var(--nav-bg)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--nav-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Amis</h1>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Ajouter un ami..."
              className="input-field rounded-full py-2 px-4 pr-10 text-sm w-48"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => sendFriendRequest(user.id)}
                    className="w-full flex items-center gap-3 p-3 transition-colors"
                    style={{ borderBottom: '1px solid var(--divider-border)' }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--card-bg)' }}>
                      {user.profile_photo_url ? (
                        <img
                          src={user.profile_photo_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>@{user.username}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.full_name}</p>
                    </div>
                    <UserPlus className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex rounded-full p-1" style={{ background: 'var(--card-bg)' }}>
          <button
            onClick={() => setActiveTab('friends')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all"
            style={activeTab === 'friends'
              ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }
              : { color: 'var(--text-muted)' }
            }
          >
            <Users className="w-4 h-4" />
            Amis
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all"
            style={activeTab === 'requests'
              ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }
              : { color: 'var(--text-muted)' }
            }
          >
            <Clock className="w-4 h-4" />
            Demandes
            {friendRequests.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--danger)', color: '#fff' }}>
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all"
            style={activeTab === 'messages'
              ? { background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }
              : { color: 'var(--text-muted)' }
            }
          >
            <MessageCircle className="w-4 h-4" />
            Messages
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            {activeTab === 'messages'
              ? [1, 2, 3, 4, 5, 6].map(i => <SkeletonConversationRow key={i} />)
              : [1, 2, 3, 4, 5, 6].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-16 h-16 mb-4" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun ami pour le moment</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Recherchez des utilisateurs pour leur envoyer une demande</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors glass"
                >
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer" style={{ background: 'var(--card-bg)' }}
                    onClick={() => onNavigateToCreator?.(parseInt(friend.id.substring(0, 8), 16) % 1000000)}
                  >
                    {friend.profilePhotoUrl ? (
                      <img
                        src={friend.profilePhotoUrl}
                        alt={friend.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>@{friend.username}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{friend.fullName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFriend(friend);
                      setActiveTab('messages');
                    }}
                    className="p-2 rounded-full btn-primary transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'requests' ? (
          friendRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserPlus className="w-16 h-16 mb-4" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-xl glass"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--card-bg)' }}>
                    {request.senderPhotoUrl ? (
                      <img
                        src={request.senderPhotoUrl}
                        alt={request.senderUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>@{request.senderUsername}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{request.senderFullName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 rounded-full btn-primary transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="p-2 rounded-full btn-danger transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-16 h-16 mb-4" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun message</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Ajoutez des amis pour commencer à discuter</p>
            </div>
          ) : (
            <div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className="input-field rounded-full py-2 pl-10 pr-4 text-sm w-full"
                />
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                {msgFilterTabs.map(tab => {
                  const count = tab.key === 'unread'
                    ? conversations.filter(c => c.unreadCount > 0 && !c.isArchived).length
                    : tab.key === 'favorites'
                    ? conversations.filter(c => c.isFavorite && !c.isArchived).length
                    : 0;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setMsgFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        msgFilter === tab.key ? 'btn-primary' : ''
                      }`}
                      style={msgFilter === tab.key
                        ? {}
                        : { background: 'var(--card-bg)', color: 'var(--text-muted)' }
                      }
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: msgFilter === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--danger)', color: '#fff' }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {msgFilter !== 'groups' && (
                <>
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageCircle className="w-12 h-12 mb-3" style={{ color: 'var(--text-faint)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {msgFilter === 'unread' ? 'Aucun message non lu' : msgFilter === 'favorites' ? 'Aucune conversation favorite' : 'Aucune conversation'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conv) => {
                        const friend = friends.find(f => f.id === conv.friendId);
                        if (!friend) return null;
                        const lastMsg = conv.lastMessage;
                        const isLastMine = lastMsg && lastMsg.senderId !== conv.friendId;
                        return (
                          <div
                            key={conv.friendId}
                            className="flex items-center gap-3 p-3 rounded-xl transition-colors glass relative group"
                          >
                            <button
                              onClick={() => setSelectedFriend(friend)}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <AvatarRing photoUrl={friend.profilePhotoUrl} username={friend.username} hasStory={conv.hasStory} />
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {friend.fullName || `@${friend.username}`}
                                  </p>
                                  {lastMsg && (
                                    <span className="text-[11px] flex-shrink-0" style={{ color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                      {formatRelativeTime(lastMsg.createdAt)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold' : ''}`} style={{ color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                    {isLastMine && lastMsg && <span style={{ color: 'var(--text-tertiary)' }}>Vous: </span>}
                                    {lastMsg?.content || 'Aucun message'}
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {conv.isFavorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                    {isLastMine && lastMsg && <CheckCheck className={`w-3.5 h-3.5 ${lastMsg.read ? 'text-blue-400' : 'text-gray-500'}`} />}
                                    {conv.unreadCount > 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: 'var(--danger)', color: '#fff' }}>
                                        {conv.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleFavorite(friend.id)}
                                className="p-1.5 rounded-full transition-colors"
                                style={{ background: 'var(--card-bg)' }}
                              >
                                <Star className={`w-3.5 h-3.5 ${conv.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} style={conv.isFavorite ? {} : { color: 'var(--text-muted)' }} />
                              </button>
                              <button
                                onClick={() => toggleArchive(friend.id)}
                                className="p-1.5 rounded-full transition-colors"
                                style={{ background: 'var(--card-bg)' }}
                              >
                                <Archive className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {archivedConversations.length > 0 && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center gap-2 w-full py-2 px-3 rounded-xl transition-colors"
                        style={{ background: 'var(--card-bg)' }}
                      >
                        <Archive className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--text-muted)' }}>
                          Archivées ({archivedConversations.length})
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      {showArchived && (
                        <div className="space-y-1 mt-2">
                          {archivedConversations.map((conv) => {
                            const friend = friends.find(f => f.id === conv.friendId);
                            if (!friend) return null;
                            const lastMsg = conv.lastMessage;
                            return (
                              <div
                                key={conv.friendId}
                                className="flex items-center gap-3 p-3 rounded-xl transition-colors glass opacity-60 relative group"
                              >
                                <button
                                  onClick={() => { toggleArchive(friend.id); setSelectedFriend(friend); }}
                                  className="flex items-center gap-3 flex-1 min-w-0"
                                >
                                  <AvatarRing photoUrl={friend.profilePhotoUrl} username={friend.username} />
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                      {friend.fullName || `@${friend.username}`}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                                      {lastMsg?.content || 'Aucun message'}
                                    </p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => toggleArchive(friend.id)}
                                  className="p-1.5 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                                  style={{ background: 'var(--card-bg)' }}
                                >
                                  <Archive className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {msgFilter === 'groups' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 mb-3" style={{ color: 'var(--text-faint)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun groupe de conversation</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>Les groupes apparaîtront ici</p>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
