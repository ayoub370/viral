import { useState } from "react";
import { X, Play, Check, Volume2, Mic } from "lucide-react";

const IC = 'var(--text-primary)';

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
        className="absolute inset-0"
        style={{ background: 'var(--overlay-bg)' }}
      />
      <div className="relative max-h-[70%] w-full overflow-y-auto rounded-t-3xl p-4 pb-8 animate-slide-up" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)', borderBottom: 'none' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: IC }}>{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Annuler"
              className="flex h-8 w-8 items-center justify-center rounded-full btn-secondary"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              aria-label="Valider"
              className="flex h-8 w-8 items-center justify-center rounded-full btn-primary"
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
    <div className="scrollbar-hide mb-4 flex gap-5 overflow-x-auto border-b" style={{ borderColor: 'var(--divider-border)' }}>
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onChange(it)}
          className="shrink-0 pb-2 text-xs font-medium transition-colors"
          style={{
            color: value === it ? IC : 'var(--text-muted)',
            borderBottom: value === it ? `2px solid ${IC}` : '2px solid transparent',
            opacity: value === it ? 1 : 0.6,
          }}
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
      <span className="mb-1.5 flex justify-between text-xs" style={{ color: IC, opacity: 0.8 }}>
        {label} <span className="tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: IC }}
      />
    </label>
  );
}

const tracks = ["Golden horses", "Night drive", "Neon tape", "Slow motion", "City lights"];

export function MusicSheet(p: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("Music");
  const [sel, setSel] = useState(tracks[0]);
  return (
    <Sheet open={p.open} title="Musique" onClose={p.onClose}>
      <Tabs items={["Music", "Effect", "Extract"]} value={tab} onChange={setTab} />
      <div className="mb-4 flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full btn-primary">
          <Play className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: IC }}>{sel}</p>
          <div className="mt-1.5 h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-1 w-1/3 rounded-full" style={{ background: IC }} />
          </div>
        </div>
        <Volume2 className="h-4 w-4" strokeWidth={1.5} style={{ color: IC, opacity: 0.7 }} />
      </div>
      <div className="space-y-2">
        {tracks.map((t) => (
          <button
            key={t}
            onClick={() => setSel(t)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors"
            style={{
              background: sel === t ? 'rgba(255,255,255,0.08)' : 'var(--card-bg)',
              color: sel === t ? IC : 'var(--text-muted)',
            }}
          >
            {t}
            <span className="text-[11px]" style={{ opacity: 0.6 }}>00:{10 + t.length}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function VoiceSheet(p: { open: boolean; onClose: () => void }) {
  const [rec, setRec] = useState(false);
  return (
    <Sheet open={p.open} title="Voix off" onClose={p.onClose}>
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          onClick={() => setRec((r) => !r)}
          className={
            "flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95 " +
            (rec ? "btn-danger" : "btn-primary")
          }
          aria-label={rec ? "Arrêter l'enregistrement" : "Enregistrer"}
        >
          <Mic className="h-7 w-7" strokeWidth={1.5} />
        </button>
        <p className="text-xs" style={{ color: IC, opacity: 0.7 }}>
          {rec ? "Enregistrement en cours…" : "Maintiens pour enregistrer ta voix"}
        </p>
      </div>
    </Sheet>
  );
}

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
              className="block h-20 w-14 rounded-xl"
              style={{
                background: 'var(--card-bg)',
                border: sel === i ? `2px solid ${IC}` : '1px solid var(--card-border)',
                opacity: sel === i ? 1 : 0.7,
              }}
            />
            <span className="mt-1 block text-[10px]" style={{ color: IC, opacity: 0.7 }}>
              {cat} {i + 1}
            </span>
          </button>
        ))}
      </div>
      <SliderRow label="Intensité" value={intensity} onChange={setIntensity} />
    </Sheet>
  );
}

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
              className="aspect-square rounded-xl"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              aria-hidden
            />
          ))}
        </div>
      )}
    </Sheet>
  );
}

const fonts = ["Montserrat", "Inter", "Playfair", "Bebas", "Space Mono"];

