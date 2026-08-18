import React, { useState, useEffect, useRef } from 'react';
import { Users, MessageCircle, Send, User, Search, ArrowLeft, Play, X, Check, UserPlus, Clock } from 'lucide-react';
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

const FriendsPage: React.FC<{
  onNavigateToCreator?: (userId: number) => void;
  onNavigate?: (page: string) => void;
}> = ({ onNavigateToCreator }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'messages'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friendId)
        .eq('read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
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

  if (selectedFriend) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Chat Header */}
        <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedFriend(null)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div
            className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden cursor-pointer"
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
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">@{selectedFriend.username}</p>
            <p className="text-gray-400 text-xs">{selectedFriend.fullName}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Envoyez votre premier message</p>
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
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-black border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-gray-900 text-white rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-blue-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Amis</h1>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Ajouter un ami..."
              className="bg-gray-900 text-white rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 placeholder-gray-500 w-48"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => sendFriendRequest(user.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                      {user.profile_photo_url ? (
                        <img
                          src={user.profile_photo_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white text-sm font-semibold">@{user.username}</p>
                      <p className="text-gray-400 text-xs">{user.full_name}</p>
                    </div>
                    <UserPlus className="w-5 h-5 text-blue-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 rounded-full p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Amis
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Demandes
            {friendRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Messages
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Chargement...</p>
          </div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm">Aucun ami pour le moment</p>
              <p className="text-gray-600 text-xs mt-2">Recherchez des utilisateurs pour leur envoyer une demande</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 cursor-pointer"
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
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">@{friend.username}</p>
                    <p className="text-gray-400 text-xs truncate">{friend.fullName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFriend(friend);
                      setActiveTab('messages');
                    }}
                    className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors"
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
              <UserPlus className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {request.senderPhotoUrl ? (
                      <img
                        src={request.senderPhotoUrl}
                        alt={request.senderUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">@{request.senderUsername}</p>
                    <p className="text-gray-400 text-xs">{request.senderFullName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 bg-green-600 rounded-full text-white hover:bg-green-500 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
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
              <MessageCircle className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-sm">Aucun message</p>
              <p className="text-gray-600 text-xs mt-2">Ajoutez des amis pour commencer à discuter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const lastMsg = getLastMessage(friend.id);
                const unread = getUnreadCount(friend.id);
                return (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 hover:bg-gray-800/50 transition-colors relative"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                      {friend.profilePhotoUrl ? (
                        <img
                          src={friend.profilePhotoUrl}
                          alt={friend.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold text-sm">@{friend.username}</p>
                      <p className="text-gray-400 text-xs truncate">
                        {lastMsg?.content || 'Aucun message'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
