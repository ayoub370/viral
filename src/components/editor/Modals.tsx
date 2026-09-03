import { useState } from "react";
import { Crown, Check, AlertTriangle, Trash2, Share2, Download } from "lucide-react";

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
      <span className="btn-gradient mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <Check className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h2 className="text-base font-semibold">Export terminé</h2>
      <p className="mt-1 mb-4 truncate text-xs opacity-70">{fileName}.mp4</p>
      <div className="mx-auto mb-5 aspect-[9/16] w-24 rounded-xl bg-white/10" aria-hidden />
      <div className="flex gap-3">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/5 py-3 text-xs">
          <Download className="h-4 w-4" strokeWidth={1.5} /> Enregistrer
        </button>
        <button className="btn-gradient flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-semibold">
          <Share2 className="h-4 w-4" strokeWidth={1.5} /> Partager
        </button>
      </div>
      <button onClick={onClose} className="mt-3 text-xs opacity-60">
        Fermer
      </button>
    </Backdrop>
  );
}

function Backdrop({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
    >
      <div className="glass-panel w-full max-w-[320px] rounded-3xl p-6 text-center">{children}</div>
    </div>
  );
}

export function PremiumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState("year");
  if (!open) return null;
  return (
    <Backdrop label="Passer Premium">
      <span className="btn-gradient mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <Crown className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <h2 className="text-base font-semibold">Passe en PRO</h2>
      <ul className="my-4 space-y-2 text-left text-xs opacity-90">
        {["Export 4K sans filigrane", "Tous les filtres & effets", "Musiques illimitées"].map(
          (f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#08F1ED]" strokeWidth={1.5} /> {f}
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
            className={
              "flex-1 rounded-2xl py-3 text-xs " +
              (plan === o.id ? "btn-gradient" : "bg-white/5")
            }
          >
            {o.t}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="btn-gradient w-full rounded-full px-8 py-3 text-sm font-semibold"
      >
        Upgrade
      </button>
      <button onClick={onClose} className="mt-3 text-xs opacity-60">
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
      <h2 className="mb-4 text-sm font-semibold">Enregistrer sous</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Nom du fichier"
        className="mb-5 w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none"
      />
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full bg-white/5 py-3 text-xs">
          Cancel
        </button>
        <button
          onClick={() => onOk(name)}
          className="btn-gradient flex-1 rounded-full py-3 text-xs font-semibold"
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
      <span className="btn-gradient mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mb-5 text-sm">Veux-tu vraiment quitter l'éditeur ?</p>
      <div className="flex gap-3">
        <button onClick={onNo} className="flex-1 rounded-full bg-white/5 py-3 text-xs">
          No
        </button>
        <button
          onClick={onYes}
          className="btn-gradient flex-1 rounded-full py-3 text-xs font-semibold"
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
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D946EF]/25 text-[#D946EF]">
        <Trash2 className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="mb-5 text-sm">
        Si tu pars sans enregistrer, ton projet sera définitivement perdu.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-full bg-white/5 py-3 text-xs">
          Annuler
        </button>
        <button
          onClick={onLeave}
          className="flex-1 rounded-full bg-[#D946EF] py-3 text-xs font-semibold"
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
      <p className="mb-3 text-sm font-semibold tabular-nums">{value.toFixed(1)}% Complete</p>
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#08F1ED,#3994F5)] transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
      <button onClick={onCancel} className="w-full rounded-full bg-white/5 py-3 text-xs">
        Cancel
      </button>
    </Backdrop>
  );
}
