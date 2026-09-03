import { Play, Pause, Undo2, Redo2, Maximize2 } from "lucide-react";

type Props = {
  playing: boolean;
  onTogglePlay: () => void;
  current: string;
  total: string;
  onFullscreen?: () => void;
};

export function VideoPreview({ playing, onTogglePlay, current, total, onFullscreen }: Props) {
  return (
    <div className="px-4">
      <div className="relative mx-auto aspect-[9/16] h-[36vh] w-auto max-w-[300px] overflow-hidden rounded-xl bg-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_20%,rgba(57,148,245,0.22),transparent_70%)]" />
        <button
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="glass-panel absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Lecture"}
          className="glass-panel flex h-11 w-11 items-center justify-center rounded-full"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-4 text-sm">
          <button aria-label="Annuler" className="opacity-60 transition-opacity hover:opacity-100">
            <Undo2 className="h-5 w-5" />
          </button>
          <span className="tabular-nums opacity-90">
            {current} / {total}
          </span>
          <button aria-label="Rétablir" className="opacity-60 transition-opacity hover:opacity-100">
            <Redo2 className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={onFullscreen}
          aria-label="Plein écran"
          className="glass-panel flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
