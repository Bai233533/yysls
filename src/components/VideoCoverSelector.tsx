import { useState, useRef, useCallback, useEffect } from "react";

/* ================================================================
 *  视频封面选择器
 *  - 加载视频，用户拖动滑块选择某一帧作为封面
 *  - 返回该帧的图片 Data URL
 * ================================================================ */

interface Props {
  videoUrl: string;          // 视频 Object URL 或在线地址
  initialCover?: string;     // 已有的封面图（编辑时）
  onConfirm: (coverDataUrl: string) => void;
  onCancel: () => void;
}

export default function VideoCoverSelector({ videoUrl, initialCover, onConfirm, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [preview, setPreview] = useState<string>(initialCover || "");
  const [ready, setReady] = useState(false);

  // 视频元数据加载完毕
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    // 默认取第1秒
    v.currentTime = Math.min(1, v.duration * 0.1);
    setReady(true);
  }, []);

  // 播放位置变化时抓取帧
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    setPreview(c.toDataURL("image/jpeg", 0.85));
  }, []);

  // 滑块拖动
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
  };

  // 格式化时间 mm:ss
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (ready && videoRef.current) {
      videoRef.current.currentTime = Math.min(1, duration * 0.1);
    }
  }, [ready, duration]);

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[600px] mx-4 rounded-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/20">
          <h2 className="font-calligraphy text-gold-200 text-lg tracking-widest">选择视频封面</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gold-400/20 text-gold-200/40 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {/* 隐藏的视频和画布 */}
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            className="hidden"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* 封面预览 */}
          {preview ? (
            <div className="w-full rounded border border-gold-400/20 overflow-hidden bg-ink-900/40 mb-4">
              <img src={preview} className="w-full max-h-[50vh] object-contain" alt="封面预览" />
            </div>
          ) : (
            <div className="w-full h-48 rounded border border-gold-400/20 bg-ink-900/40 flex items-center justify-center mb-4">
              <span className="font-song text-sm text-gold-200/30">加载中...</span>
            </div>
          )}

          {/* 滑块 */}
          {ready && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-song text-xs text-gold-200/50">{fmt(currentTime)}</span>
                <span className="font-song text-xs text-gold-200/50">{fmt(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #c49b30 0%, #e9c176 ${(currentTime / (duration || 1)) * 100}%, rgba(233,193,118,0.15) ${(currentTime / (duration || 1)) * 100}%, rgba(233,193,118,0.15) 100%)`,
                  accentColor: "#e9c176",
                }}
              />
              <p className="font-song text-xs text-gold-200/30 text-center mt-2">拖动滑块选择封面帧</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded text-sm font-song border border-gold-400/20 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => preview && onConfirm(preview)}
              disabled={!preview}
              className="flex-1 py-2.5 rounded text-sm font-song transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #c49b30, #e9c176)",
                color: "#0f0a05",
                fontWeight: 600,
                opacity: preview ? 1 : 0.5,
                cursor: preview ? "pointer" : "not-allowed",
              }}
            >
              确认封面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
