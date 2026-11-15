import { Sparkles, Type, Layers, Music2, VolumeX, Scissors } from "lucide-react";

type Props = {
  progress: number;
  onSeek: (p: number) => void;
  muted: boolean;
  onToggleMute: () => void;
};

const IC = 'var(--text-primary)';

export function TimelineTracks({ progress, onSeek, muted, onToggleMute }: Props) {
  return (
    <section className="relative mt-5 select-none">
      <div className="flex items-center gap-6 pl-24 pr-4 text-[11px]" style={{ color: IC, opacity: 0.6 }}>
        {["0s", "5s", "10s", "15s"].map((t) => (
          <span key={t} className="flex-1">{t}</span>
        ))}
      </div>

      <div className="scrollbar-hide relative mt-2 overflow-x-auto pb-2">
        <div className="relative w-[720px] pl-24">
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-20 w-px"
            style={{ background: IC, left: `calc(6rem + ${progress * 100}% * 0.86)` }}
          />

          <TrackRow>
            <span className="flex items-center gap-2 rounded-full px-4 py-2 text-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC }}>
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Video Effect
            </span>
          </TrackRow>

          <TrackRow>
            <span className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC }}>
              <Type className="h-3.5 w-3.5" strokeWidth={1.5} />
              Flow Lifestyle
            </span>
          </TrackRow>

          <TrackRow>
            <span className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC }}>
              <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
              Color overlay
            </span>
          </TrackRow>

          <div className="relative mt-2 flex items-center gap-1">
            <div className="flex overflow-hidden rounded-md" style={{ border: '1px solid var(--card-border)' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="h-14 w-16 border-r"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  aria-hidden
                />
              ))}
            </div>
            <button
              aria-label="Transition"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-transform active:scale-90"
            >
              <Scissors className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: IC }} />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Réactiver le son" : "Couper le son"}
              className="absolute left-12 flex h-8 w-8 items-center justify-center rounded-full"
              style={{ opacity: 0.7 }}
            >
              <VolumeX className={"h-4 w-4"} strokeWidth={1.5} style={{ color: IC, opacity: muted ? 1 : 0.5 }} />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC }}>
              <Music2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="shrink-0">Golden horses</span>
              <span className="flex flex-1 items-end gap-[2px]" aria-hidden>
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[2px] rounded-full"
                    style={{ height: `${6 + ((i * 7) % 14)}px`, background: IC, opacity: 0.6 }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(progress * 100)}
        onChange={(e) => onSeek(Number(e.target.value) / 100)}
        aria-label="Position de lecture"
        className="mx-4 mt-1 w-[calc(100%-2rem)]"
        style={{ accentColor: 'var(--text-primary)' }}
      />
    </section>
  );
}

function TrackRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex items-center">{children}</div>;
}
