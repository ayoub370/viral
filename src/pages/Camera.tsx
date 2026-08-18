import React, { useRef, useEffect, useState } from 'react';
import { X, SwitchCamera, Music } from 'lucide-react';
import LiveCreator from './LiveCreator';

interface CameraPageProps {
  onBack: () => void;
  userId?: string;
  username?: string;
  profilePhotoUrl?: string;
}

type CameraMode = 'photo' | 'video' | 'live';

const CameraPage: React.FC<CameraPageProps> = ({ onBack, userId, username, profilePhotoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string>('');
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<CameraMode>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Impossible d\'accéder à la caméra. Vérifiez les autorisations.');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [facingMode]);

  const handleFlip = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCapture = () => {
    if (mode === 'photo') {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      // TODO: capture photo and upload to Cloudflare
    } else if (mode === 'video') {
      if (isRecording) {
        setIsRecording(false);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        // TODO: stop recording and upload to Cloudflare
      } else {
        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
        // TODO: start recording
      }
    }
  };

  if (mode === 'live') {
    return (
      <LiveCreator onBack={() => setMode('video')} userId={userId} username={username} profilePhotoUrl={profilePhotoUrl} />
    );
  }

  const formatRecordTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black">
      {/* Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />

      {/* Flash effect on capture */}
      {flash && <div className="absolute inset-0 bg-white animate-pulse pointer-events-none" />}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-[4]">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-mono">{formatRecordTime(recordSeconds)}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-6 z-[4]">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
          <Music className="w-4 h-4" />
          <span className="text-sm font-medium">Ajouter un son</span>
        </div>
      </div>

      {/* Right side tools */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-[4]">
        <button
          onClick={handleFlip}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>
      </div>

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[10]">
          <div className="text-center px-8">
            <p className="text-white text-base mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-black rounded-full font-semibold text-sm"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 pt-6 bg-gradient-to-t from-black/60 to-transparent z-[4]">
        <div className="flex flex-col items-center gap-4">
          {/* Mode tabs */}
          <div className="flex gap-6 text-sm uppercase tracking-wide font-medium">
            <button
              onClick={() => setMode('photo')}
              className={mode === 'photo' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60'}
            >
              Photo
            </button>
            <button
              onClick={() => setMode('video')}
              className={mode === 'video' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60'}
            >
              Vidéo
            </button>
            <button
              onClick={() => setMode('live')}
              className={mode === 'live' ? 'text-white border-b-2 border-white pb-1' : 'text-white/60'}
            >
              Live
            </button>
          </div>

          {/* Capture button */}
          <div className="flex items-center justify-center gap-10">
            <div className="w-12 h-12 rounded-full border-2 border-white/40" />

            <button
              onClick={handleCapture}
              className={`flex items-center justify-center transition-transform active:scale-90 ${
                isRecording
                  ? 'w-20 h-20 rounded-full border-4 border-red-500'
                  : 'w-20 h-20 rounded-full border-4 border-white'
              }`}
            >
              <div
                className={
                  isRecording
                    ? 'w-6 h-6 rounded-md bg-red-500'
                    : mode === 'video'
                    ? 'w-16 h-16 rounded-full bg-red-500'
                    : 'w-16 h-16 rounded-full bg-white'
                }
              />
            </button>

            <div className="w-12 h-12 rounded-full border-2 border-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPage;
