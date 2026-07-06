import { useState, useRef, useEffect } from "react";
import { Volume2, Music } from "lucide-react";
import { useStore } from "../store/useStore";
import { audioEl } from "./BGMusic";

export default function MusicControl() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const bgMuted = useStore((s) => s.bgMuted);
  const bgVolume = useStore((s) => s.bgVolume);
  const setBgVolume = useStore((s) => s.setBgVolume);
  const setBgPlaying = useStore((s) => s.setBgPlaying);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBgVolume(v);
    if (audioEl) {
      audioEl.volume = v;
      audioEl.muted = v === 0;
      if (v > 0 && audioEl.paused) {
        audioEl.play().then(() => setBgPlaying(true)).catch(() => {});
      }
    }
  };

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-[110]"
    >
      {/* 音量控制面板 — 从按钮右侧弹出 */}
      <div
        ref={panelRef}
        className={`absolute left-[calc(100%+6px)] top-1/2 -translate-y-1/2
          flex items-center gap-3 px-3 py-2
          bg-ink-900/90 border border-gold-400/15 backdrop-blur-md rounded-lg
          transition-all duration-200 origin-left
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <Volume2 size={14} className="text-gold-200/50 flex-shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={bgMuted ? 0 : bgVolume}
          onChange={handleVolumeChange}
          className="w-24 h-1 appearance-none rounded-full bg-gold-400/20 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gold-200/70 [&::-webkit-slider-thumb]:hover:bg-gold-200
            [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(212,175,55,0.3)]"
        />
      </div>

      {/* 音符按钮 */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`w-10 h-10 rounded-r-lg flex items-center justify-center
          bg-ink-900/70 border border-l-0 border-gold-400/15 backdrop-blur-md
          text-gold-200/50 hover:text-gold-200 hover:bg-ink-900/90
          transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-40 hover:opacity-90"}`}
      >
        <Music size={16} />
      </button>
    </div>
  );
}
