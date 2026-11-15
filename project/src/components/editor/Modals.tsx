import { useState } from "react";
import { Crown, Check, AlertTriangle, Trash2, Share2, Download } from "lucide-react";

const IC = 'var(--text-primary)';

function Backdrop({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'var(--overlay-bg)' }}
    >
      <div className="w-full max-w-[320px] rounded-3xl p-6 text-center animate-slide-up" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
        {children}
      </div>
    </div>
  );
}

export function ExportDoneModal({
  open,
  fileName,
  onClose,
}: {
  open: boolean;
  fileName: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <Backdrop label="Export terminé">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full btn-primary">
        <Check className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h2 className="text-base font-semibold" style={{ color: IC }}>Export terminé</h2>
      <p className="mt-1 mb-4 truncate text-xs" style={{ color: IC, opacity: 0.7 }}>{fileName}.mp4</p>
      <div className="mx-auto mb-5 aspect-[9/16] w-24 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} aria-hidden />
      <div className="flex gap-3">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs btn-secondary">
          <Download className="h-4 w-4" strokeWidth={1.5} /> Enregistrer
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold btn-primary">
          <Share2 className="h-4 w-4" strokeWidth={1.5} /> Partager
        </button>
      </div>
      <button onClick={onClose} className="mt-3 text-xs" style={{ color: IC, opacity: 0.6 }}>
        Fermer
      </button>
    </Backdrop>
  );
}

export function PremiumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState("year");
  if (!open) return null;
  return (
    <Backdrop label="Passer Premium">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full btn-primary">
        <Crown className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h2 className="text-base font-semibold" style={{ color: IC }}>Passe en PRO</h2>
      <ul className="my-4 space-y-2 text-left text-xs" style={{ color: IC, opacity: 0.9 }}>
        {["Export 4K sans filigrane", "Tous les filtres & effets", "Musiques illimitées"].map(
          (f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: IC }} /> {f}
            </li>
          ),
        )}
      </ul>
      <div className="mb-4 flex gap-3">
        {[
          { id: "month", t: "900 / mois" },
          { id: "year", t: "3500 / an" },
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setPlan(o.id)}
            className="flex-1 rounded-2xl py-3 text-xs"
            style={{
              background: plan === o.id ? 'var(--btn-primary-bg)' : 'var(--card-bg)',
              color: plan === o.id ? 'var(--btn-primary-text)' : IC,
            }}
          >
            {o.t}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full rounded-full px-8 py-3 text-sm font-semibold btn-primary"
      >
        Upgrade
      </button>
      <button onClick={onClose} className="mt-3 text-xs" style={{ color: IC, opacity: 0.6 }}>
        Plus tard
      </button>
    </Backdrop>
  );
}

export function SaveAsModal({
  open,
  onCancel,
  onOk,
}: {
  open: boolean;
  onCancel: () => void;
  onOk: (name: string) => void;
}) {
  const [name, setName] = useState("merged video_1");
  if (!open) return null;
  return (
    <Backdrop label="Enregistrer sous">
      <h2 className="mb-4 text-sm font-semibold" style={{ color: IC }}>Enregistrer sous</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Nom du fichier"
        className="mb-5 w-full rounded-xl px-3 py-3 text-sm outline-none input-field"
      />
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full py-3 text-xs btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onOk(name)}
          className="flex-1 rounded-full py-3 text-xs font-semibold btn-primary"
        >
          Ok
        </button>
      </div>
    </Backdrop>
  );
}

export function ConfirmExitModal({
  open,
  onNo,
  onYes,
}: {
  open: boolean;
  onNo: () => void;
  onYes: () => void;
}) {
  if (!open) return null;
  return (
    <Backdrop label="Quitter l'éditeur">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full btn-danger">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mb-5 text-sm" style={{ color: IC }}>Veux-tu vraiment quitter l'éditeur ?</p>
      <div className="flex gap-3">
        <button onClick={onNo} className="flex-1 rounded-full py-3 text-xs btn-secondary">
          No
        </button>
        <button
          onClick={onYes}
          className="flex-1 rounded-full py-3 text-xs font-semibold btn-primary"
        >
          Yes
        </button>
      </div>
    </Backdrop>
  );
}

export function ConfirmUnsavedModal({
  open,
  onCancel,
  onLeave,
}: {
  open: boolean;
  onCancel: () => void;
  onLeave: () => void;
}) {
  if (!open) return null;
  return (
    <Backdrop label="Projet non enregistré">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full btn-danger">
        <Trash2 className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mb-5 text-sm" style={{ color: IC }}>
        Si tu pars sans enregistrer, ton projet sera définitivement perdu.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full py-3 text-xs btn-secondary">
          Annuler
        </button>
        <button
          onClick={onLeave}
          className="flex-1 rounded-full py-3 text-xs font-semibold btn-danger"
        >
          Quitter
        </button>
      </div>
    </Backdrop>
  );
}

export function ProgressModal({
  open,
  value,
  onCancel,
}: {
  open: boolean;
  value: number;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Backdrop label="Export en cours">
      <p className="mb-3 text-sm font-semibold tabular-nums" style={{ color: IC }}>{value.toFixed(1)}% Complete</p>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${value}%`, background: IC }}
        />
      </div>
      <button onClick={onCancel} className="w-full rounded-full py-3 text-xs btn-secondary">
        Cancel
      </button>
    </Backdrop>
  );
}
