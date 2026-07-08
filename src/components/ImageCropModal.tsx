import { useRef, useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

/* ================================================================
 *  图片裁剪弹窗 v2
 *  - 支持自由比例裁剪 + 预设比例（3:4、1:1、16:9、4:3）
 *  - 可拖拽移动裁剪框
 *  - 可拖拽四角调整裁剪框大小
 *  - 返回裁剪后的 base64
 * ================================================================ */

interface ImageCropModalProps {
  file: File;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
  /** 裁剪比例：null=自由比例，number=固定比例（宽/高） */
  ratio?: number | null;
  /** 比例预设列表 */
  ratioPresets?: { label: string; value: number | null }[];
  /** 标题文字 */
  title?: string;
}

const DEFAULT_PRESETS = [
  { label: "自由", value: null },
  { label: "默认卡片比例", value: 3 / 4 },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
];

export default function ImageCropModal({
  file,
  onConfirm,
  onCancel,
  ratio = null,
  ratioPresets = DEFAULT_PRESETS,
  title = "裁剪照片",
}: ImageCropModalProps) {
  useBodyScrollLock(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgSrc, setImgSrc] = useState("");
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // 当前裁剪比例
  const [cropRatio, setCropRatio] = useState<number | null>(ratio);

  // 裁剪框在图片上的坐标（相对于原始图片像素）
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);

  // 显示尺寸（图片在屏幕上的渲染尺寸）
  const [dispW, setDispW] = useState(0);
  const [dispH, setDispH] = useState(0);
  const [dispOffsetX, setDispOffsetX] = useState(0);
  const [dispOffsetY, setDispOffsetY] = useState(0);

  // 拖拽状态：move=移动裁剪框, nw/ne/sw/se=四角缩放
  const [dragMode, setDragMode] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  // 加载图片
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 计算显示尺寸
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imgNatural.w) return;

    const rect = container.getBoundingClientRect();
    const maxW = rect.width - 40;
    const maxH = rect.height - 40;
    const scale = Math.min(maxW / imgNatural.w, maxH / imgNatural.h, 1);
    const dw = imgNatural.w * scale;
    const dh = imgNatural.h * scale;
    setDispW(dw);
    setDispH(dh);
    setDispOffsetX((rect.width - dw) / 2);
    setDispOffsetY((rect.height - dh) / 2);
  }, [imgNatural]);

  // 图片加载后初始化裁剪框
  const initCrop = useCallback((img: HTMLImageElement) => {
    const { naturalWidth: nw, naturalHeight: nh } = img;
    setImgNatural({ w: nw, h: nh });

    const r = cropRatio;
    let cw: number, ch: number;
    if (r === null) {
      // 自由比例：取图片的 80% 区域
      cw = nw * 0.8;
      ch = nh * 0.8;
    } else {
      if (nw / nh >= r) {
        ch = nh * 0.8;
        cw = ch * r;
      } else {
        cw = nw * 0.8;
        ch = cw / r;
      }
    }

    setCropW(cw);
    setCropH(ch);
    setCropX((nw - cw) / 2);
    setCropY((nh - ch) / 2);
  }, [cropRatio]);

  // 裁剪框在屏幕上的位置
  const screenCropX = dispOffsetX + (cropX / imgNatural.w) * dispW;
  const screenCropY = dispOffsetY + (cropY / imgNatural.h) * dispH;
  const screenCropW = (cropW / imgNatural.w) * dispW;
  const screenCropH = (cropH / imgNatural.h) * dispH;

  // --- 移动裁剪框 ---
  const handleMoveDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode("move");
    dragStart.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY, cw: cropW, ch: cropH };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropX, cropY, cropW, cropH]);

  // --- 四角缩放 ---
  const handleCornerDown = useCallback((corner: "nw" | "ne" | "sw" | "se") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(corner);
    dragStart.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY, cw: cropW, ch: cropH };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropX, cropY, cropW, cropH]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragMode) return;

    const dxImg = (e.clientX - dragStart.current.x) / dispW * imgNatural.w;
    const dyImg = (e.clientY - dragStart.current.y) / dispH * imgNatural.h;
    const { cx, cy, cw, ch } = dragStart.current;

    if (dragMode === "move") {
      let nx = cx + dxImg;
      let ny = cy + dyImg;
      nx = Math.max(0, Math.min(imgNatural.w - cropW, nx));
      ny = Math.max(0, Math.min(imgNatural.h - cropH, ny));
      setCropX(nx);
      setCropY(ny);
      return;
    }

    // 四角缩放
    let newW = cw;
    let newH = ch;
    let newX = cx;
    let newY = cy;

    if (dragMode === "se") {
      newW = Math.max(40, cw + dxImg);
      newH = Math.max(40, ch + dyImg);
      if (cropRatio !== null) {
        newH = newW / cropRatio;
      }
    } else if (dragMode === "sw") {
      newW = Math.max(40, cw - dxImg);
      newH = Math.max(40, ch + dyImg);
      if (cropRatio !== null) {
        newH = newW / cropRatio;
        newX = cx + cw - newW;
      } else {
        newX = cx + cw - newW;
      }
    } else if (dragMode === "ne") {
      newW = Math.max(40, cw + dxImg);
      newH = Math.max(40, ch - dyImg);
      if (cropRatio !== null) {
        newH = newW / cropRatio;
      } else {
        newY = cy + ch - newH;
      }
    } else if (dragMode === "nw") {
      newW = Math.max(40, cw - dxImg);
      newH = Math.max(40, ch - dyImg);
      if (cropRatio !== null) {
        newH = newW / cropRatio;
      }
      newX = cx + cw - newW;
      newY = cy + ch - newH;
    }

    // 限制不超出图片范围
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    if (newX + newW > imgNatural.w) newW = imgNatural.w - newX;
    if (newY + newH > imgNatural.h) newH = imgNatural.h - newY;

    // 保持比例
    if (cropRatio !== null) {
      if (dragMode === "nw" || dragMode === "sw") {
        newX = cx + cw - newW;
      }
      if (dragMode === "nw" || dragMode === "ne") {
        newY = cy + ch - newH;
      }
      // 二次限制
      newX = Math.max(0, Math.min(newX, imgNatural.w - newW));
      newY = Math.max(0, Math.min(newY, imgNatural.h - newH));
    }

    setCropW(newW);
    setCropH(newH);
    setCropX(newX);
    setCropY(newY);
  }, [dragMode, dispW, dispH, imgNatural, cropW, cropH, cropRatio]);

  const handlePointerUp = useCallback(() => {
    setDragMode(null);
  }, []);

  // 切换比例
  const handleRatioChange = useCallback((newRatio: number | null) => {
    setCropRatio(newRatio);
    if (!imgNatural.w) return;

    let cw: number, ch: number;
    if (newRatio === null) {
      cw = imgNatural.w * 0.8;
      ch = imgNatural.h * 0.8;
    } else {
      if (imgNatural.w / imgNatural.h >= newRatio) {
        ch = imgNatural.h * 0.8;
        cw = ch * newRatio;
      } else {
        cw = imgNatural.w * 0.8;
        ch = cw / newRatio;
      }
    }
    setCropW(cw);
    setCropH(ch);
    setCropX((imgNatural.w - cw) / 2);
    setCropY((imgNatural.h - ch) / 2);
  }, [imgNatural]);

  // 确认裁剪
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 输出尺寸：保持裁剪比例
    const outW = Math.min(800, Math.round(cropW));
    const outH = Math.round(outW * (cropH / cropW));
    canvas.width = outW;
    canvas.height = outH;

    ctx.drawImage(
      imgRef.current,
      cropX, cropY, cropW, cropH,
      0, 0, outW, outH
    );

    const result = canvas.toDataURL("image/jpeg", 0.85);
    onConfirm(result);
  }, [cropX, cropY, cropW, cropH, onConfirm]);

  const ratioLabel = cropRatio === null ? "自由" : (() => {
    const gcd = (a: number, b: number): number => b < 0.001 ? a : gcd(b, a % b);
    // 尝试找到常见的比例表示
    for (const p of ratioPresets) {
      if (p.value !== null && Math.abs(p.value - cropRatio) < 0.01) return p.label;
    }
    const g = gcd(cropRatio, 1);
    return `${Math.round(cropRatio / g)}:${Math.round(1 / g)}`;
  })();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative bg-ink-900 rounded-xl border border-gold-400/20 shadow-2xl w-[90vw] max-w-[550px] h-[85vh] max-h-[650px] flex flex-col overflow-hidden">
        {/* 标题 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gold-400/10">
          <span className="text-sm font-song text-gold-200">{title}</span>
          <span className="text-[10px] font-song text-gold-200/40">拖拽移动 · 拖角调整大小 · {ratioLabel}</span>
          <button onClick={onCancel} className="text-gold-200/50 hover:text-gold-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 比例预设按钮 */}
        <div className="flex items-center justify-center gap-2 px-5 py-2 border-b border-gold-400/10">
          {ratioPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => handleRatioChange(p.value)}
              className={`px-3 py-1 rounded-full text-[11px] font-song transition-all ${
                cropRatio === p.value
                  ? "bg-gold-400/30 text-gold-200 border border-gold-400/50"
                  : "text-gold-200/50 border border-gold-400/10 hover:border-gold-400/30 hover:text-gold-200/70"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 裁剪区域 */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-black/50"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {imgSrc && (
            <img
              ref={(el) => {
                imgRef.current = el;
                if (el && el.complete && imgNatural.w === 0) initCrop(el);
              }}
              src={imgSrc}
              alt="裁剪"
              className="absolute select-none pointer-events-none"
              style={{
                left: dispOffsetX,
                top: dispOffsetY,
                width: dispW,
                height: dispH,
              }}
              onLoad={(e) => initCrop(e.currentTarget)}
              draggable={false}
            />
          )}

          {/* 半透明遮罩 */}
          {dispW > 0 && (
            <>
              {/* 上 */}
              <div className="absolute bg-black/60" style={{
                left: 0, right: 0, top: 0,
                height: screenCropY,
              }} />
              {/* 下 */}
              <div className="absolute bg-black/60" style={{
                left: 0, right: 0, bottom: 0,
                top: screenCropY + screenCropH,
              }} />
              {/* 左 */}
              <div className="absolute bg-black/60" style={{
                left: 0, top: screenCropY,
                width: screenCropX, height: screenCropH,
              }} />
              {/* 右 */}
              <div className="absolute bg-black/60" style={{
                right: 0, top: screenCropY,
                left: screenCropX + screenCropW, height: screenCropH,
              }} />

              {/* 裁剪框 */}
              <div
                className="absolute border-2 border-gold-400 cursor-move"
                style={{
                  left: screenCropX,
                  top: screenCropY,
                  width: screenCropW,
                  height: screenCropH,
                }}
                onPointerDown={handleMoveDown}
              >
                {/* 三分线 */}
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gold-400/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gold-400/20" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-gold-400/20" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-gold-400/20" />

                {/* 四角拖拽手柄 */}
                {/* 左上 */}
                <div
                  className="absolute -top-2 -left-2 w-5 h-5 cursor-nw-resize z-10"
                  onPointerDown={handleCornerDown("nw")}
                >
                  <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-gold-300" />
                </div>
                {/* 右上 */}
                <div
                  className="absolute -top-2 -right-2 w-5 h-5 cursor-ne-resize z-10"
                  onPointerDown={handleCornerDown("ne")}
                >
                  <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-gold-300" />
                </div>
                {/* 左下 */}
                <div
                  className="absolute -bottom-2 -left-2 w-5 h-5 cursor-sw-resize z-10"
                  onPointerDown={handleCornerDown("sw")}
                >
                  <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-gold-300" />
                </div>
                {/* 右下 */}
                <div
                  className="absolute -bottom-2 -right-2 w-5 h-5 cursor-se-resize z-10"
                  onPointerDown={handleCornerDown("se")}
                >
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-gold-300" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gold-400/10">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded text-xs font-song text-gold-200/60 hover:text-gold-200 border border-gold-400/20 hover:border-gold-400/40 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-1.5 rounded text-xs font-song bg-gold-400/20 text-gold-200 hover:bg-gold-400/30 transition-all flex items-center gap-1.5"
          >
            <Check size={14} />确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
}
