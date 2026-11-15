import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Scissors,
  Music2,
  Type,
  Sticker,
  Sparkles,
  Captions,
  Volume2,
  Play,
  ChevronDown,
} from 'lucide-react';
import { ExportSheet } from '../components/editor/Sheets';
import { SaveAsModal, ProgressModal, ExportDoneModal } from '../components/editor/Modals';

interface VideoEditorProps {
  onBack: () => void;
  onNext?: () => void;
  onOpenStudio?: () => void;
  previewUrl?: string;
  previewType?: 'image' | 'video';
}

const editTools = [
  { icon: Scissors, label: 'Trim' },
  { icon: Music2, label: 'Sound' },
  { icon: Type, label: 'Text' },
  { icon: Sticker, label: 'Sticker' },
  { icon: Sparkles, label: 'Effects' },
  { icon: Captions, label: 'Captions' },
  { icon: Volume2, label: 'Volume' },
];

const IC = 'var(--text-primary)';

const VideoEditor: React.FC<VideoEditorProps> = ({
  onBack,
  onNext,
  onOpenStudio,
  previewUrl,
  previewType,
}) => {
  const [active, setActive] = useState('Trim');
  const [exportOpen, setExportOpen] = useState(false);
  const [saveAs, setSaveAs] = useState(false);
  const [progressModal, setProgressModal] = useState(false);
  const [exportValue, setExportValue] = useState(0);
  const [doneOpen, setDoneOpen] = useState(false);
  const [fileName, setFileName] = useState('clip_1');

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
        return Math.min(100, v + 5);
      });
    }, 160);
    return () => clearInterval(id);
  }, [progressModal]);

  return (
    <div className="fixed inset-0 z-[2000]" style={{ background: 'var(--page-bg)', color: IC }}>
      <div className="relative mx-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.04), transparent 60%)' }} />

        {/* Header */}
        <div className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pt-6">
          <button
            onClick={onBack}
            aria-label="Retour à la caméra"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: IC }} />
          </button>
          <h1 className="truncate text-center text-sm font-semibold" style={{ color: IC }}>Éditeur</h1>
          <button
            onClick={() => setExportOpen(true)}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold btn-primary"
          >
            Suivant
          </button>
        </div>

        {/* Preview */}
        <div className="relative z-10 mt-4 flex-1 px-4">
          <div
            className="flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-3xl"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            {previewUrl ? (
              previewType === 'image' ? (
                <img src={previewUrl} alt="Capture" className="h-full w-full object-cover" />
              ) : (
                <video src={previewUrl} controls playsInline className="h-full w-full object-cover" />
              )
            ) : (
              <Play className="h-10 w-10" style={{ color: IC, opacity: 0.5 }} />
            )}
          </div>
        </div>

        {/* Side tools - no glass on icons */}
        <div className="absolute right-3 top-28 bottom-56 z-20 flex w-16 flex-col items-center">
          <div
            className="flex w-full flex-col items-center gap-3 overflow-y-auto overscroll-contain py-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {editTools.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => (label === 'Trim' ? onOpenStudio?.() : setActive(label))}
                className="group flex w-14 shrink-0 flex-col items-center gap-1"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform active:scale-95"
                  style={active === label ? { background: 'var(--btn-primary-bg)' } : {}}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} style={{ color: active === label ? 'var(--btn-primary-text)' : IC }} />
                </span>
                <span className="text-[10px] font-medium" style={{ color: IC, opacity: 0.8 }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="pointer-events-none mt-1 flex h-6 w-full items-center justify-center">
            <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: IC, opacity: 0.6 }} />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative z-10 px-4 pb-10 pt-5">
          <button
            onClick={() => onOpenStudio?.()}
            aria-label="Ouvrir le studio de montage"
            className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl p-2"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="h-12 w-10 shrink-0 rounded-md" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden />
            ))}
            <span className="ml-1 flex h-12 w-10 shrink-0 items-center justify-center rounded-md btn-primary">
              <Scissors className="h-4 w-4" />
            </span>
          </button>
          <p className="mt-3 text-center text-[11px]" style={{ color: IC, opacity: 0.6 }}>
            Touche le ciseau pour ouvrir le studio — {active}
          </p>
        </div>

        <ExportSheet
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          onExport={() => {
            setExportOpen(false);
            setSaveAs(true);
          }}
        />
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
          onClose={() => {
            setDoneOpen(false);
            onNext?.();
          }}
        />
      </div>
    </div>
  );
};

export default VideoEditor;
