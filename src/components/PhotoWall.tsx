import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import PhotoManager from "./PhotoManager";
import PhotoUploadModal from "./PhotoUploadModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { usePermission } from "../hooks/usePermission";

/* ================================================================
 *  桶形球体照片墙 (Barrel Globe)
 *  - 照片排列在桶形球面上：中间行大、顶底行小
 *  - 水平圆柱面 + 垂直桶形 = 球体视觉
 *  - 拖拽旋转 + 惯性 + 自动旋转
 * ================================================================ */

// ========== 参数 ==========
const CYL_R = 520;            // 中间行半径
const MAX_ROWS = 5;           // 最大行数
const BARREL = 0.72;          // 桶形系数（越小顶底越窄）
const AUTO_SPEED = 0.03;      // 自动旋转速度（度/帧）
const FRICTION = 0.94;        // 惯性衰减
const DRAG_SENS = 0.25;       // 拖拽灵敏度
const BATCH_SIZE = 20;        // 每帧批量DOM数量
const BATCH_SIZE_MOBILE = 8;  // 移动端每帧批量数量（减少卡顿）

// 自适应配置
function getAdaptiveConfig(count: number) {
  if (count <= 3)   return { rows: 1, baseSize: 180, rowGap: 0 };
  if (count <= 6)   return { rows: 1, baseSize: 160, rowGap: 0 };
  if (count <= 10)  return { rows: 2, baseSize: 140, rowGap: 150 };
  if (count <= 18)  return { rows: 3, baseSize: 120, rowGap: 135 };
  if (count <= 28)  return { rows: 4, baseSize: 105, rowGap: 125 };
  return { rows: MAX_ROWS, baseSize: 90, rowGap: 115 };
}

// ========== 种子随机 ==========
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 比例
const RATIO_MAP: Record<string, number> = {
  "4:3": 4 / 3, "3:4": 3 / 4, "1:1": 1, "16:9": 16 / 9, "3:2": 3 / 2,
};

// 获取照片的数值比例
function getRatioValue(ratio: string | undefined, idx: number): number {
  if (ratio === "free") return 0.6 + seededRand(idx * 7 + 3) * 1.0;
  return RATIO_MAP[ratio || "4:3"] || 4 / 3;
}

// 严格按用户裁剪比例计算尺寸（不改变比例，只微调整体大小）
function photoSize(ratio: string | undefined, idx: number, baseSize: number): { w: number; h: number } {
  const r = getRatioValue(ratio, idx);
  const scale = 0.92 + seededRand(idx * 3 + 1) * 0.16;
  if (r >= 1) {
    const w = baseSize * scale;
    return { w, h: w / r };
  } else {
    const h = baseSize * scale;
    return { w: h * r, h };
  }
}

// 按比例排序：横版 → 方形 → 竖版，同类型内按比例值排列
function sortPhotosByRatio(photos: { src: string; title: string; ratio?: string; media_type?: string; cover_url?: string }[]) {
  return [...photos].sort((a, b) => {
    const ra = getRatioValue(a.ratio, 0);
    const rb = getRatioValue(b.ratio, 0);
    const scoreA = ra > 1.05 ? 0 : ra < 0.95 ? 2 : 1;
    const scoreB = rb > 1.05 ? 0 : rb < 0.95 ? 2 : 1;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return ra - rb;
  });
}

// 桶形半径：中间行最大，顶底行缩小
function barrelRadius(row: number, rows: number): number {
  if (rows <= 1) return CYL_R;
  const mid = (rows - 1) / 2;
  const norm = Math.abs(row - mid) / mid;
  return CYL_R * (1 - (1 - BARREL) * norm * norm);
}

// ========== 网格 ==========
interface Cell {
  theta: number;
  row: number;
  jitterY: number;
  tiltDeg: number;
  scaleOff: number;
}

