import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  SwitchCamera,
  Gauge,
  Sparkles,
  Wand2,
  Timer,
  MessageSquareReply,
  Zap,
  Music2,
  ChevronDown,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import LiveCreator from './LiveCreator';
import VideoEditor from './VideoEditor';

interface CameraPageProps {
  onBack: () => void;
  userId?: string;
  username?: string;
  profilePhotoUrl?: string;
}

type CameraMode = 'photo' | 'video' | 'live';

const glass = 'bg-white/10 border border-white/15 backdrop-blur-xl text-white';

const formatRecordTime = (s: number) => {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

const CameraPage: React.FC<CameraPageProps> = ({ onBack, userId, username, profilePhotoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string>('');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<CameraMode>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [duration, setDuration] = useState('15s');
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setError('');
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        if (!cancelled) setError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
      }
    };
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [facingMode]);

  const handleFlip = () => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));

  const handleCapture = () => {
    if (mode === 'photo') {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    } else if (mode === 'video') {
      if (isRecording) {
        setIsRecording(false);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
      } else {
        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      }
    }
  };

  if (mode === 'live') {
    return (
      <LiveCreator
        onBack={() => setMode('video')}
        userId={userId}
        username={username}
        profilePhotoUrl={profilePhotoUrl}
      />
    );
  }

  if (showEditor) {
    return <VideoEditor onBack={() => setShowEditor(false)} onNext={onBack} />;
  }

  const tools = [
    { icon: SwitchCamera, label: 'Flip', onClick: handleFlip },
    { icon: Gauge, label: 'Speed' },
    { icon: Sparkles, label: 'Filters' },
    { icon: Wand2, label: 'Beauty' },
    { icon: Timer, label: 'Timer' },
    { icon: MessageSquareReply, label: 'Reply' },
    { icon: Zap, label: 'Flash' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] bg-[#010100] text-white">
      <div className="relative mx-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        {flash && <div className="pointer-events-none absolute inset-0 animate-pulse bg-white" />}

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-6">
          <button
            onClick={onBack}
            aria-label="Fermer la caméra"
            className={`${glass} flex h-10 w-10 items-center justify-center rounded-full`}
          >
            <X className="h-5 w-5" />
          </button>
          <button className={`${glass} flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium`}>
            <Music2 className="h-4 w-4" />
            Ajouter un son
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
          <span className="h-10 w-10" aria-hidden />
        </div>

        {isRecording && (
          <div className={`${glass} absolute left-1/2 top-20 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#CB4762]" />
            <span className="font-mono text-xs">{formatRecordTime(recordSeconds)}</span>
          </div>
        )}

        {/* Right tool rail */}
        <div className="absolute right-3 top-28 bottom-64 z-10 flex w-16 flex-col items-center">
          <div
            className="flex w-full flex-col items-center gap-3 overflow-y-auto overscroll-contain py-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {tools.map(({ icon: Icon, label, onClick }) => (
              <button key={label} onClick={onClick} className="group flex w-14 shrink-0 flex-col items-center gap-1">
                <span className={`${glass} flex h-11 w-11 items-center justify-center rounded-2xl transition-transform active:scale-95`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium tracking-wide opacity-80">{label}</span>
              </button>
            ))}
          </div>
          <div className="pointer-events-none mt-1 flex h-6 w-full items-center justify-center">
            <ChevronDown className="h-4 w-4 animate-bounce opacity-60" />
          </div>
        </div>

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-8 text-center">
            <div>
              <p className="mb-4 text-sm">{error}</p>
              <button onClick={onBack} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">
                Retour
              </button>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="relative z-10 mt-auto px-5 pb-10">
          <div className="mb-5 flex items-center justify-center gap-6">
            {['60s', '15s', '3m'].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={
                  d === duration
                    ? 'rounded-full bg-white/15 px-3 py-1 text-xs font-semibold'
                    : 'px-1 text-xs font-medium opacity-60'
                }
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <button className="flex w-16 flex-col items-center gap-1.5">
              <span className={`${glass} flex h-12 w-12 items-center justify-center rounded-xl`}>
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-[10px] opacity-80">Effects</span>
            </button>

            <button
              aria-label={isRecording ? "Arrêter l'enregistrement" : 'Enregistrer'}
              onClick={handleCapture}
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#CB4762]/25 ring-1 ring-[#CB4762]/40 transition-transform active:scale-95"
            >
              <span
                className={
                  isRecording
                    ? 'h-9 w-9 rounded-lg bg-[#CB4762] shadow-[0_0_40px_rgba(203,71,98,0.6)]'
                    : mode === 'photo'
                    ? 'h-16 w-16 rounded-full bg-white shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                    : 'h-16 w-16 rounded-full bg-[#CB4762] shadow-[0_0_40px_rgba(203,71,98,0.6)]'
                }
              />
            </button>

            <div className="flex w-16 flex-col items-center gap-3">
              <button
                onClick={() => setShowEditor(true)}
                aria-label="Valider et ouvrir l'éditeur"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#CB4762] text-white shadow-[0_0_24px_rgba(203,71,98,0.5)] transition-transform active:scale-95"
              >
                <Check className="h-6 w-6" />
              </button>
              <button className="flex flex-col items-center gap-1.5">
                <span className={`${glass} flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl`}>
                  <ImageIcon className="h-5 w-5" />
                </span>
                <span className="text-[10px] opacity-80">Upload</span>
              </button>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="mt-6 flex items-center justify-center gap-8 text-sm">
            {(['photo', 'video', 'live'] as CameraMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  m === mode
                    ? 'relative font-semibold capitalize after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-white'
                    : 'capitalize opacity-55'
                }
              >
                {m === 'photo' ? 'Photo' : m === 'video' ? 'Vidéo' : 'Live'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
