import { Plus, Music2, Mic, Type, Sparkles, Layers, Crop } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolKey = "music" | "voice" | "text" | "effect" | "overlay" | "ratio";

const tools: { key: ToolKey; label: string; icon: LucideIcon }[] = [
  { key: "music", label: "Music", icon: Music2 },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "text", label: "Text", icon: Type },
  { key: "effect", label: "Effect", icon: Sparkles },
  { key: "overlay", label: "Overlay", icon: Layers },
  { key: "ratio", label: "Ratio", icon: Crop },
];

export function EditorToolbar({
  active,
  onSelect,
  onAdd,
}: {
  active: ToolKey | null;
  onSelect: (k: ToolKey) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="flex items-center gap-4 px-4 pb-6 pt-4">
      <button
        onClick={onAdd}
        aria-label="Ajouter un média"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black"
      >
        <Plus className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <div className="scrollbar-hide flex flex-1 items-start justify-between gap-4 overflow-x-auto">
        {tools.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={
              "flex shrink-0 flex-col items-center gap-1.5 text-[11px] transition-colors " +
              (active === key ? "text-[#A06EFB]" : "opacity-80")
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
