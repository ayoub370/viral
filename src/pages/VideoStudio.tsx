import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Crown, Download, Gauge } from "lucide-react";
import { VideoPreview } from "../components/editor/VideoPreview";
import { TimelineTracks } from "../components/editor/TimelineTracks";
import { EditorToolbar, type ToolKey } from "../components/editor/EditorToolbar";
import {
  MusicSheet,
  VoiceSheet,
  EffectSheet,
  OverlaySheet,
  TextSheet,
  RatioSheet,
  SpeedSheet,
  ExportSheet,
} from "../components/editor/Sheets";
import {
  PremiumModal,
  SaveAsModal,
  ConfirmExitModal,
  ProgressModal,
  ExportDoneModal,
} from "../components/editor/Modals";

const TOTAL = 18; // secondes

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const VideoStudio: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [premium, setPremium] = useState(false);
  const [saveAs, setSaveAs] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [exportValue, setExportValue] = useState(0);
  const [doneOpen, setDoneOpen] = useState(false);
  const [fileName, setFileName] = useState("merged video_1");
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setProgress((p) => {
        const n = p + dt / TOTAL;
        if (n >= 1) {
          setPlaying(false);
          return 1;
        }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  useEffect(() => {
    if (!progressModal) return;
    const id = setInterval(() => {
      setExportValue((v) => {
        if (v >= 100) {
          clearInterval(id);
          setProgressModal(false);
          setDoneOpen(true);
          return 100;
        }
        return Math.min(100, v + 4.5);
      });
    }, 160);
    return () => clearInterval(id);
  }, [progressModal]);

  return (
    <div className="fixed inset-0 z-[2100] overflow-y-auto bg-black text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(57,148,245,0.12),transparent_65%)]" />

        <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-6">
          <button
            onClick={() => setExitOpen(true)}
            aria-label="Quitter le studio"
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-full"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <h1 className="truncate text-sm font-semibold">Studio</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPremium(true)}
              aria-label="Passer Premium"
              className="flex items-center gap-1.5 rounded-full bg-[#A06EFB]/20 px-3 py-2 text-[11px] font-semibold text-[#A06EFB]"
            >
              <Crown className="h-3.5 w-3.5" strokeWidth={1.5} /> PRO
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="btn-gradient flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Export
            </button>
          </div>
        </header>

        <section className="relative z-10 mt-3">
          <VideoPreview
            playing={playing}
            onTogglePlay={() => setPlaying((p) => !p)}
            current={fmt(progress * TOTAL)}
            total={fmt(TOTAL)}
          />
        </section>

        <div className="relative z-10 flex justify-end px-4 pt-3">
          <button
            onClick={() => setSpeedOpen(true)}
            className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px]"
          >
            <Gauge className="h-3.5 w-3.5" strokeWidth={1.5} /> Vitesse
          </button>
        </div>

        <div className="relative z-10">
          <TimelineTracks
            progress={progress}
            onSeek={(p) => setProgress(p)}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
          />
        </div>

        <div className="relative z-10 mt-auto">
          <EditorToolbar active={tool} onSelect={(k) => setTool(k)} onAdd={() => setTool("music")} />
        </div>

        <MusicSheet open={tool === "music"} onClose={() => setTool(null)} />
        <VoiceSheet open={tool === "voice"} onClose={() => setTool(null)} />
        <TextSheet open={tool === "text"} onClose={() => setTool(null)} />
        <EffectSheet open={tool === "effect"} onClose={() => setTool(null)} />
        <OverlaySheet open={tool === "overlay"} onClose={() => setTool(null)} />
        <RatioSheet open={tool === "ratio"} onClose={() => setTool(null)} />
        <SpeedSheet open={speedOpen} onClose={() => setSpeedOpen(false)} />
        <ExportSheet
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onExport={() => {
            setExportOpen(false);
            setSaveAs(true);
          }}
        />

        <PremiumModal open={premium} onClose={() => setPremium(false)} />
        <SaveAsModal
          open={saveAs}
          onCancel={() => setSaveAs(false)}
          onOk={(name) => {
            setFileName(name);
            setSaveAs(false);
            setExportValue(0);
            setProgressModal(true);
          }}
        />
        <ProgressModal
          open={progressModal}
          value={exportValue}
          onCancel={() => setProgressModal(false)}
        />
        <ExportDoneModal
          open={doneOpen}
          fileName={fileName}
          onClose={() => setDoneOpen(false)}
        />
        <ConfirmExitModal
          open={exitOpen}
          onNo={() => setExitOpen(false)}
          onYes={() => {
            setExitOpen(false);
            onBack();
          }}
        />
      </div>
    </div>
  );
};

export default VideoStudio;
