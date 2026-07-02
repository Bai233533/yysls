import { useRef, useState, useEffect } from "react";
import { X, Upload, RotateCcw, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";

interface BackgroundPickerProps {
  onClose: () => void;
}

const CROP_RATIO = 16 / 9; // 首页背景比例
const OUTPUT_W = 1920;
const OUTPUT_H = Math.round(OUTPUT_W / CROP_RATIO); // 1080

export default function BackgroundPicker({ onClose }: BackgroundPickerProps) {
  const { heroBackground, setHeroBackground, resetHeroBackground, bgPresets, addBgPreset, removeBgPreset } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(heroBackground);

  /* 裁剪状态 */
  const [cropping, setCropping] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });

  /* 裁剪框状态 */
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, box: { x: 0, y: 0, w: 0, h: 0 } });

  /* 阻止背景滚动 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* 点击预设 */
  const handlePresetClick = (url: string) => {
    setPreviewUrl(url);
    setHeroBackground(url);
  };

  /* 上传图片 - 进入裁剪 */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropping(true);
      setImgLoaded(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* 图片加载完成：计算显示尺寸和最大裁剪框 */
  const handleImgLoad = () => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    /* 图片按 contain 方式适配容器 */
    const ratio = Math.min(cw / natW, ch / natH);
    const dispW = natW * ratio;
    const dispH = natH * ratio;
    const dispX = (cw - dispW) / 2;
    const dispY = (ch - dispH) / 2;

    setImgSize({ w: dispW, h: dispH });
    setImgOffset({ x: dispX, y: dispY });

    /* 裁剪框：16:9，尽可能大，居中 */
    let cropW, cropH;
    if (dispW / dispH >= CROP_RATIO) {
      /* 图片更宽：以高度为基准 */
      cropH = dispH;
      cropW = cropH * CROP_RATIO;
    } else {
      /* 图片更高：以宽度为基准 */
      cropW = dispW;
      cropH = cropW / CROP_RATIO;
    }
    setCropBox({
      x: dispX + (dispW - cropW) / 2,
      y: dispY + (dispH - cropH) / 2,
      w: cropW,
      h: cropH,
    });
    setImgLoaded(true);
  };

  /* 拖拽开始 */
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, box: { ...cropBox } };
  };

  /* 全局鼠标移动 */
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const start = dragStart.current.box;

      const imgLeft = imgOffset.x;
      const imgTop = imgOffset.y;
      const imgRight = imgOffset.x + imgSize.w;
      const imgBottom = imgOffset.y + imgSize.h;

      const x = Math.max(imgLeft, Math.min(imgRight - start.w, start.x + dx));
      const y = Math.max(imgTop, Math.min(imgBottom - start.h, start.y + dy));

      setCropBox((prev) => ({ ...prev, x, y }));
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, imgOffset, imgSize, cropBox.w, cropBox.h]);

  /* 确认裁剪 */
  const confirmCrop = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;

    /* 计算源图像坐标 */
    const scaleX = imgRef.current.naturalWidth / imgSize.w;
    const scaleY = imgRef.current.naturalHeight / imgSize.h;
    const srcX = (cropBox.x - imgOffset.x) * scaleX;
    const srcY = (cropBox.y - imgOffset.y) * scaleY;
    const srcW = cropBox.w * scaleX;
    const srcH = cropBox.h * scaleY;

    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_W, OUTPUT_H);

    const result = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(result);
    setHeroBackground(result);
    setCropping(false);
    setCropSrc("");
  };

  const cancelCrop = () => {
    setCropping(false);
    setCropSrc("");
  };

  /* 保存到预设 */
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    addBgPreset(presetName.trim(), previewUrl);
    setShowSavePreset(false);
    setPresetName("");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(12,10,8,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-[210] w-[720px] max-w-[92vw] max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(180deg, #1a1814 0%, #0d0c0a 100%)",
          border: "1px solid rgba(193,155,77,0.25)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(193,155,77,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-none"
          style={{ borderColor: "rgba(193,155,77,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <ImageIcon size={18} style={{ color: "#e9c176" }} />
            <h3 className="font-song text-lg text-gold-100 tracking-wider">背景设置</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gold-400/10 text-gold-200/50 hover:text-gold-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: 滚动区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Preview */}
          <p className="font-song text-sm text-gold-200/50 mb-2 tracking-wider">实时预览</p>
          <div
            className="w-full h-40 rounded-lg overflow-hidden relative mb-5"
            style={{ border: "1px solid rgba(193,155,77,0.2)" }}
          >
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover"
              style={{ filter: "sepia(0.3) saturate(0.7) brightness(0.45) contrast(1.1)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,10,8,0.6), transparent 60%)" }} />
          </div>

          {/* Presets */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-song text-sm text-gold-200/50 tracking-wider">我的预设</p>
            <button
              onClick={() => setShowSavePreset(true)}
              className="flex items-center gap-1 text-xs font-song text-gold-200/60 hover:text-gold-200 transition-colors"
            >
              <Plus size={12} />
              保存当前到预设
            </button>
          </div>
          {bgPresets.length === 0 ? (
            <div className="w-full aspect-video rounded-lg flex items-center justify-center"
              style={{ border: "1px dashed rgba(193,155,77,0.2)" }}>
              <p className="text-xs text-gold-200/30 font-song">暂无预设，上传图片后可保存为预设</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {bgPresets.map((p) => (
                <div key={p.url} className="relative group">
                  <button
                    onClick={() => handlePresetClick(p.url)}
                    className="w-full aspect-video rounded-lg overflow-hidden transition-all hover:scale-[1.03] block"
                    style={{
                      border: heroBackground === p.url
                        ? "2px solid rgba(233,193,118,0.8)"
                        : "1px solid rgba(193,155,77,0.15)",
                      boxShadow: heroBackground === p.url ? "0 0 12px rgba(193,155,77,0.3)" : "none",
                    }}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover"
                      style={{ filter: "sepia(0.3) saturate(0.7) brightness(0.5)" }} />
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-ink-900/70 backdrop-blur-sm">
                      <span className="text-[10px] text-gold-200 font-song tracking-wider">{p.name}</span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeBgPreset(p.url); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="删除预设"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between flex-none"
          style={{ borderColor: "rgba(193,155,77,0.15)" }}
        >
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-song tracking-wider transition-all"
              style={{
                background: "rgba(193,155,77,0.1)",
                color: "#e9c176",
                border: "1px solid rgba(193,155,77,0.25)",
              }}
            >
              <Upload size={14} />
              上传图片
            </button>
            <button
              onClick={resetHeroBackground}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-song tracking-wider transition-all hover:bg-gold-400/10"
              style={{ color: "rgba(233,193,118,0.6)", border: "1px solid rgba(193,155,77,0.15)" }}
            >
              <RotateCcw size={14} />
              恢复默认
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-song tracking-wider transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #c19b4d 0%, #e9c176 100%)",
              color: "#1a1814",
              boxShadow: "0 2px 8px rgba(193,155,77,0.3)",
            }}
          >
            完成
          </button>
        </div>
      </div>

      {/* 裁剪弹窗 */}
      {cropping && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/85" onClick={cancelCrop} />
          <div className="relative z-[310] w-[720px] max-w-[95vw] rounded-xl overflow-hidden"
            style={{
              background: "#0d0c0a",
              border: "1px solid rgba(193,155,77,0.25)",
            }}
          >
            <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(193,155,77,0.15)" }}>
              <h4 className="font-song text-gold-100 tracking-wider">裁剪图片</h4>
              <span className="text-xs text-gold-200/40 font-song">比例 16:9 · 拖动选择区域</span>
            </div>

            {/* 裁剪容器 */}
            <div
              ref={containerRef}
              className="relative w-full bg-black overflow-hidden select-none"
              style={{ height: "420px" }}
            >
              {/* 图片 */}
              <img
                ref={imgRef}
                src={cropSrc}
                alt="crop"
                className="absolute pointer-events-none select-none"
                style={{
                  left: imgOffset.x,
                  top: imgOffset.y,
                  width: imgSize.w,
                  height: imgSize.h,
                  userSelect: "none",
                  ["WebkitUserDrag" as string]: "none",
                }}
                draggable={false}
                onLoad={handleImgLoad}
              />

              {/* 裁剪框 */}
              {imgLoaded && (
                <div
                  className="absolute cursor-move"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.w,
                    height: cropBox.h,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
                  }}
                  onMouseDown={handleCropMouseDown}
                >
                  {/* 金色边框 */}
                  <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(233,193,118,0.9)" }} />

                  {/* 九宫格参考线 */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                  </div>

                  {/* 四角装饰点 */}
                  {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                    <div
                      key={corner}
                      className="absolute w-3 h-3 pointer-events-none"
                      style={{
                        left: corner.includes("w") ? -1 : "auto",
                        right: corner.includes("e") ? -1 : "auto",
                        top: corner.includes("n") ? -1 : "auto",
                        bottom: corner.includes("s") ? -1 : "auto",
                      }}
                    >
                      <div className="absolute" style={{
                        width: corner.includes("w") || corner.includes("e") ? 2 : 8,
                        height: corner.includes("n") || corner.includes("s") ? 2 : 8,
                        background: "#e9c176",
                        left: corner.includes("w") ? 0 : "auto",
                        right: corner.includes("e") ? 0 : "auto",
                        top: corner.includes("n") ? 0 : "auto",
                        bottom: corner.includes("s") ? 0 : "auto",
                      }} />
                      <div className="absolute" style={{
                        width: corner.includes("w") || corner.includes("e") ? 8 : 2,
                        height: corner.includes("n") || corner.includes("s") ? 8 : 2,
                        background: "#e9c176",
                        left: corner.includes("w") ? 0 : "auto",
                        right: corner.includes("e") ? 0 : "auto",
                        top: corner.includes("n") ? 0 : "auto",
                        bottom: corner.includes("s") ? 0 : "auto",
                      }} />
                    </div>
                  ))}
                </div>
              )}

              {/* 提示 */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white/70 font-song bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                拖拽选择裁剪区域 · 比例固定为 16:9
              </div>
            </div>

            <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(193,155,77,0.15)" }}>
              <button onClick={cancelCrop}
                className="px-4 py-2 rounded-lg text-sm font-song text-gold-200/60 hover:text-gold-200 transition-all"
                style={{ border: "1px solid rgba(193,155,77,0.2)" }}>
                取消
              </button>
              <button onClick={confirmCrop}
                className="px-5 py-2 rounded-lg text-sm font-song tracking-wider transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c19b4d 0%, #e9c176 100%)", color: "#1a1814" }}>
                确认裁剪
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 保存到预设弹窗 */}
      {showSavePreset && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowSavePreset(false)} />
          <div className="relative z-[310] w-[360px] rounded-xl p-5"
            style={{ background: "#1a1814", border: "1px solid rgba(193,155,77,0.25)" }}
          >
            <h4 className="font-song text-gold-100 tracking-wider mb-4">保存为预设</h4>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="输入预设名称..."
              className="w-full px-3 py-2 rounded-lg bg-ink-900 text-gold-100 font-song text-sm outline-none mb-4"
              style={{ border: "1px solid rgba(193,155,77,0.2)" }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSavePreset(false)}
                className="px-4 py-2 rounded-lg text-sm font-song text-gold-200/60 hover:text-gold-200 transition-all"
                style={{ border: "1px solid rgba(193,155,77,0.2)" }}>
                取消
              </button>
              <button onClick={handleSavePreset}
                className="px-4 py-2 rounded-lg text-sm font-song transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c19b4d 0%, #e9c176 100%)", color: "#1a1814" }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
