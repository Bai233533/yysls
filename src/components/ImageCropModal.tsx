import { useRef, useState, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

/* ================================================================
 *  图片裁剪弹窗
 *  - 默认 3:4 比例（匹配成员卡片）
 *  - 可拖拽选择裁剪区域
 *  - 返回裁剪后的 base64
 * ================================================================ */

interface ImageCropModalProps {
  file: File;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

const CROP_RATIO = 3 / 4; // 默认3:4（竖版卡片）

export default function ImageCropModal({ file, onConfirm, onCancel }: ImageCropModalProps) {
  useBodyScrollLock(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgSrc, setImgSrc] = useState("");
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

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

  // 拖拽状态
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  // 加载图片
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 图片加载后初始化裁剪框
  const initCrop = useCallback((img: HTMLImageElement) => {
    const { naturalWidth: nw, naturalHeight: nh } = img;
    setImgNatural({ w: nw, h: nh });

    // 计算最大裁剪框（保持3:4比例）
    let cw: number, ch: number;
    if (nw / nh >= CROP_RATIO) {
      // 图片较宽，以高度为基准
      ch = nh;
      cw = ch * CROP_RATIO;
    } else {
      // 图片较高，以宽度为基准
      cw = nw;
      ch = cw / CROP_RATIO;
    }

    setCropW(cw);
    setCropH(ch);
    setCropX((nw - cw) / 2);
    setCropY((nh - ch) / 2);
  }, []);

  // 计算显示尺寸
  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !imgNatural.w) return;

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

  // 裁剪框在屏幕上的位置
  const screenCropX = dispOffsetX + (cropX / imgNatural.w) * dispW;
  const screenCropY = dispOffsetY + (cropY / imgNatural.h) * dispH;
  const screenCropW = (cropW / imgNatural.w) * dispW;
  const screenCropH = (cropH / imgNatural.h) * dispH;

  // 拖拽裁剪框
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cropX, cropY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - dragStart.current.x) / dispW * imgNatural.w;
    const dy = (e.clientY - dragStart.current.y) / dispH * imgNatural.h;
    let nx = dragStart.current.cx + dx;
    let ny = dragStart.current.cy + dy;
    // 限制范围
    nx = Math.max(0, Math.min(imgNatural.w - cropW, nx));
    ny = Math.max(0, Math.min(imgNatural.h - cropH, ny));
    setCropX(nx);
    setCropY(ny);
  }, [dragging, dispW, dispH, imgNatural, cropW, cropH]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // 确认裁剪
  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 输出尺寸：保持裁剪比例，最大800px宽
    const outW = 800;
    const outH = Math.round(outW / CROP_RATIO);
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative bg-ink-900 rounded-xl border border-gold-400/20 shadow-2xl w-[90vw] max-w-[500px] h-[80vh] max-h-[600px] flex flex-col overflow-hidden">
        {/* 标题 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gold-400/10">
          <span className="text-sm font-song text-gold-200">裁剪照片</span>
          <span className="text-[10px] font-song text-gold-200/40">拖拽选择展示区域 · 3:4比例</span>
          <button onClick={onCancel} className="text-gold-200/50 hover:text-gold-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black/50">
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
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* 四角标记 */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-gold-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-gold-300" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-gold-300" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-gold-300" />
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
