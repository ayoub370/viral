import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Check,
  CheckCheck,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  Pencil,
  Search,
  Send,
  Star,
  User,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../lib/api';

interface MessagesProps {
  onNavigateToCreator?: (userId: number) => void;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  profile_photo_url: string | null;
}

interface MessageRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  video_url: string | null;
  read: boolean;
  created_at: string;
}

interface FriendshipRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  is_favorite: boolean;
  is_archived: boolean;
  sender: Profile | null;
  receiver: Profile | null;
}

interface Conversation {
  friendship: FriendshipRecord;
  profile: Profile;
  lastMessage: MessageRecord | null;
  unreadCount: number;
}

type Filter = 'all' | 'unread' | 'favorites' | 'groups';

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR');
};

const getInitial = (profile: Profile): string => (profile.full_name || profile.username || '?').trim().charAt(0).toUpperCase();

const Avatar: React.FC<{ profile: Profile; hasStory?: boolean; onClick?: () => void }> = ({ profile, hasStory = false, onClick }) => (
  <button type="button" onClick={onClick} className={`shrink-0 rounded-full ${hasStory ? 'p-[2px]' : ''}`} style={hasStory ? { background: 'linear-gradient(135deg, #3ddc84, #1b4d2e)' } : {}} aria-label={`Voir le profil de ${profile.full_name || profile.username}`}>
    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-sm font-semibold" style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', border: hasStory ? '2px solid #000' : '1px solid var(--card-border)' }}>
      {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" /> : getInitial(profile)}
    </span>
  </button>
);

const SkeletonRows: React.FC = () => (
  <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 border-b p-3 last:border-b-0" style={{ borderColor: 'var(--divider-border)' }}>
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }} />
        <div className="flex-1 space-y-2"><div className="h-3 w-2/5 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.09)' }} /><div className="h-2.5 w-3/4 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} /></div>
      </div>
    ))}
  </div>
);

