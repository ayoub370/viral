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
import VideoStudio from './VideoStudio';

interface CameraPageProps {
  onBack: () => void;
  userId?: string;
  username?: string;
  profilePhotoUrl?: string;
}

type CameraMode = 'photo' | 'video' | 'live';

const formatRecordTime = (s: number) => {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
};

const CameraPage: React.FC<CameraPageProps> = ({ onBack, userId, username, profilePhotoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const capturedUrlRef = useRef<string | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string>('');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<CameraMode>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [duration, setDuration] = useState('15s');
  const [showEditor, setShowEditor] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video' | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

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
      recorderRef.current?.stop();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
    };
  }, [facingMode]);

  const handleFlip = () => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));

  const handleCapture = () => {
    if (mode === 'photo') {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        setError('La caméra n’est pas encore prête. Réessayez dans un instant.');
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      const context = canvas.getContext('2d');
      if (!context) return;
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
        capturedUrlRef.current = url;
        setCapturedUrl(url);
        setCapturedType('image');
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
      }, 'image/jpeg', 0.92);
      return;
    }

    if (mode === 'video') {
      if (isRecording) {
        recorderRef.current?.stop();
        setIsRecording(false);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        return;
      }
      const stream = streamRef.current;
      if (!stream) {
        setError('La caméra n’est pas disponible.');
        return;
      }
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      try {
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
          capturedUrlRef.current = url;
          setCapturedUrl(url);
          setCapturedType('video');
        };
        recorder.onerror = () => setError('Impossible d’enregistrer cette vidéo.');
        recorderRef.current = recorder;
        recorder.start();
        setCapturedUrl(null);
        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = setInterval(() => {
          setRecordSeconds((seconds) => {
            const maxSeconds = duration === '60s' ? 60 : duration === '3m' ? 180 : 15;
            if (seconds + 1 >= maxSeconds) {
              recorder.stop();
              setIsRecording(false);
              if (recordTimerRef.current) {
                clearInterval(recordTimerRef.current);
                recordTimerRef.current = null;
              }
            }
            return Math.min(seconds + 1, maxSeconds);
          });
        }, 1000);
      } catch {
        setError('L’enregistrement vidéo n’est pas pris en charge par ce navigateur.');
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
    return (
      <>
        <VideoEditor
          onBack={() => setShowEditor(false)}
          onNext={onBack}
          onOpenStudio={() => setShowStudio(true)}
          previewUrl={capturedUrl || undefined}
          previewType={capturedType || undefined}
        />
        {showStudio && <VideoStudio onBack={() => setShowStudio(false)} />}
      </>
    );
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
    <div className="fixed inset-0 z-[2000]" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
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

        {/* Top bar - no glass on icons */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-6">
          <button
            onClick={onBack}
            aria-label="Fermer la caméra"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <X className="h-6 w-6" style={{ color: 'var(--text-primary)' }} />
          </button>
          <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-95">
            <Music2 className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
            <span style={{ color: 'var(--text-primary)' }}>Ajouter un son</span>
            <ChevronDown className="h-4 w-4 opacity-70" style={{ color: 'var(--text-primary)' }} />
          </button>
          <span className="h-10 w-10" aria-hidden />
        </div>

        {activeTool && (
          <div className="absolute left-4 right-20 top-24 z-20 rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeTool}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {activeTool === 'Timer' ? 'Le minuteur est prêt pour la prochaine capture.' : 'Réglage appliqué à la prochaine capture.'}
            </p>
          </div>
        )}

        {isRecording && (
          <div className="absolute left-1/2 top-20 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--danger)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{formatRecordTime(recordSeconds)}</span>
          </div>
        )}

        {/* Right tool rail - no glass on icons */}
        <div className="absolute right-3 top-28 bottom-64 z-10 flex w-16 flex-col items-center">
          <div
            className="flex w-full flex-col items-center gap-3 overflow-y-auto overscroll-contain py-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {tools.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Flip') handleFlip();
                  else if (label === 'Flash') setFlash((value) => !value);
                  else setActiveTool((value) => value === label ? null : label);
                }}
                className="group flex w-14 shrink-0 flex-col items-center gap-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform active:scale-95">
                  <Icon className="h-6 w-6" style={{ color: 'var(--text-primary)' }} strokeWidth={1.5} />
                </span>
                <span className="text-[10px] font-medium tracking-wide opacity-80" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="pointer-events-none mt-1 flex h-6 w-full items-center justify-center">
            <ChevronDown className="h-4 w-4 animate-bounce opacity-60" style={{ color: 'var(--text-primary)' }} />
          </div>
        </div>

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center px-8 text-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div>
              <p className="mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>{error}</p>
              <button onClick={onBack} className="rounded-full px-6 py-3 text-sm font-semibold btn-primary">
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
                    ? 'rounded-full px-3 py-1 text-xs font-semibold'
                    : 'px-1 text-xs font-medium opacity-60'
                }
                style={d === duration ? { background: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' } : { color: 'var(--text-primary)' }}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <button onClick={() => setActiveTool('Effects')} className="flex w-16 flex-col items-center gap-1.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform active:scale-95">
                <Sparkles className="h-6 w-6" style={{ color: 'var(--text-primary)' }} strokeWidth={1.5} />
              </span>
              <span className="text-[10px] opacity-80" style={{ color: 'var(--text-primary)' }}>Effects</span>
            </button>

            <button
              aria-label={isRecording ? "Arrêter l'enregistrement" : 'Enregistrer'}
              onClick={handleCapture}
              className="relative flex h-24 w-24 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', ring: '1px solid rgba(255,255,255,0.2)' }}
            >
              <span
                className={
                  isRecording
                    ? 'h-9 w-9 rounded-lg'
                    : mode === 'photo'
                    ? 'h-16 w-16 rounded-full bg-white'
                    : 'h-16 w-16 rounded-full'
                }
                style={{
                  background: isRecording ? 'var(--danger)' : mode === 'photo' ? '#ffffff' : 'var(--danger)',
                  boxShadow: isRecording || mode === 'video' ? '0 0 40px rgba(239,68,68,0.5)' : '0 0 40px rgba(255,255,255,0.3)',
                }}
              />
            </button>

            <div className="flex w-16 flex-col items-center gap-3">
              <button
                onClick={() => {
                if (!capturedUrl) {
                  setError('Prenez une photo ou arrêtez l’enregistrement avant d’ouvrir l’éditeur.');
                  return;
                }
                setShowEditor(true);
              }}
                aria-label="Valider et ouvrir l'éditeur"
                className="flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 btn-primary"
              >
                <Check className="h-6 w-6" />
              </button>
              <button onClick={() => uploadRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform active:scale-95">
                  <ImageIcon className="h-6 w-6" style={{ color: 'var(--text-primary)' }} strokeWidth={1.5} />
                </span>
                <span className="text-[10px] opacity-80" style={{ color: 'var(--text-primary)' }}>Upload</span>
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
                  const url = URL.createObjectURL(file);
                  capturedUrlRef.current = url;
                  setCapturedUrl(url);
                  setCapturedType(file.type.startsWith('image/') ? 'image' : 'video');
                  setError('');
                }}
              />
            </div>
          </div>

          {/* Mode tabs */}
          <div className="mt-6 flex items-center justify-center gap-8 text-sm">
            {(['photo', 'video', 'live'] as CameraMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (isRecording) {
                    recorderRef.current?.stop();
                    setIsRecording(false);
                    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
                  }
                  setError('');
                  setMode(m);
                }}
                className={
                  m === mode
                    ? 'relative font-semibold capitalize after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-white'
                    : 'capitalize opacity-55'
                }
                style={{ color: 'var(--text-primary)' }}
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
