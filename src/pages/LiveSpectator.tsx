import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Share2, Gift, Heart } from 'lucide-react';
import { Room, Track } from 'livekit-client';
import { fetchActiveLives, type LiveRecord } from '../lib/lives';
import {
  joinLiveKitRoom,
  leaveLiveKitRoom,
  sendChatMessage,
  sendLike,
  sendGift,
} from '../lib/livekit';

interface LiveSpectatorProps {
  onBack: () => void;
  userId?: string;
  username?: string;
  profilePhotoUrl?: string;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  color: string;
}

const HEART_EMOJIS = ['❤️', '💚', '💛', '💙', '💜', '🧡'];
const CHAT_COLORS = ['#7dd3fc', '#3ddc84', '#ffb703', '#ff4d6d', '#a78bfa', '#fb7185'];

export default function LiveSpectator({ onBack, userId, username }: LiveSpectatorProps) {
  const [lives, setLives] = useState<LiveRecord[]>([]);
  const [activeLive, setActiveLive] = useState<LiveRecord | null>(null);
  const [viewers, setViewers] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [comment, setComment] = useState('');
  const [giftBanner, setGiftBanner] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const tapZoneRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const heartIdRef = useRef(0);
  const lastLikeRef = useRef(0);
  const giftBannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchActiveLives().then((data) => {
      setLives(data);
      setLoading(false);
    });
  }, []);

  const handleSelectLive = async (live: LiveRecord) => {
    if (!userId || !username) {
      setError('Vous devez être connecté pour regarder un live.');
      return;
    }
    setActiveLive(live);
    setViewers(live.viewer_count || 0);
    setChat([]);
    setError('');
    setConnecting(true);

    try {
      const room = await joinLiveKitRoom({
        roomID: live.room_id,
        userID: userId,
        userName: username,
        canPublish: false,
        onParticipantConnected: (count) => setViewers(count),
        onParticipantDisconnected: (count) => setViewers(count),
        onDataMessage: (msg) => {
          if (msg.type === 'chat') {
            addChatMessage(msg.sender, msg.message);
          } else if (msg.type === 'gift') {
            setGiftBanner(`${msg.sender} a envoyé ${msg.message}`);
            if (giftBannerTimeout.current) clearTimeout(giftBannerTimeout.current);
            giftBannerTimeout.current = setTimeout(() => setGiftBanner(null), 3000);
          } else if (msg.type === 'like') {
            // Optional: spawn a heart from random position
            const id = heartIdRef.current++;
            const x = Math.random() * 300 + 50;
            const y = window.innerHeight - 200;
            setHearts((prev) => [...prev, { id, x, y, emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)] }]);
            setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1200);
          }
        },
        onTrackSubscribed: (track) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
        },
      });
      roomRef.current = room;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion au live');
    }
    setConnecting(false);
  };

  const handleBackToList = async () => {
    if (roomRef.current) {
      await leaveLiveKitRoom(roomRef.current);
      roomRef.current = null;
    }
    setActiveLive(null);
    setChat([]);
    setError('');
  };

  const sendLikeToServer = useCallback(() => {
    const now = Date.now();
    if (now - lastLikeRef.current < 100) return;
    lastLikeRef.current = now;
    if (roomRef.current) {
      sendLike(roomRef.current, username || 'Anonyme').catch(() => {});
    }
  }, [username]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = tapZoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = heartIdRef.current++;
    const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
    setHearts((prev) => [...prev, { id, x, y, emoji }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1200);
    sendLikeToServer();
  };

  const toggleFollow = () => {
    setIsFollowing((prev) => !prev);
    // TODO: call real follow/unfollow API
  };

  const addChatMessage = (sender: string, text: string) => {
    const color = CHAT_COLORS[sender.length % CHAT_COLORS.length];
    setChat((prev) => [...prev.slice(-15), { id: `${Date.now()}_${Math.random()}`, username: sender, text, color }]);
  };

  const sendComment = async () => {
    if (!comment.trim() || !roomRef.current) return;
    addChatMessage(username || 'Vous', comment.trim());
    try {
      await sendChatMessage(roomRef.current, comment.trim(), username || 'Vous');
    } catch {}
    setComment('');
  };

  const handleShare = async () => {
    if (!activeLive) return;
    const shareUrl = `${window.location.origin}/live?room=${activeLive.room_id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Live de ${activeLive.host_username}`, url: shareUrl });
      } catch {}
    } else {
      navigator.clipboard?.writeText(shareUrl);
    }
  };

  const openGiftSelector = async () => {
    if (!roomRef.current) return;
    try {
      await sendGift(roomRef.current, username || 'Anonyme', 'Rose x1');
      setGiftBanner('Vous avez envoyé Rose x1');
      if (giftBannerTimeout.current) clearTimeout(giftBannerTimeout.current);
      giftBannerTimeout.current = setTimeout(() => setGiftBanner(null), 3000);
    } catch {}
    // TODO: open real gift selector, debit user balance, credit creator
  };

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        leaveLiveKitRoom(roomRef.current);
      }
      if (giftBannerTimeout.current) clearTimeout(giftBannerTimeout.current);
    };
  }, []);

  // ---- Active live viewer view ----
  if (activeLive) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black overflow-hidden">
        {/* Remote video from host */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

        {/* Connecting overlay */}
        {connecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[6]">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[10]">
            <div className="text-center px-8">
              <p className="text-white text-base mb-4">{error}</p>
              <button onClick={handleBackToList} className="px-6 py-3 bg-white text-black rounded-full font-semibold text-sm">
                Retour
              </button>
            </div>
          </div>
        )}

        {/* Tap zone for likes */}
        <div ref={tapZoneRef} className="absolute inset-0 z-[1] cursor-pointer" onClick={handleTap} />

        {/* Floating hearts */}
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute z-[5] pointer-events-none text-2xl"
            style={{
              left: h.x - 12,
              top: h.y - 12,
              animation: 'float-up 1.2s ease-out forwards',
            }}
          >
            {h.emoji}
          </div>
        ))}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3.5 z-[3]">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-3xl pl-1 pr-3 py-1">
            <img
              src={activeLive.host_avatar_url || '/raf,360x360,075,t,fafafa_ca443f4786.jpg'}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-[#ff4d6d]"
            />
            <div>
              <div className="text-white text-xs font-semibold">{activeLive.host_username || 'Anonyme'}</div>
              <div className="text-[10px] text-[#ffb3c0] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                En direct · {viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}k` : viewers}
              </div>
            </div>
            <button
              onClick={toggleFollow}
              className={`text-[11px] font-semibold rounded-2xl px-2.5 py-1 ml-1 transition-colors ${
                isFollowing ? 'bg-white/15 text-gray-200' : 'bg-[#1b4d2e] text-[#eafbf0]'
              }`}
            >
              {isFollowing ? 'Abonné' : 'Suivre'}
            </button>
          </div>
          <button onClick={handleBackToList} className="p-0">
            <X className="w-5 h-5 text-white" strokeWidth={1.8} />
          </button>
        </div>

        {/* Gift banner */}
        {giftBanner && (
          <div className="absolute top-[70px] left-3.5 z-[2] bg-[#1b4d2e]/35 border border-[#1b4d2e] rounded-2xl px-3 py-1.5 text-[11px] text-[#eafbf0] flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            {giftBanner}
          </div>
        )}

        {/* Chat */}
        <div className="absolute bottom-[70px] left-3.5 right-20 z-[2] flex flex-col gap-1.5 pointer-events-none max-h-[160px] overflow-hidden">
          {chat.map((msg) => (
            <div
              key={msg.id}
              className="text-xs text-gray-200 bg-black/30 backdrop-blur-sm rounded-xl px-2 py-1 self-start max-w-[80%]"
            >
              <b style={{ color: msg.color }}>{msg.username}: </b>
              {msg.text}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-[3] flex items-center gap-2.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            placeholder="Dire quelque chose de gentil..."
            className="flex-1 bg-white/12 backdrop-blur-md border-none outline-none rounded-3xl px-4 py-2.5 text-[13px] text-white placeholder:text-gray-300"
          />
          <button
            onClick={handleShare}
            className="w-[38px] h-[38px] rounded-full bg-white/12 backdrop-blur-md flex items-center justify-center flex-shrink-0"
          >
            <Share2 className="w-4 h-4 text-white" strokeWidth={1.8} />
          </button>
          <button
            onClick={openGiftSelector}
            className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#ffb703] to-[#ff4d6d] flex items-center justify-center flex-shrink-0"
          >
            <Gift className="w-4 h-4 text-white" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    );
  }

  // ---- List of active lives ----
  return (
    <div className="fixed inset-0 z-[2000] bg-black overflow-y-auto pb-20">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <h2 className="text-white text-lg font-bold">Lives en direct</h2>
        <button onClick={onBack} className="p-1">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : lives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <p className="text-white/70 text-sm mb-1">Aucun live en cours</p>
          <p className="text-white/40 text-xs">Revenez plus tard ou créez le vôtre</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {lives.map((live) => (
            <button
              key={live.id}
              onClick={() => handleSelectLive(live)}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-b from-[#1a1225] to-[#0a0710] text-left group"
            >
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-[10px] font-semibold">LIVE</span>
              </div>
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px]">
                {live.viewer_count >= 1000 ? `${(live.viewer_count / 1000).toFixed(1)}k` : live.viewer_count}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                  <img
                    src={live.host_avatar_url || '/raf,360x360,075,t,fafafa_ca443f4786.jpg'}
                    alt=""
                    className="w-7 h-7 rounded-full border border-white/20"
                  />
                  <span className="text-white text-xs font-medium truncate">
                    {live.host_username || 'Anonyme'}
                  </span>
                </div>
                {live.title && (
                  <p className="text-white/60 text-[11px] mt-1 truncate">{live.title}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
