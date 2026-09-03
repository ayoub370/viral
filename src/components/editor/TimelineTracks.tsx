import { Sparkles, Type, Layers, Music2, VolumeX, Scissors } from "lucide-react";

type Props = {
  progress: number; // 0..1
  onSeek: (p: number) => void;
  muted: boolean;
  onToggleMute: () => void;
};

export function TimelineTracks({ progress, onSeek, muted, onToggleMute }: Props) {
  return (
    <section className="relative mt-5 select-none">
      {/* règle de temps */}
      <div className="flex items-center gap-6 pl-24 pr-4 text-[11px] opacity-60">
        {["0s", "5s", "10s", "15s"].map((t) => (
          <span key={t} className="flex-1">
            {t}
          </span>
        ))}
      </div>

      <div className="scrollbar-hide relative mt-2 overflow-x-auto pb-2">
        <div className="relative w-[720px] pl-24">
          {/* playhead */}
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-white"
            style={{ left: `calc(6rem + ${progress * 100}% * 0.86)` }}
          />

          {/* piste effets */}
          <TrackRow>
            <span className="glass-panel flex items-center gap-2 rounded-full px-4 py-2 text-xs">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Video Effect
            </span>
          </TrackRow>

          {/* piste texte */}
          <TrackRow>
            <span className="flex items-center gap-2 rounded-md bg-[#A06EFB] px-3 py-2 text-xs font-medium">
              <Type className="h-3.5 w-3.5" strokeWidth={1.5} />
              Flow Lifestyle
            </span>
          </TrackRow>

          {/* piste overlay */}
          <TrackRow>
            <span className="flex items-center gap-2 rounded-full bg-[#D946EF] px-3 py-1.5 text-xs font-medium">
              <Layers className="h-3.5 w-3.5" strokeWidth={1.5} />
              Color overlay
            </span>
          </TrackRow>

          {/* piste vidéo */}
          <div className="relative mt-2 flex items-center gap-1">
            <div className="flex overflow-hidden rounded-md">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="h-14 w-16 border-r border-black/60 bg-[linear-gradient(135deg,rgba(57,148,245,0.35),rgba(160,110,251,0.35))]"
                  aria-hidden
                />
              ))}
            </div>
            <button
              aria-label="Transition"
              className="glass-panel flex h-7 w-7 items-center justify-center rounded-md"
            >
              <Scissors className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* piste audio */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Réactiver le son" : "Couper le son"}
              className="absolute left-12 flex h-8 w-8 items-center justify-center rounded-full opacity-70"
            >
              <VolumeX className={"h-4 w-4 " + (muted ? "" : "opacity-50")} strokeWidth={1.5} />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-[#F59E0B] px-3 py-2 text-xs font-medium">
              <Music2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="shrink-0">Golden horses</span>
              <span className="flex flex-1 items-end gap-[2px]" aria-hidden>
                {Array.from({ length: 40 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[2px] rounded-full bg-white/80"
                    style={{ height: `${6 + ((i * 7) % 14)}px` }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* scrub */}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(progress * 100)}
        onChange={(e) => onSeek(Number(e.target.value) / 100)}
        aria-label="Position de lecture"
        className="mx-4 mt-1 w-[calc(100%-2rem)] accent-[#3994F5]"
      />
    </section>
  );
}

function TrackRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex items-center">{children}</div>;
}
