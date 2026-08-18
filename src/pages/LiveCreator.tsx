import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Mic, MicOff, SwitchCamera, UserPlus, Sparkles, MoreHorizontal, Gift } from 'lucide-react';
import { Room, Track } from 'livekit-client';
import { createLiveRecord, endLiveRecord, generateRoomID } from '../lib/lives';
import {
  joinLiveKitRoom,
  leaveLiveKitRoom,
  sendChatMessage,
  sendGift,
} from '../lib/livekit';

interface LiveCreatorProps {
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
  type: 'chat' | 'gift' | 'like';
}

const CHAT_COLORS = ['#7dd3fc', '#3ddc84', '#ffb703', '#ff4d6d', '#a78bfa', '#fb7185'];

export default function LiveCreator({ onBack, userId, username, profilePhotoUrl }: LiveCreatorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [followerToast, setFollowerToast] = useState<string | null>(null);
  const [giftAlert, setGiftAlert] = useState<string | null>(null);
  const [liveRoomID, setLiveRoomID] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: micOn,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Vérifiez les autorisations.');
    }
  }, [facingMode, micOn]);

  useEffect(() => {
    if (!isLive) startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, isLive]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartLive = async () => {
    if (!userId || !username) {
      setError('Vous devez être connecté pour démarrer un live.');
      return;
    }
    setStarting(true);
    setError('');

    // Stop preview stream so LiveKit can take over the camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const roomID = generateRoomID(userId);
    const record = await createLiveRecord(roomID, userId, username, profilePhotoUrl);
    if (!record) {
      setError('Erreur lors de la création du live.');
      setStarting(false);
      return;
    }

    try {
      const room = await joinLiveKitRoom({
        roomID,
        userID: userId,
        userName: username,
        canPublish: true,
        onParticipantConnected: (count) => setViewers(count),
        onParticipantDisconnected: (count) => setViewers(count),
        onDataMessage: (msg) => {
          if (msg.type === 'chat') {
            addChatMessage(msg.sender, msg.message, 'chat');
          } else if (msg.type === 'gift') {
            setGiftAlert(`${msg.sender} : ${msg.message}`);
            setEarnings((e) => e + 1);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setGiftAlert(null), 4000);
          } else if (msg.type === 'like') {
            // likes are visual only on creator side
          }
        },
        onTrackSubscribed: (track) => {
          if (track.kind === Track.Kind.Video) {
            const el = track.attach() as HTMLVideoElement;
            // attach remote video if needed (co-host)
          }
        },
      });

      // Publish local camera + mic
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      // Attach local camera track to preview
      const localTrack = room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      if (localTrack?.track) {
        const el = localTrack.track.attach() as HTMLVideoElement;
        el.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'none';
        if (videoRef.current) {
          videoRef.current.srcObject = new MediaStream([localTrack.track.mediaStreamTrack]);
        }
      }

      roomRef.current = room;
      setLiveRoomID(roomID);
      setIsLive(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion au live');
      endLiveRecord(roomID);
    }
    setStarting(false);
  };

  const handleEndLive = async () => {
    if (roomRef.current) {
      await leaveLiveKitRoom(roomRef.current);
      roomRef.current = null;
    }
    if (liveRoomID) {
      endLiveRecord(liveRoomID);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsLive(false);
    setLiveRoomID(null);
    setSeconds(0);
    setViewers(0);
    setEarnings(0);
    setChat([]);
    onBack();
  };

  const handleFlip = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleMic = async () => {
    const newMic = !micOn;
    setMicOn(newMic);
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(newMic);
    }
  };

  const addChatMessage = (sender: string, text: string, type: 'chat' | 'gift' | 'like') => {
    const color = CHAT_COLORS[sender.length % CHAT_COLORS.length];
    setChat((prev) => [
      ...prev.slice(-12),
      { id: `${Date.now()}_${Math.random()}`, username: sender, text, color, type },
    ]);
  };

  const sendReply = async () => {
    if (!reply.trim() || !roomRef.current) return;
    addChatMessage(username || 'Vous', reply.trim(), 'chat');
    try {
      await sendChatMessage(roomRef.current, reply.trim(), username || 'Vous');
    } catch {}
    setReply('');
  };

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black overflow-hidden">
      {/* Camera preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[10]">
          <div className="text-center px-8">
            <p className="text-white text-base mb-4">{error}</p>
            <button onClick={onBack} className="px-6 py-3 bg-white text-black rounded-full font-semibold text-sm">
              Retour
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3.5 z-[3]">
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="bg-[#ff2d4a] text-white text-[11px] font-bold rounded-md px-2 py-1 tracking-wide">
              LIVE
            </div>
          )}
          <div className="bg-black/50 backdrop-blur-md rounded-2xl px-2.5 py-1 text-[11px] text-gray-200 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}k` : viewers}
          </div>
          {isLive && (
            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-2.5 py-1 text-[11px] text-[#eafbf0]">
              ⏱ {formatTime(seconds)}
            </div>
          )}
        </div>
        {isLive ? (
          <button
            onClick={handleEndLive}
            className="bg-[#ff2d4a]/90 text-white text-xs font-semibold rounded-2xl px-3.5 py-1.5"
          >
            Terminer
          </button>
        ) : (
          <button onClick={onBack} className="p-0">
            <X className="w-5 h-5 text-white" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Earnings */}
      {isLive && (
        <div className="absolute top-[58px] left-3.5 z-[2] bg-[#1b4d2e]/35 border border-[#1b4d2e] rounded-2xl px-3.5 py-2 flex items-center gap-2 text-[13px] text-[#eafbf0] font-semibold">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#3ddc84" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M9 12h6M12 9v6" />
          </svg>
          {earnings} pièce{earnings !== 1 ? 's' : ''} gagnée{earnings !== 1 ? 's' : ''}
        </div>
      )}

      {/* Follower toast */}
      {followerToast && (
        <div className="absolute top-[112px] left-3.5 z-[2] flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-2xl pl-1 pr-2.5 py-1 text-[11px] text-gray-200">
          <img src="/raf,360x360,075,t,fafafa_ca443f4786.jpg" alt="" className="w-5 h-5 rounded-full" />
          {followerToast}
        </div>
      )}

      {/* Gift alert */}
      {giftAlert && (
        <div className="absolute top-[190px] left-1/2 -translate-x-1/2 z-[2] flex items-center gap-2 bg-gradient-to-r from-[#ffb703]/25 to-[#ff4d6d]/25 border border-[#ffb703]/40 rounded-2xl px-3.5 py-1.5 text-xs text-white">
          <Gift className="w-4 h-4" />
          {giftAlert}
        </div>
      )}

      {/* Side actions */}
      {isLive && (
        <div className="absolute right-3 bottom-[160px] flex flex-col items-center gap-4 z-[2]">
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/12 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-gray-200">Inviter</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/12 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-gray-200">Effets</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/12 backdrop-blur-sm flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] text-gray-200">Plus</span>
          </button>
        </div>
      )}

      {/* Chat */}
      {isLive && (
        <div className="absolute bottom-[74px] left-3.5 right-20 z-[2] flex flex-col gap-1.5 pointer-events-none max-h-[140px] overflow-hidden">
          {chat.map((msg) => (
            <div
              key={msg.id}
              className={`text-xs bg-black/30 backdrop-blur-sm rounded-xl px-2 py-1 self-start max-w-[80%] ${
                msg.type === 'gift' ? 'text-[#ffb703]' : 'text-gray-200'
              }`}
            >
              <b style={{ color: msg.color }}>{msg.username}: </b>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5 z-[3] flex items-center gap-2.5">
        {isLive ? (
          <>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              placeholder="Répondre au chat..."
              className="flex-1 bg-white/12 backdrop-blur-md border-none outline-none rounded-3xl px-4 py-2.5 text-[13px] text-white placeholder:text-gray-300"
            />
            <button
              onClick={toggleMic}
              className={`w-[38px] h-[38px] rounded-full backdrop-blur-md flex items-center justify-center flex-shrink-0 ${
                micOn ? 'bg-white/12' : 'bg-[#ff2d4a]/35'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4 text-white" strokeWidth={1.8} /> : <MicOff className="w-4 h-4 text-white" strokeWidth={1.8} />}
            </button>
            <button
              onClick={handleFlip}
              className="w-[38px] h-[38px] rounded-full bg-white/12 backdrop-blur-md flex items-center justify-center flex-shrink-0"
            >
              <SwitchCamera className="w-4 h-4 text-white" strokeWidth={1.8} />
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            <p className="text-white/70 text-sm text-center">
              Préparez votre live, puis appuyez sur le bouton pour démarrer la diffusion
            </p>
            <button
              onClick={handleStartLive}
              disabled={starting}
              className="w-full max-w-xs bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold py-4 px-6 rounded-full text-sm uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {starting ? 'Démarrage...' : 'Démarrer le Live'}
            </button>
            <button
              onClick={onBack}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
