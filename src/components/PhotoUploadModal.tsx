import { useState, useRef, useCallback, useEffect } from "react";
import { createPhoto, uploadToStorage } from "../lib/supabase";
import { useStore } from "../store/useStore";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import LoadingOverlay from "./LoadingOverlay";

/* ================================================================
 *  照片上传弹窗（社员用）
 *  - 选择图片 → 自由裁剪 → 填写名称 → 上传
 *  - 无列表/删除/编辑功能
 * ================================================================ */

interface Props {
  onClose: () => void;
}

interface CropState {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function PhotoUploadModal({ onClose }: Props) {
  useBodyScrollLock(true);
  const loadWallPhotos = useStore((s) => s.loadWallPhotos);

  const [formName, setFormName] = useState("");
  const [formSrc, setFormSrc] = useState("");
  const [formRatio, setFormRatio] = useState("free"); // 实际裁剪比例
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 裁剪状态
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState<CropState>({ x: 0, y: 0, w: 200, h: 150 });
  const [cropAction, setCropAction] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  const cropStart = useRef({ mx: 0, my: 0, rect: cropRect });
  const cropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 裁剪逻辑 ==========
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropFile(url);
    setFormSrc("");
    setFormRatio("free");
  };

  const handleCropImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = cropRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const dw = Math.min(cw * 0.8, img.clientWidth * 0.8);
    const dh = Math.min(ch * 0.8, img.clientHeight * 0.8);
    setCropImg(img);
    setCropRect({ x: (cw - dw) / 2, y: (ch - dh) / 2, w: dw, h: dh });
    img.style.width = `${cw}px`;
    img.style.height = `${ch}px`;
    img.style.objectFit = "contain";
  };

  const handleCropMouseDown = (e: React.MouseEvent, action: "move" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    setCropAction(action);
    cropStart.current = { mx: e.clientX, my: e.clientY, rect: { ...cropRect } };
  };

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!cropAction || !cropRef.current) return;
      const cw = cropRef.current.clientWidth;
      const ch = cropRef.current.clientHeight;
      const dx = e.clientX - cropStart.current.mx;
      const dy = e.clientY - cropStart.current.my;
      const s = cropStart.current.rect;
      let next = { ...s };

      if (cropAction === "move") {
        next.x = Math.max(0, Math.min(cw - s.w, s.x + dx));
        next.y = Math.max(0, Math.min(ch - s.h, s.y + dy));
      } else if (cropAction === "se") {
        next.w = Math.max(60, Math.min(cw - s.x, s.w + dx));
        next.h = Math.max(60, Math.min(ch - s.y, s.h + dy));
      } else if (cropAction === "sw") {
        next.x = Math.max(0, s.x + dx);
        next.w = Math.max(60, s.w - dx);
        next.h = Math.max(60, Math.min(ch - s.y, s.h + dy));
      } else if (cropAction === "ne") {
        next.w = Math.max(60, Math.min(cw - s.x, s.w + dx));
        next.y = Math.max(0, s.y + dy);
        next.h = Math.max(60, s.h - dy);
      } else if (cropAction === "nw") {
        next.x = Math.max(0, s.x + dx);
        next.y = Math.max(0, s.y + dy);
        next.w = Math.max(60, s.w - dx);
        next.h = Math.max(60, s.h - dy);
      }
      setCropRect(next);
    },
    [cropAction]
  );

  const handleCropMouseUp = useCallback(() => setCropAction(null), []);

  useEffect(() => {
    if (cropAction) {
      window.addEventListener("mousemove", handleCropMouseMove);
      window.addEventListener("mouseup", handleCropMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleCropMouseMove);
        window.removeEventListener("mouseup", handleCropMouseUp);
      };
    }
  }, [cropAction, handleCropMouseMove, handleCropMouseUp]);

  // 裁剪确认
  const handleCropConfirm = () => {
    if (!cropImg || !cropRef.current) return;
    const scaleX = cropImg.naturalWidth / cropImg.clientWidth;
    const scaleY = cropImg.naturalHeight / cropImg.clientHeight;
    const canvas = document.createElement("canvas");
    const maxPx = 1200;
    const outW = Math.round(cropRect.w * scaleX);
    const outH = Math.round(cropRect.h * scaleY);
    const scale = Math.min(maxPx / outW, maxPx / outH, 1);
    canvas.width = Math.round(outW * scale);
    canvas.height = Math.round(outH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(cropImg, cropRect.x * scaleX, cropRect.y * scaleY, outW, outH, 0, 0, canvas.width, canvas.height);
    setFormSrc(canvas.toDataURL("image/jpeg", 0.92));

    // 计算裁剪比例：匹配标准比例或标记为 free
    const ratio = outW / outH;
    const stdRatios: [string, number][] = [
      ["1:1", 1], ["4:3", 4/3], ["3:4", 3/4], ["16:9", 16/9], ["3:2", 3/2], ["2:3", 2/3],
    ];
    let matched = "free";
    for (const [name, std] of stdRatios) {
      if (Math.abs(ratio - std) < 0.08) { matched = name; break; }
    }
    setFormRatio(matched);

    setCropFile(null);
    setCropImg(null);
  };

  // 上传
  const handleSave = async () => {
    if (!formName.trim() || !formSrc) return;
    setSaving(true);
    setError(null);
    try {
      // 将 base64 转为 Blob 并上传到 Storage（比存 base64 快得多）
      const res = await fetch(formSrc);
      const blob = await res.blob();
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const url = await uploadToStorage(file, "member-photos", "wall-photos");

      if (!url) {
        setError("上传失败，请稍后再试");
        setSaving(false);
        return;
      }

      // 计算实际裁剪比例
      const ratio = formRatio || "free";

      const id = await createPhoto({
        name: formName.trim(),
        src: url,
        sort_order: 0,
        is_active: true,
        ratio,
      });
      if (!id) {
        setError("保存失败，请稍后再试");
        setSaving(false);
        return;
      }
      await loadWallPhotos();
      setDone(true);
    } catch (e) {
      setError("上传出错: " + (e instanceof Error ? e.message : String(e)));
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <LoadingOverlay show={saving} message="正在上传照片..." />
      <div
        className="relative w-full max-w-[560px] max-h-[90vh] mx-4 flex flex-col rounded-lg overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1510, #0f0d0a)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-400/20">
          <h2 className="font-calligraphy text-gold-200 text-lg tracking-widest">上传照片</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gold-400/20 text-gold-200/40 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4" style={{ color: "#e9c176" }}>✓</div>
              <p className="font-song text-gold-200 text-sm mb-6">照片上传成功！</p>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded text-sm font-song border border-gold-400/30 text-gold-200/70 hover:text-gold-200 hover:border-gold-400/50 transition-colors"
              >
                关闭
              </button>
            </div>
          ) : (
            <>
              {/* 名称 */}
              <div className="mb-4">
                <label className="block font-song text-gold-200/60 text-sm mb-1.5">照片名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入照片名称"
                  className="w-full px-4 py-2.5 rounded font-song text-sm border border-gold-400/20 bg-ink-900/60 text-gold-200 placeholder:text-gold-200/30 outline-none focus:border-gold-400/40"
                />
              </div>

              {/* 上传按钮 */}
              {!cropFile && !formSrc && (
                <div className="mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 rounded border-2 border-dashed border-gold-400/25 bg-ink-900/40 flex flex-col items-center justify-center gap-2 hover:border-gold-400/50 hover:bg-ink-900/60 transition-all cursor-pointer"
                  >
                    <svg className="w-10 h-10 text-gold-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="font-song text-sm text-gold-200/40">点击选择图片</span>
                    <span className="font-song text-xs text-gold-200/20">支持 JPG、PNG</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}

              {/* 裁剪区域 */}
              {cropFile && (
                <div className="mb-4">
                  <label className="block font-song text-gold-200/60 text-sm mb-1.5">拖拽裁剪框调整区域</label>
                  <div
                    ref={cropRef}
                    className="relative w-full rounded border border-gold-400/20 overflow-hidden select-none"
                    style={{ height: 360, background: "#0a0806" }}
                  >
                    <img src={cropFile} onLoad={handleCropImgLoad} className="absolute inset-0 pointer-events-none" draggable={false} />
                    {/* 裁剪框 + box-shadow 遮罩 */}
                    <div
                      className="absolute border-2 border-white/80"
                      style={{
                        left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h,
                        cursor: "move",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
                      }}
                      onMouseDown={(e) => handleCropMouseDown(e, "move")}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
                      </div>
                      {(["nw", "ne", "sw", "se"] as const).map((pos) => (
                        <div
                          key={pos}
                          className="absolute w-5 h-5 bg-white/80 rounded-full border border-black/30"
                          style={{
                            cursor: pos === "nw" || pos === "se" ? "nwse-resize" : "nesw-resize",
                            top: pos.includes("n") ? -10 : "auto",
                            bottom: pos.includes("s") ? -10 : "auto",
                            left: pos.includes("w") ? -10 : "auto",
                            right: pos.includes("e") ? -10 : "auto",
                          }}
                          onMouseDown={(e) => handleCropMouseDown(e, pos)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-5 rounded text-sm font-song border border-gold-400/25 text-gold-200/60 hover:text-gold-200 hover:border-gold-400/45 transition-all active:scale-[0.98]"
                    >
                      重新上传
                    </button>
                    <button
                      onClick={handleCropConfirm}
                      className="flex-1 py-2.5 rounded text-sm font-song transition-all active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #c49b30, #e9c176)", color: "#0f0a05", fontWeight: 600 }}
                    >
                      确认裁剪
                    </button>
                  </div>
                </div>
              )}

              {/* 已裁剪预览 */}
              {formSrc && !cropFile && (
                <div className="mb-4">
                  <label className="block font-song text-gold-200/60 text-sm mb-1.5">
                    预览 {formRatio !== "free" && <span className="text-gold-400/70">· {formRatio}</span>}
                    {formRatio === "free" && <span className="text-gold-200/30"> · 自由比例</span>}
                  </label>
                  <div className="w-full h-48 rounded border border-gold-400/20 overflow-hidden bg-ink-900/40">
                    <img src={formSrc} className="w-full h-full object-contain" alt="预览" />
                  </div>
                  <button
                    onClick={() => { setFormSrc(""); setCropFile(null); }}
                    className="mt-2 text-xs font-song text-gold-200/40 hover:text-gold-200/70 transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="mb-3 px-4 py-2 rounded text-sm font-song border" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
                  {error}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !formName.trim() || !formSrc}
                  className="flex-1 py-2.5 rounded text-sm font-song transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #c49b30, #e9c176)",
                    color: "#0f0a05",
                    fontWeight: 600,
                    opacity: saving || !formName.trim() || !formSrc ? 0.5 : 1,
                    cursor: saving || !formName.trim() || !formSrc ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "上传中..." : "上传"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded text-sm font-song border border-gold-400/20 text-gold-200/50 hover:text-gold-200 hover:border-gold-400/40 transition-colors"
                >
                  取消
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