const MessagesPage: React.FC<MessagesProps> = ({ onNavigateToCreator }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<FriendshipRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async (showLoading = true): Promise<void> => {
    if (showLoading) setLoading(true);
    setError('');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError('Connectez-vous pour voir vos messages.');
      setLoading(false);
      return;
    }
    setUserId(authData.user.id);

    const [friendshipResult, messageResult] = await Promise.all([
      supabase.from('friendships').select('id, sender_id, receiver_id, status, is_favorite, is_archived, sender:user_profiles!friendships_sender_id_fkey(id, username, full_name, profile_photo_url), receiver:user_profiles!friendships_receiver_id_fkey(id, username, full_name, profile_photo_url)').or(`sender_id.eq.${authData.user.id},receiver_id.eq.${authData.user.id}`).eq('status', 'accepted'),
      supabase.from('messages').select('id, sender_id, receiver_id, content, video_url, read, created_at').or(`sender_id.eq.${authData.user.id},receiver_id.eq.${authData.user.id}`).order('created_at', { ascending: false }),
    ]);

    if (friendshipResult.error || messageResult.error) {
      console.error('Unable to load messages data', friendshipResult.error || messageResult.error);
      setError('Impossible de charger vos messages.');
      setLoading(false);
      return;
    }

    setFriendships((friendshipResult.data || []) as unknown as FriendshipRecord[]);
    setMessages((messageResult.data || []) as MessageRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    const channel = supabase.channel('messages-page-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { void loadData(false); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => { void loadData(false); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const conversations = useMemo<Conversation[]>(() => {
    if (!userId) return [];
    return friendships.map((friendship) => {
      const profile = friendship.sender_id === userId ? friendship.receiver : friendship.sender;
      if (!profile) return null;
      const pairMessages = messages.filter((message) => message.sender_id === profile.id || message.receiver_id === profile.id);
      const lastMessage = pairMessages[0] || null;
      return { friendship, profile, lastMessage, unreadCount: pairMessages.filter((message) => message.receiver_id === userId && !message.read).length };
    }).filter((conversation): conversation is Conversation => conversation !== null)
      .sort((a, b) => new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime());
  }, [friendships, messages, userId]);

  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    if (!archivedOpen && conversation.friendship.is_archived) return false;
    if (archivedOpen && !conversation.friendship.is_archived) return false;
    if (filter === 'unread' && conversation.unreadCount === 0) return false;
    if (filter === 'favorites' && !conversation.friendship.is_favorite) return false;
    if (filter === 'groups') return false;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    const text = `${conversation.profile.full_name} ${conversation.profile.username} ${conversation.lastMessage?.content || ''}`.toLowerCase();
    return text.includes(normalizedQuery);
  }), [archivedOpen, conversations, filter, query]);

  const personResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!newChatOpen || normalizedQuery.length < 2 || !userId) return [];
    return profiles.filter((profile) => profile.id !== userId && `${profile.full_name} ${profile.username}`.toLowerCase().includes(normalizedQuery)).slice(0, 8);
  }, [newChatOpen, profiles, query, userId]);

  const openConversation = async (conversation: Conversation): Promise<void> => {
    setActiveConversation(conversation);
    if (!userId || conversation.unreadCount === 0) return;
    const unreadIds = messages.filter((message) => message.sender_id === conversation.profile.id && message.receiver_id === userId && !message.read).map((message) => message.id);
    if (unreadIds.length === 0) return;
    const { error: readError } = await supabase.rpc('mark_messages_read', { p_message_ids: unreadIds });
    if (readError) console.error('Unable to mark messages as read', readError);
    else setMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, read: true } : message));
  };

  const openProfileConversation = async (profile: Profile): Promise<void> => {
    const existing = conversations.find((conversation) => conversation.profile.id === profile.id);
    if (existing) await openConversation(existing);
    else setActiveConversation({ friendship: { id: '', sender_id: userId || '', receiver_id: profile.id, status: 'accepted', is_favorite: false, is_archived: false, sender: null, receiver: profile }, profile, lastMessage: null, unreadCount: 0 });
    setNewChatOpen(false);
  };

  const sendMessage = async (): Promise<void> => {
    if (!userId || !activeConversation || !draft.trim() || sending) return;
    setSending(true);
    const { error: sendError } = await supabase.from('messages').insert({ sender_id: userId, receiver_id: activeConversation.profile.id, content: draft.trim() });
    if (sendError) {
      console.error('Unable to send message', sendError);
      setError('Votre message n’a pas pu être envoyé.');
    } else {
      setDraft('');
      await loadData();
    }
    setSending(false);
  };

  const updatePreference = async (conversation: Conversation, field: 'is_favorite' | 'is_archived'): Promise<void> => {
    if (!conversation.friendship.id) return;
    const nextValue = !conversation.friendship[field];
    const { error: updateError } = await supabase.from('friendships').update({ [field]: nextValue }).eq('id', conversation.friendship.id);
    if (updateError) console.error('Unable to update conversation preference', updateError);
    else await loadData();
  };

  const markAllRead = async (): Promise<void> => {
    if (!userId) return;
    const unreadIds = messages.filter((message) => message.receiver_id === userId && !message.read).map((message) => message.id);
    if (unreadIds.length === 0) { setMenuOpen(false); return; }
    const { error: readError } = await supabase.rpc('mark_messages_read', { p_message_ids: unreadIds });
    if (readError) console.error('Unable to mark all messages as read', readError);
    else setMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, read: true } : message));
    setMenuOpen(false);
  };

  const searchPeople = async (): Promise<void> => {
    if (!query.trim() || query.trim().length < 2) { setProfiles([]); return; }
    const pattern = `%${query.trim()}%`;
    const { data, error: searchError } = await supabase.from('user_profiles').select('id, username, full_name, profile_photo_url').or(`username.ilike.${pattern},full_name.ilike.${pattern}`).limit(10);
    if (searchError) console.error('Unable to search people', searchError);
    else setProfiles((data || []) as Profile[]);
  };

  useEffect(() => { if (newChatOpen) void searchPeople(); }, [newChatOpen, query]);

  if (activeConversation) {
    const conversationMessages = messages.filter((message) => message.sender_id === activeConversation.profile.id || message.receiver_id === activeConversation.profile.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return (
      <div className="min-h-screen pb-20" style={{ background: 'var(--page-bg)' }}>
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)', backdropFilter: 'var(--glass-blur)' }}>
          <button type="button" onClick={() => setActiveConversation(null)} aria-label="Retour" className="rounded-full p-2"><ChevronDown className="h-6 w-6 rotate-90" style={{ color: 'var(--text-primary)' }} /></button>
          <Avatar profile={activeConversation.profile} onClick={() => onNavigateToCreator?.(Number.parseInt(activeConversation.profile.id.slice(0, 8), 16) % 1000000)} />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold" style={{ color: 'var(--text-primary)' }}>{activeConversation.profile.full_name || `@${activeConversation.profile.username}`}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{activeConversation.profile.username}</p></div>
          <button type="button" onClick={() => void updatePreference(activeConversation, 'is_favorite')} aria-label="Favori"><Star className={`h-5 w-5 ${activeConversation.friendship.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} style={activeConversation.friendship.is_favorite ? {} : { color: 'var(--text-muted)' }} /></button>
        </header>
        <main className="flex min-h-[calc(100vh-150px)] flex-col gap-3 overflow-y-auto px-4 py-5">
          {conversationMessages.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center text-center"><MessageCircle className="mb-3 h-12 w-12" style={{ color: 'var(--text-faint)' }} /><p style={{ color: 'var(--text-muted)' }}>Aucun message pour le moment.</p></div> : conversationMessages.map((message) => {
            const mine = message.sender_id === userId;
            return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className="max-w-[78%] rounded-2xl px-4 py-2.5" style={{ background: mine ? 'var(--btn-primary-bg)' : 'var(--card-bg)', color: mine ? 'var(--btn-primary-text)' : 'var(--text-primary)', borderBottomRightRadius: mine ? 5 : 18, borderBottomLeftRadius: mine ? 18 : 5 }}><p className="whitespace-pre-wrap break-words text-sm">{message.content}</p><div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70"><span>{formatTime(message.created_at)}</span>{mine && (message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}</div></div></div>;
          })}
        </main>
        <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="fixed bottom-0 left-0 right-0 z-20 flex gap-2 border-t px-4 py-3" style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message..." className="input-field rounded-full" /><button type="submit" disabled={!draft.trim() || sending} className="btn-primary rounded-full p-3 disabled:opacity-50" aria-label="Envoyer"><Send className="h-5 w-5" /></button></form>
      </div>
    );
  }

  const archivedCount = conversations.filter((conversation) => conversation.friendship.is_archived).length;
  const unreadCount = conversations.filter((conversation) => conversation.unreadCount > 0 && !conversation.friendship.is_archived).length;

  return (
    <div className="min-h-screen px-3 pb-24 pt-6 sm:mx-auto sm:max-w-md" style={{ background: '#000' }}>
      <header className="flex items-center justify-between px-1 pb-4"><h1 className="text-2xl font-bold text-white">Messages</h1><div className="relative flex items-center gap-4"><button type="button" onClick={() => { setNewChatOpen(true); setQuery(''); }} aria-label="Nouvelle discussion" className="transition-opacity hover:opacity-70"><Pencil className="h-5 w-5 text-white" /></button><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Plus" className="transition-opacity hover:opacity-70"><MoreVertical className="h-5 w-5 text-white" /></button>{menuOpen && <><div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} /><div className="absolute right-0 top-8 z-50 w-52 overflow-hidden rounded-xl border" style={{ background: '#1c1c1c', borderColor: 'rgba(255,255,255,0.14)' }}><button type="button" onClick={() => void markAllRead()} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/90 transition-colors hover:bg-white/10"><CheckCheck className="h-4 w-4" />Marquer tout comme lu</button><button type="button" onClick={() => { setMenuOpen(false); setArchivedOpen(true); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/90 transition-colors hover:bg-white/10"><Archive className="h-4 w-4" />Conversations archivées</button></div></>}</div></header>
      <div className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ background: 'rgba(120,120,120,0.14)', borderColor: 'rgba(255,255,255,0.12)' }}><Search className="h-4 w-4 shrink-0 text-white/50" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher des discussions et des personnes" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45" /></div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{([{ key: 'all', label: 'Tout' }, { key: 'unread', label: `Non lus${unreadCount ? ` ${unreadCount}` : ''}` }, { key: 'favorites', label: 'Favoris' }, { key: 'groups', label: 'Groupes' }] as { key: Filter; label: string }[]).map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs" style={filter === item.key ? { background: '#1b4d2e', borderColor: '#1b4d2e', color: '#eafbf0', fontWeight: 600 } : { background: 'rgba(120,120,120,0.14)', borderColor: 'rgba(255,255,255,0.12)', color: '#ddd' }}>{item.label}</button>)}</div>
      {archivedCount > 0 && <button type="button" onClick={() => setArchivedOpen((open) => !open)} className="flex w-full items-center justify-between px-1.5 py-2.5 text-left"><span className="flex items-center gap-3 text-sm text-white/85"><Archive className="h-4 w-4" />Archivées</span><span className="flex items-center gap-2 text-xs text-white/50">{archivedCount}<ChevronDown className={`h-4 w-4 transition-transform ${archivedOpen ? 'rotate-180' : ''}`} /></span></button>}
      {loading ? <SkeletonRows /> : error ? <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card-bg)' }}><p className="text-sm text-white/80">{error}</p><button type="button" onClick={() => void loadData()} className="mt-4 rounded-full px-4 py-2 text-sm text-white" style={{ background: '#1b4d2e' }}>Réessayer</button></div> : filter === 'groups' ? <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(120,120,120,0.14)' }}><Users className="mx-auto mb-3 h-10 w-10 text-white/35" /><p className="text-sm font-semibold text-white/80">Aucun groupe</p><p className="mt-1 text-xs text-white/50">Les groupes apparaîtront ici.</p></div> : <div className="overflow-hidden rounded-2xl border" style={{ background: 'rgba(120,120,120,0.14)', borderColor: 'rgba(255,255,255,0.12)' }}>{filteredConversations.length === 0 ? <div className="p-9 text-center"><p className="text-sm font-semibold text-white/85">{query ? 'Aucun résultat' : filter === 'unread' ? 'Aucun message non lu' : 'Aucune discussion pour le moment'}</p><p className="mt-1 text-xs leading-5 text-white/50">{query ? 'Recherchez une personne pour démarrer une discussion.' : 'Vos conversations apparaîtront ici.'}</p></div> : filteredConversations.map((conversation) => <div key={conversation.friendship.id} className="group flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.08)' }}><Avatar profile={conversation.profile} onClick={() => onNavigateToCreator?.(Number.parseInt(conversation.profile.id.slice(0, 8), 16) % 1000000)} /><button type="button" onClick={() => void openConversation(conversation)} className="min-w-0 flex-1 text-left"><div className="flex items-center justify-between gap-2"><p className={`truncate text-sm text-white ${conversation.unreadCount ? 'font-bold' : 'font-semibold'}`}>{conversation.profile.full_name || `@${conversation.profile.username}`}</p>{conversation.lastMessage && <span className={`shrink-0 text-[11px] ${conversation.unreadCount ? 'text-[#3ddc84]' : 'text-white/50'}`}>{formatTime(conversation.lastMessage.created_at)}</span>}</div><div className="mt-0.5 flex items-center gap-1.5"><p className={`truncate text-xs ${conversation.unreadCount ? 'font-semibold text-white' : 'text-white/65'}`}>{conversation.lastMessage ? `${conversation.lastMessage.sender_id === userId ? 'Vous : ' : ''}${conversation.lastMessage.content}` : 'Aucun message'}</p>{conversation.lastMessage?.sender_id === userId && conversation.lastMessage.read && <CheckCheck className="h-3.5 w-3.5 shrink-0 text-[#3ddc84]" />}</div></button><div className="flex items-center gap-2">{conversation.unreadCount > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3ddc84] px-1 text-[10px] font-bold text-[#04210f]">{conversation.unreadCount}</span>}<button type="button" onClick={() => void updatePreference(conversation, 'is_favorite')} aria-label="Favori" className="opacity-0 transition-opacity group-hover:opacity-100"><Star className={`h-4 w-4 ${conversation.friendship.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/45'}`} /></button><button type="button" onClick={() => void updatePreference(conversation, 'is_archived')} aria-label="Archiver" className="opacity-0 transition-opacity group-hover:opacity-100"><Archive className="h-4 w-4 text-white/45" /></button></div></div>)}</div>}
      {newChatOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-3xl border p-5" style={{ background: '#171717', borderColor: 'rgba(255,255,255,0.14)' }}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Nouvelle discussion</h2><button type="button" onClick={() => setNewChatOpen(false)} aria-label="Fermer"><X className="h-5 w-5 text-white/70" /></button></div><div className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ background: 'rgba(120,120,120,0.14)', borderColor: 'rgba(255,255,255,0.12)' }}><Search className="h-4 w-4 text-white/50" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une personne" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45" /></div><div className="max-h-72 overflow-y-auto">{personResults.map((profile) => <button type="button" key={profile.id} onClick={() => void openProfileConversation(profile)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-white/5"><Avatar profile={profile} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{profile.full_name || `@${profile.username}`}</strong><small className="text-xs text-white/50">@{profile.username}</small></span><Send className="h-4 w-4 text-white/50" /></button>)}{query.length >= 2 && personResults.length === 0 && <p className="p-5 text-center text-sm text-white/50">Aucune personne trouvée.</p>}</div></div></div>}
    </div>
  );
};

export default MessagesPage;