export function TextSheet(p: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState("Aa");
  const [text, setText] = useState("Flow Lifestyle");
  const [font, setFont] = useState(fonts[0]);
  const [align, setAlign] = useState("center");
  const [color, setColor] = useState("#ffffff");
  const swatches = ["#ffffff", "#888888", "#3994f5", "#a06efb", "#d946ef", "#f59e0b"];
  return (
    <Sheet open={p.open} title="Texte" onClose={p.onClose}>
      <Tabs items={["Aa", "Align", "Color", "Easing", "Style"]} value={tab} onChange={setTab} />
      {tab === "Aa" && (
        <>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Contenu du texte"
            className="mb-4 w-full rounded-xl px-3 py-3 text-sm outline-none input-field"
            placeholder="Écris ton texte"
          />
          <div className="space-y-2">
            {fonts.map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className="w-full rounded-xl px-3 py-3 text-left text-sm transition-colors"
                style={{
                  background: font === f ? 'rgba(255,255,255,0.08)' : 'var(--card-bg)',
                  color: font === f ? IC : 'var(--text-muted)',
                }}
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
              className="flex-1 rounded-xl py-3 text-xs capitalize"
              style={{
                background: align === a ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
                color: align === a ? 'var(--btn-primary-text)' : IC,
              }}
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
              className="h-10 w-10 rounded-full"
            >
              {color === c && <span className="block h-full w-full rounded-full" style={{ boxShadow: `0 0 0 2px ${IC}` }} />}
            </button>
          ))}
        </div>
      )}
      {tab === "Easing" && (
        <div className="grid grid-cols-2 gap-3">
          {["Fade", "Slide", "Pop", "Typewriter"].map((e) => (
            <button key={e} className="rounded-xl py-4 text-xs" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC }}>
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
              className="flex aspect-square items-center justify-center rounded-xl text-[10px]"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: IC, opacity: 0.8 }}
            >
              Style {i + 1}
            </span>
          ))}
        </div>
      )}
    </Sheet>
  );
}

const ratios = ["1:1", "4:5", "9:16", "16:9"];
export function RatioSheet(p: { open: boolean; onClose: () => void }) {
  const [r, setR] = useState("9:16");
  const [mode, setMode] = useState("Crop");
  return (
    <Sheet open={p.open} title="Canvas & ratio" onClose={p.onClose}>
      <Tabs items={["Crop", "Skew"]} value={mode} onChange={setMode} />
      <div className="relative mx-auto mb-4 aspect-[9/16] w-32 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="border" style={{ borderColor: 'var(--divider-border)' }} aria-hidden />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        {ratios.map((x) => (
          <button
            key={x}
            onClick={() => setR(x)}
            className="flex-1 rounded-xl py-3 text-xs"
            style={{
              background: r === x ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
              color: r === x ? 'var(--btn-primary-text)' : IC,
            }}
          >
            {x}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function SpeedSheet(p: { open: boolean; onClose: () => void }) {
  const [speed, setSpeed] = useState(1);
  const presets = [0.125, 0.5, 1, 2, 4, 8];
  return (
    <Sheet open={p.open} title="Vitesse" onClose={p.onClose}>
      <div className="mb-4 h-28 rounded-2xl p-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden>
          <path
            d="M0 30 C 25 30, 30 10, 50 10 S 75 30, 100 12"
            fill="none"
            stroke={IC}
            strokeWidth="1.5"
            opacity="0.8"
          />
          {[0, 50, 100].map((x, i) => (
            <circle key={i} cx={x} cy={i === 1 ? 10 : 22} r="2" fill={IC} opacity="0.6" />
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
            className="shrink-0 rounded-full px-4 py-2 text-xs"
            style={{
              background: speed === x ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
              color: speed === x ? 'var(--btn-primary-text)' : IC,
            }}
          >
            {x}x
          </button>
        ))}
      </div>
    </Sheet>
  );
}

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
      <label className="mb-4 block text-xs" style={{ color: IC, opacity: 0.8 }}>
        Résolution
        <select
          value={res}
          onChange={(e) => setRes(e.target.value)}
          className="mt-1.5 w-full rounded-xl px-3 py-3 text-sm outline-none input-field"
        >
          {["480p", "720p", "1080p", "4K"].map((r) => (
            <option key={r} value={r} style={{ background: 'var(--modal-bg)', color: IC }}>
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
            className="flex-1 rounded-xl py-3 text-xs"
            style={{
              background: fmt === f ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
              color: fmt === f ? 'var(--btn-primary-text)' : IC,
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <SliderRow label="FPS" value={fps} min={24} max={60} onChange={setFps} />
      <button
        onClick={p.onExport}
        className="w-full rounded-full px-8 py-3 text-sm font-semibold btn-primary"
      >
        Exporter en {res} · {fmt}
      </button>
    </Sheet>
  );
}
