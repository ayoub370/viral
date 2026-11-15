import { Play, Pause, Undo2, Redo2, Maximize2 } from "lucide-react";

type Props = {
  playing: boolean;
  onTogglePlay: () => void;
  current: string;
  total: string;
  onFullscreen?: () => void;
};

export function VideoPreview({ playing, onTogglePlay, current, total, onFullscreen }: Props) {
  const iconColor = 'var(--text-primary)';
  const mutedColor = 'var(--text-muted)';

  return (
    <div className="px-4">
      <div className="relative mx-auto aspect-[9/16] h-[36vh] w-auto max-w-[300px] overflow-hidden rounded-xl" style={{ background: 'var(--card-bg)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 60% at 50% 20%, rgba(255,255,255,0.04), transparent 70%)' }} />
        <button
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform active:scale-90"
        >
          {playing ? <Pause className="h-6 w-6" style={{ color: iconColor }} /> : <Play className="h-6 w-6" style={{ color: iconColor }} />}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90"
        >
          {playing ? <Pause className="h-5 w-5" style={{ color: iconColor }} /> : <Play className="h-5 w-5" style={{ color: iconColor }} />}
        </button>

        <div className="flex items-center gap-4 text-sm">
          <button aria-label="Annuler" className="transition-opacity hover:opacity-100" style={{ opacity: 0.6 }}>
            <Undo2 className="h-5 w-5" style={{ color: iconColor }} />
          </button>
          <span className="tabular-nums" style={{ color: iconColor, opacity: 0.9 }}>
            {current} / {total}
          </span>
          <button aria-label="Rétablir" className="transition-opacity hover:opacity-100" style={{ opacity: 0.6 }}>
            <Redo2 className="h-5 w-5" style={{ color: iconColor }} />
          </button>
        </div>

        <button
          onClick={onFullscreen}
          aria-label="Plein écran"
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90"
        >
          <Maximize2 className="h-5 w-5" style={{ color: iconColor }} />
        </button>
      </div>
    </div>
  );
}