function buildGrid(photoCount: number): Cell[] {
  const { rows } = getAdaptiveConfig(photoCount);
  const cells: Cell[] = [];

  // 根据照片数量决定弧度展开范围：少照片=小弧度（紧凑），多照片=大弧度（铺满）
  const spreadFactor = Math.min(1, photoCount / 30); // 30张以上才铺满360°
  const maxArc = Math.PI * 0.8 * spreadFactor + Math.PI * 0.4; // 最小弧度0.4π，最大0.8π

  // 按行分配照片
  const photosPerRow = Math.ceil(photoCount / rows);
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const count = Math.min(photosPerRow, photoCount - idx);
    for (let c = 0; c < count; c++) {
      if (idx >= photoCount) break;
      // 在限定弧度内均匀分布，居中排列
      const theta = count === 1 ? 0 : -maxArc + (2 * maxArc * c) / (count - 1);
      cells.push({
        theta,
        row: r,
        jitterY: (seededRand(idx * 13 + 2) - 0.5) * 20,
        tiltDeg: (seededRand(idx * 17 + 5) - 0.5) * 8,
        scaleOff: (seededRand(idx * 19 + 9) - 0.5) * 0.15,
      });
      idx++;
    }
  }
  return cells;
}

export default function PhotoWall() {
  const wallPhotos = useStore((s) => s.wallPhotos);
  const { showPhotoManager, showUploadButton, showMyPhotosButton, isLoggedIn } = usePermission();

  const sphereRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const rotY = useRef(0);
  const velY = useRef(0);
  const drag = useRef(false);
  const hover = useRef(false);
  const lastX = useRef(0);

  const [lb, setLb] = useState<{ s: string; t: string; isVideo?: boolean } | null>(null);
  const lbRef = useRef(false);
  const currentHoverVideo = useRef<HTMLVideoElement | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [managerDefaultMode, setManagerDefaultMode] = useState<"list" | "my-photos">("list");
  const [showUpload, setShowUpload] = useState(false);
  const [wallReady, setWallReady] = useState(false);

  const handleDownload = useCallback((url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = title || "photo";
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  useBodyScrollLock(lb !== null);

  // 按比例排序后展示（横版→方形→竖版）
  const sortedPhotos = useMemo(() => sortPhotosByRatio(wallPhotos), [wallPhotos]);
  const grid = useMemo(() => buildGrid(sortedPhotos.length), [sortedPhotos.length]);
  const config = useMemo(() => getAdaptiveConfig(sortedPhotos.length), [sortedPhotos.length]);
  const yOff = ((config.rows - 1) * config.rowGap) / 2;

  // 构建 DOM
  useEffect(() => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    sphere.innerHTML = "";
    setWallReady(false);

    const { rows, baseSize, rowGap } = config;
    const items: { el: HTMLDivElement; media: HTMLImageElement | HTMLVideoElement }[] = [];

    grid.forEach((cell, i) => {
      const photo = sortedPhotos[i % sortedPhotos.length];
      if (!photo) return;
      const { theta, row, jitterY, tiltDeg, scaleOff } = cell;

      // 桶形半径：中间行大，顶底行小
      const r = barrelRadius(row, rows);
      const x = r * Math.sin(theta);
      const z = r * Math.cos(theta);
      const y = row * rowGap - yOff + jitterY;
      const ry = (theta * 180) / Math.PI;

      // 严格按用户裁剪比例计算尺寸
      const base = photoSize(photo.ratio, i, baseSize);
      const s = 1 + scaleOff;
      const w = base.w * s;
      const h = base.h * s;

      const el = document.createElement("div");
      el.className = "pw-item";
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.opacity = "0";
      el.style.transform =
        `translate3d(${x - w / 2}px, ${y - h / 2}px, ${z}px) rotateY(${ry}deg) rotateZ(${tiltDeg}deg)`;

      const isVideo = photo.media_type === "video";
      const hasCover = isVideo && photo.cover_url;
      let media: HTMLImageElement | HTMLVideoElement;

      if (isVideo && !hasCover) {
        // 无封面视频：用 video 元素，加载后自动播放
        const vid = document.createElement("video");
        vid.src = photo.src;
        vid.preload = "auto";
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.autoplay = true;
        vid.draggable = false;
        vid.style.width = "100%";
        vid.style.height = "100%";
        vid.style.objectFit = "contain";
        vid.style.backgroundColor = "#0a0a0a";
        vid.style.pointerEvents = "none";
        vid.dataset.pwVideo = "1";
        // 加载完成后自动播放
        vid.addEventListener("loadeddata", () => {
          vid.currentTime = 0.1;
          vid.play().catch(() => {});
        }, { once: true });
        media = vid;
      } else {
        // 图片 或 有封面的视频：用 img 元素
        const img = document.createElement("img");
        img.src = hasCover ? photo.cover_url! : photo.src;
        img.alt = photo.title;
        img.loading = "lazy";
        img.decoding = "async";
        img.draggable = false;
        media = img;
      }

      media.onload = () => {
        el.style.transition = "opacity 0.4s ease";
        el.style.opacity = "1";
      };
      media.onerror = () => {
        el.style.transition = "opacity 0.3s ease";
        el.style.opacity = "0.5";
      };

      const lbl = document.createElement("span");
      lbl.className = "pw-lbl";
      lbl.textContent = photo.title;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setLb({ s: photo.src, t: photo.title, isVideo });
        lbRef.current = true;
      });

      el.append(media, lbl);
      items.push({ el, media });
    });

    // 批量插入（移动端每批更少，减少卡顿）
    const isMob = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const batchSize = isMob ? BATCH_SIZE_MOBILE : BATCH_SIZE;
    let idx = 0;
    const batchAppend = () => {
      const end = Math.min(idx + batchSize, items.length);
      const frag = document.createDocumentFragment();
      for (let i = idx; i < end; i++) {
        frag.appendChild(items[i].el);
      }
      sphere.appendChild(frag);
      idx = end;
      if (idx < items.length) {
        requestAnimationFrame(batchAppend);
      } else {
        setWallReady(true);
      }
    };
    requestAnimationFrame(batchAppend);

    return () => {
      items.forEach(({ media }) => { media.onload = null; media.onerror = null; });
    };
  }, [grid, config, yOff, sortedPhotos]);

  // 动画循环
  const animate = useCallback(() => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    if (lbRef.current) {
      velY.current = 0;
      return;
    }
    if (!drag.current && !hover.current) rotY.current += AUTO_SPEED;
    if (!drag.current) {
      velY.current *= FRICTION;
      rotY.current += velY.current;
    }
    sphere.style.transform = `rotateY(${rotY.current}deg)`;
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  useEffect(() => {
    if (!lb) {
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
  }, [lb, animate]);

  // 视频悬停自动播放：用 pointermove + elementsFromPoint 检测鼠标下的视频
  useEffect(() => {
    const section = document.getElementById("photowall");
    if (!section) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (lbRef.current || drag.current) return;
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const videoEl = elements.find((el): el is HTMLVideoElement =>
        el instanceof HTMLVideoElement && el.dataset.pwVideo === "1"
      );

      if (videoEl && videoEl !== currentHoverVideo.current) {
        // 移入新视频：暂停旧的，播放新的
        if (currentHoverVideo.current && currentHoverVideo.current !== videoEl) {
          currentHoverVideo.current.pause();
        }
        currentHoverVideo.current = videoEl;
        videoEl.play().catch(() => {});
      } else if (!videoEl && currentHoverVideo.current) {
        // 移出所有视频：暂停
        currentHoverVideo.current.pause();
        currentHoverVideo.current = null;
      }
    };

    const handlePointerLeave = () => {
      if (currentHoverVideo.current) {
        currentHoverVideo.current.pause();
        currentHoverVideo.current = null;
      }
    };

    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  // 鼠标交互
  const md = useCallback((e: React.MouseEvent) => {
    if (e.button) return;
    drag.current = true;
    velY.current = 0;
    lastX.current = e.clientX;
    e.preventDefault();
  }, []);

  const mm = useCallback((e: React.MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    rotY.current += dx * DRAG_SENS;
    velY.current = dx * DRAG_SENS;
  }, []);

  const mu = useCallback(() => { drag.current = false; }, []);
  const me = useCallback(() => { hover.current = true; }, []);
  const ml = useCallback(() => { hover.current = false; drag.current = false; }, []);

  /* 触摸事件：移动端拖拽旋转 */
  const ts = useCallback((e: React.TouchEvent) => {
    if (lbRef.current) return;
    drag.current = true;
    velY.current = 0;
    lastX.current = e.touches[0].clientX;
    e.preventDefault();
  }, []);

  const tm = useCallback((e: React.TouchEvent) => {
    if (!drag.current) return;
    const x = e.touches[0].clientX;
    const dx = x - lastX.current;
    lastX.current = x;
    rotY.current += dx * DRAG_SENS;
    velY.current = dx * DRAG_SENS;
    e.preventDefault();
  }, []);

  const te = useCallback(() => { drag.current = false; }, []);

  useEffect(() => {
    const u = () => { drag.current = false; };
    window.addEventListener("mouseup", u);
    return () => window.removeEventListener("mouseup", u);
  }, []);

  return (
    <>
      <section
        id="photowall"
        className="relative w-full flex-shrink-0 flex items-center justify-center overflow-hidden select-none"
        style={{ height: "100vh", background: "#000" }}
      >
        {/* 星空背景 */}
        <div className="pw-stars">
          <div className="pw-shoot" />
          <div className="pw-shoot" />
          <div className="pw-shoot" />
        </div>
        <div className="pw-nebula" />

        {/* 标题 */}
        <div className="absolute top-[80px] left-10 z-20 pointer-events-none flex flex-col items-start">
          <h2 className="font-calligraphy text-3xl md:text-4xl tracking-[0.3em]" style={{ color: "#e9c176" }}>
            照片墙
          </h2>
          <p className="font-song text-[11px] mt-2 tracking-[0.15em] uppercase" style={{ color: "rgba(233,193,118,0.3)" }}>
            PHOTO WALL
          </p>
          <p className="font-song text-[10px] mt-1 tracking-[0.12em]" style={{ color: "rgba(233,193,118,0.25)" }}>
            拖拽旋转 · 点击查看
          </p>
        </div>

        {/* 操作按钮 */}
        {/* 管理员：管理照片墙按钮 */}
        {showPhotoManager && (
          <button
            onClick={() => { setManagerDefaultMode("list"); setShowManager(true); }}
            className="absolute top-[80px] right-10 z-20 px-6 py-2.5 rounded text-sm font-song active:scale-95 transition-all"
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            管理照片墙
          </button>
        )}
        {/* 社员：上传照片 + 我的照片按钮 */}
        {!showPhotoManager && showUploadButton && (
          <div className="absolute top-[80px] right-10 z-20 flex gap-2">
            {showMyPhotosButton && (
              <button
                onClick={() => { setManagerDefaultMode("my-photos"); setShowManager(true); }}
                className="px-5 py-2.5 rounded text-sm font-song active:scale-95 transition-all"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
              >
                我的照片
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 rounded text-sm font-song active:scale-95 transition-all"
              style={{
                background: "rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                backdropFilter: "blur(8px)",
              }}
            >
              上传照片
            </button>
          </div>
        )}

        {/* 桶形球体 */}
        <div
          className="pw-wrap"
          onMouseDown={md}
          onMouseMove={mm}
          onMouseUp={mu}
          onMouseEnter={me}
          onMouseLeave={ml}
          onTouchStart={ts}
          onTouchMove={tm}
          onTouchEnd={te}
          style={{ touchAction: "pan-y" }}
        >
          <div ref={sphereRef} className="pw-sphere" />
        </div>

        {/* 加载提示 */}
        {!wallReady && wallPhotos.length > 0 && (
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 font-song text-xs tracking-widest pointer-events-none"
            style={{ color: "rgba(233,193,118,0.45)" }}
          >
            载入光影中...
          </div>
        )}
      </section>

      {/* 放大弹窗 */}
      {lb && (
        <div className="pw-lb" onClick={() => { setLb(null); lbRef.current = false; }}>
          <div className="pw-lb-box" onClick={(e) => e.stopPropagation()}>
            {lb.isVideo ? (
              <video src={lb.s} controls autoPlay className="pw-lb-video" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8 }} />
            ) : (
              <img src={lb.s.replace("/400/400", "/900/900")} alt={lb.t} draggable={false} />
            )}
            <span className="pw-lb-t">{lb.t}</span>
            <button className="pw-lb-dl" onClick={() => handleDownload(lb.s, lb.t)} title="下载">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button className="pw-lb-x" onClick={() => { setLb(null); lbRef.current = false; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showManager && <PhotoManager onClose={() => setShowManager(false)} defaultMode={managerDefaultMode} />}
      {showUpload && <PhotoUploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
