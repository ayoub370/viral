import { useState } from "react";
import { X, Play, Check, Volume2, Mic } from "lucide-react";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-end" role="dialog" aria-label={title}>
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="glass-panel relative max-h-[70%] w-full overflow-y-auto rounded-t-3xl p-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Annuler"
              className="glass-panel flex h-8 w-8 items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              aria-label="Valider"
              className="btn-gradient flex h-8 w-8 items-center justify-center rounded-full"
            >
              <Check className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="scrollbar-hide mb-4 flex gap-5 overflow-x-auto border-b border-white/10">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onChange(it)}
          className={
            "shrink-0 pb-2 text-xs font-medium transition-colors " +
            (value === it
              ? "border-b-2 border-[#A06EFB] text-[#A06EFB]"
              : "opacity-60")
          }
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 flex justify-between text-xs opacity-80">
        {label} <span className="tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#3994F5]"
      />
    </label>
  );
}

/* ---------- Music ---------- */
const tracks = ["Golden horses", "Night drive", "Neon tape", "Slow motion", "City lights"];

export function MusicSheet(p: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("Music");
  const [sel, setSel] = useState(tracks[0]);
  return (
    <Sheet open={p.open} title="Musique" onClose={p.onClose}>
      <Tabs items={["Music", "Effect", "Extract"]} value={tab} onChange={setTab} />
      <div className="glass-panel mb-4 flex items-center gap-3 rounded-2xl p-3">
        <span className="btn-gradient flex h-10 w-10 items-center justify-center rounded-full">
          <Play className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{sel}</p>
          <div className="mt-1.5 h-1 w-full rounded-full bg-white/15">
            <div className="h-1 w-1/3 rounded-full bg-[#F59E0B]" />
          </div>
        </div>
        <Volume2 className="h-4 w-4 opacity-70" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        {tracks.map((t) => (
          <button
            key={t}
            onClick={() => setSel(t)}
            className={
              "flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm " +
              (sel === t ? "bg-white/10 text-[#A06EFB]" : "bg-white/5")
            }
          >
            {t}
            <span className="text-[11px] opacity-60">00:{10 + t.length}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- Voice ---------- */
export function VoiceSheet(p: { open: boolean; onClose: () => void }) {
  const [rec, setRec] = useState(false);
  return (
    <Sheet open={p.open} title="Voix off" onClose={p.onClose}>
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={() => setRec((r) => !r)}
          className={
            "flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 " +
            (rec ? "bg-[#CB4762]" : "btn-gradient")
          }
          aria-label={rec ? "Arrêter l'enregistrement" : "Enregistrer"}
        >
          <Mic className="h-7 w-7" strokeWidth={1.5} />
        </button>
        <p className="text-xs opacity-70">
          {rec ? "Enregistrement en cours…" : "Maintiens pour enregistrer ta voix"}
        </p>
      </div>
    </Sheet>
  );
}

/* ---------- Filters / Effects ---------- */
const filterCats = ["None", "Vibrant", "Intense", "B&W", "Film"];
export function EffectSheet(p: { open: boolean; onClose: () => void }) {
  const [cat, setCat] = useState("Vibrant");
  const [sel, setSel] = useState(0);
  const [intensity, setIntensity] = useState(60);
  return (
    <Sheet open={p.open} title="Filtres & effets" onClose={p.onClose}>
      <Tabs items={filterCats} value={cat} onChange={setCat} />
      <div className="scrollbar-hide -mx-1 mb-4 flex gap-3 overflow-x-auto px-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            className="shrink-0 text-center"
          >
            <span
              className={
                "block h-20 w-14 rounded-xl bg-[linear-gradient(160deg,rgba(8,241,237,0.45),rgba(217,70,239,0.45))] " +
                (sel === i ? "ring-2 ring-[#A06EFB]" : "opacity-70")
              }
            />
            <span className="mt-1 block text-[10px] opacity-70">
              {cat} {i + 1}
            </span>
          </button>
        ))}
      </div>
      <SliderRow label="Intensité" value={intensity} onChange={setIntensity} />
    </Sheet>
  );
}

/* ---------- Overlay / Ajustements ---------- */
export function OverlaySheet(p: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("Ajustements");
  const [b, setB] = useState(50);
  const [c, setC] = useState(50);
  const [s, setS] = useState(50);
  const [op, setOp] = useState(80);
  return (
    <Sheet open={p.open} title="Overlay" onClose={p.onClose}>
      <Tabs items={["Ajustements", "Stickers", "Fond"]} value={tab} onChange={setTab} />
      {tab === "Ajustements" ? (
        <>
          <SliderRow label="Luminosité" value={b} onChange={setB} />
          <SliderRow label="Contraste" value={c} onChange={setC} />
          <SliderRow label="Saturation" value={s} onChange={setS} />
          <SliderRow label="Opacité" value={op} onChange={setOp} />
        </>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-xl bg-white/10"
              aria-hidden
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Text ---------- */
const fonts = ["Montserrat", "Inter", "Playfair", "Bebas", "Space Mono"];
const swatches = [
  "#ffffff",
  "#08F1ED",
  "#3994F5",
  "#A06EFB",
  "#D946EF",
  "#F59E0B",
];

export function TextSheet(p: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("Aa");
  const [text, setText] = useState("Flow Lifestyle");
  const [font, setFont] = useState(fonts[0]);
  const [align, setAlign] = useState("center");
  const [color, setColor] = useState(swatches[0]);
  return (
    <Sheet open={p.open} title="Texte" onClose={p.onClose}>
      <Tabs items={["Aa", "Align", "Color", "Easing", "Style"]} value={tab} onChange={setTab} />
      {tab === "Aa" && (
        <>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Contenu du texte"
            className="mb-4 w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none placeholder:opacity-50"
            placeholder="Écris ton texte"
          />
          <div className="space-y-2">
            {fonts.map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className={
                  "w-full rounded-xl px-3 py-3 text-left text-sm " +
                  (font === f ? "bg-white/10 text-[#A06EFB]" : "bg-white/5")
                }
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "Align" && (
        <div className="flex gap-3">
          {["left", "center", "right"].map((a) => (
            <button
              key={a}
              onClick={() => setAlign(a)}
              className={
                "flex-1 rounded-xl py-3 text-xs capitalize " +
                (align === a ? "btn-gradient" : "bg-white/5")
              }
            >
              {a}
            </button>
          ))}
        </div>
      )}
      {tab === "Color" && (
        <div className="flex flex-wrap gap-3">
          {swatches.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
              style={{ background: c }}
              className={
                "h-10 w-10 rounded-full " +
                (color === c ? "ring-2 ring-[#A06EFB] ring-offset-2 ring-offset-[#000000]" : "")
              }
            />
          ))}
        </div>
      )}
      {tab === "Easing" && (
        <div className="grid grid-cols-2 gap-3">
          {["Fade", "Slide", "Pop", "Typewriter"].map((e) => (
            <button key={e} className="rounded-xl bg-white/5 py-4 text-xs">
              {e}
            </button>
          ))}
        </div>
      )}
      {tab === "Style" && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="flex aspect-square items-center justify-center rounded-xl bg-white/5 text-[10px] opacity-80"
            >
              Style {i + 1}
            </span>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Ratio / Crop ---------- */
const ratios = ["1:1", "4:5", "9:16", "16:9"];
export function RatioSheet(p: { open: boolean; onClose: () => void }) {
  const [r, setR] = useState("9:16");
  const [mode, setMode] = useState("Crop");
  return (
    <Sheet open={p.open} title="Canvas & ratio" onClose={p.onClose}>
      <Tabs items={["Crop", "Skew"]} value={mode} onChange={setMode} />
      <div className="relative mx-auto mb-4 aspect-[9/16] w-32 rounded-xl bg-white/10">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="border border-white/15" aria-hidden />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        {ratios.map((x) => (
          <button
            key={x}
            onClick={() => setR(x)}
            className={
              "flex-1 rounded-xl py-3 text-xs " +
              (r === x ? "btn-gradient" : "bg-white/5")
            }
          >
            {x}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- Speed ---------- */
export function SpeedSheet(p: { open: boolean; onClose: () => void }) {
  const [speed, setSpeed] = useState(1);
  const presets = [0.125, 0.5, 1, 2, 4, 8];
  return (
    <Sheet open={p.open} title="Vitesse" onClose={p.onClose}>
      <div className="glass-panel mb-4 h-28 rounded-2xl p-3">
        <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden>
          <path
            d="M0 30 C 25 30, 30 10, 50 10 S 75 30, 100 12"
            fill="none"
            stroke="#08F1ED"
            strokeWidth="1.5"
          />
          {[0, 50, 100].map((x, i) => (
            <circle key={i} cx={x} cy={i === 1 ? 10 : 22} r="2" fill="#3994F5" />
          ))}
        </svg>
      </div>
      <SliderRow
        label={`Vitesse ${speed}x`}
        value={speed}
        min={0.125}
        max={8}
        step={0.125}
        onChange={setSpeed}
      />
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        {presets.map((x) => (
          <button
            key={x}
            onClick={() => setSpeed(x)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-xs " +
              (speed === x ? "btn-gradient" : "bg-white/5")
            }
          >
            {x}x
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- Export ---------- */
export function ExportSheet(p: {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}) {
  const [res, setRes] = useState("1080p");
  const [fmt, setFmt] = useState("MP4");
  const [fps, setFps] = useState(30);
  return (
    <Sheet open={p.open} title="Exporter" onClose={p.onClose}>
      <label className="mb-4 block text-xs opacity-80">
        Résolution
        <select
          value={res}
          onChange={(e) => setRes(e.target.value)}
          className="mt-1.5 w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-white outline-none"
        >
          {["480p", "720p", "1080p", "4K"].map((r) => (
            <option key={r} value={r} className="bg-black">
              {r}
            </option>
          ))}
        </select>
      </label>
      <div className="mb-4 flex gap-3">
        {["MP4", "MOV"].map((f) => (
          <button
            key={f}
            onClick={() => setFmt(f)}
            className={
              "flex-1 rounded-xl py-3 text-xs " + (fmt === f ? "btn-gradient" : "bg-white/5")
            }
          >
            {f}
          </button>
        ))}
      </div>
      <SliderRow label="FPS" value={fps} min={24} max={60} onChange={setFps} />
      <button
        onClick={p.onExport}
        className="btn-gradient w-full rounded-full px-8 py-3 text-sm font-semibold"
      >
        Exporter en {res} · {fmt}
      </button>
    </Sheet>
  );
}
