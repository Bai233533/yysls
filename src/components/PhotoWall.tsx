import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import PhotoManager from "./PhotoManager";
import PhotoUploadModal from "./PhotoUploadModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { usePermission } from "../hooks/usePermission";

/* ================================================================
 *  3D 球形照片墙 (Sphere Photo Wall)
 *  - 桶形圆柱面：中间行大、顶底行小，形成球形视觉
 *  - 缓慢自动旋转 + 拖拽控制 + 惯性
 *  - 悬停暂停 + 弹窗暂停
 *  - 点击放大查看
 * ================================================================ */

// ========== 球形参数 ==========
const CYL_R = 480;           // 中间行半径
const ROWS = 5;              // 行数（奇数，中间行为最大半径）
const BASE_SIZE = 90;        // 基准尺寸
const ROW_GAP = 110;         // 行间距
const BARREL = 0.65;         // 桶形系数
const AUTO_SPEED = 0.04;     // 自动旋转速度
const FRICTION = 0.95;       // 惯性衰减
const DRAG_SENS = 0.25;      // 拖拽灵敏度
const BATCH_SIZE = 16;       // 每帧批量DOM数量

// ========== 种子随机：基于索引的确定性随机 ==========
function seededRand(seed: number): number {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x); // 0~1
}

// 比例 → 宽高计算（尊重用户裁剪比例）
const RATIO_MAP: Record<string, number> = {
  "4:3": 4 / 3, "3:4": 3 / 4, "1:1": 1, "16:9": 16 / 9, "3:2": 3 / 2,
};

// 根据比例和索引计算确定性宽高
function photoSize(ratio: string | undefined, idx: number): { w: number; h: number } {
  const r = RATIO_MAP[ratio || "4:3"] || 4 / 3;
  // 基于索引的确定性缩放：0.8 ~ 1.25（更大变化范围）
  const scale = 0.8 + seededRand(idx * 3 + 1) * 0.45;
  if (r >= 1) {
    const w = BASE_SIZE * scale;
    return { w, h: w / r };
  } else {
    const h = BASE_SIZE * scale;
    return { w: h * r, h };
  }
}

// "free" 比例照片：确定性随机宽高比
function freeSize(idx: number): { w: number; h: number } {
  const ar = 0.55 + seededRand(idx * 7 + 3) * 1.1; // 0.55 ~ 1.65
  const scale = 0.8 + seededRand(idx * 5 + 7) * 0.45;
  const base = BASE_SIZE * scale;
  if (ar >= 1) {
    return { w: base, h: base / ar };
  } else {
    return { w: base * ar, h: base };
  }
}

// 桶形半径：中间行最大，顶底行缩小
function rowRadius(row: number): number {
  const mid = (ROWS - 1) / 2;
  const norm = Math.abs(row - mid) / mid;
  return CYL_R * (1 - (1 - BARREL) * norm * norm);
}

// ========== 网格（有机布局） ==========
interface Cell {
  theta: number;
  row: number;
  jitterY: number;    // 垂直抖动（像素）
  tiltDeg: number;    // 倾斜角度（度）
  scaleOff: number;   // 额外缩放偏移
}

// 根据照片数量动态分配每行的列数（中间行多、顶底行少）
function distributePerRow(total: number): number[] {
  // 每行的权重：中间行权重最大
  const mid = (ROWS - 1) / 2;
  const weights = Array.from({ length: ROWS }, (_, r) => {
    const norm = Math.abs(r - mid) / mid;
    return 1 - (1 - BARREL) * norm * norm;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  // 按权重分配，至少每行1个
  let perRow = weights.map(w => Math.max(1, Math.round((w / totalWeight) * total)));
  // 调整总数
  let diff = total - perRow.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff > 0) { perRow[i % ROWS]++; diff--; i++; }
  while (diff < 0) {
    // 从最多的行减
    const maxIdx = perRow.indexOf(Math.max(...perRow));
    if (perRow[maxIdx] > 1) { perRow[maxIdx]--; diff++; }
    else break;
  }
  return perRow;
}

function buildGrid(photoCount: number): Cell[] {
  const cells: Cell[] = [];
  const perRow = distributePerRow(photoCount);
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    const cols = perRow[r];
    for (let c = 0; c < cols; c++) {
      // 基于全局索引的确定性抖动
      const jy = (seededRand(idx * 13 + 2) - 0.5) * 40;
      const tilt = (seededRand(idx * 17 + 5) - 0.5) * 12;
      const sOff = (seededRand(idx * 19 + 9) - 0.5) * 0.3;
      cells.push({
        theta: (2 * Math.PI * c) / cols + (seededRand(idx * 23 + 11) - 0.5) * 0.12,
        row: r,
        jitterY: jy,
        tiltDeg: tilt,
        scaleOff: sOff,
      });
      idx++;
    }
  }
  return cells;
}

export default function PhotoWall() {
  const wallPhotos = useStore((s) => s.wallPhotos);
  const { showPhotoManager, canManagePhoto, isLoggedIn } = usePermission();

  const sphereRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const rotY = useRef(0);
  const velY = useRef(0);
  const drag = useRef(false);
  const hover = useRef(false);
  const lastX = useRef(0);

  const [lb, setLb] = useState<{ s: string; t: string } | null>(null);
  const lbRef = useRef(false);
  const [showManager, setShowManager] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [sphereReady, setSphereReady] = useState(false); // 球体构建完成

  // 下载照片
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

  const grid = useMemo(() => buildGrid(wallPhotos.length), [wallPhotos.length]);
  const yOff = ((ROWS - 1) * ROW_GAP) / 2;

  // 构建 DOM（批量构建 + 图片渐入）
  useEffect(() => {
    const sphere = sphereRef.current;
    if (!sphere) return;
    sphere.innerHTML = "";
    setSphereReady(false);

    // 构建所有元素的数据
    const items: { el: HTMLDivElement; img: HTMLImageElement }[] = [];
    grid.forEach((cell, i) => {
      const photo = wallPhotos[i % wallPhotos.length];
      if (!photo) return;
      const { theta, row, jitterY, tiltDeg, scaleOff } = cell;

      const r = rowRadius(row);
      const x = r * Math.sin(theta);
      const y = row * ROW_GAP - yOff + jitterY; // 垂直抖动
      const z = r * Math.cos(theta);
      const ry = (theta * 180) / Math.PI;

      // 根据照片实际比例计算尺寸
      const base = photo.ratio === "free" ? freeSize(i) : photoSize(photo.ratio, i);
      const s = 1 + scaleOff; // 额外缩放
      const w = base.w * s;
      const h = base.h * s;

      const el = document.createElement("div");
      el.className = "pw-item";
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.opacity = "0";
      // 加入轻微倾斜，让布局更有机
      el.style.transform =
        `translate3d(${x - w / 2}px,${y - h / 2}px,${z}px) rotateY(${ry}deg) rotateZ(${tiltDeg}deg)`;

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.title;
      img.loading = "lazy";
      img.decoding = "async";
      img.draggable = false;

      // 图片加载完成后渐入显示
      img.onload = () => {
        el.style.transition = "opacity 0.4s ease";
        el.style.opacity = "1";
      };
      // 加载失败也显示（用背景色兜底）
      img.onerror = () => {
        el.style.transition = "opacity 0.3s ease";
        el.style.opacity = "0.5";
      };

      const lbl = document.createElement("span");
      lbl.className = "pw-lbl";
      lbl.textContent = photo.title;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setLb({ s: photo.src.replace("/400/400", "/900/900"), t: photo.title });
        lbRef.current = true;
      });

      el.append(img, lbl);
      items.push({ el, img });
    });

    // 批量构建：每帧插入 BATCH_SIZE 个元素，避免主线程阻塞
    let idx = 0;
    const batchAppend = () => {
      const end = Math.min(idx + BATCH_SIZE, items.length);
      const frag = document.createDocumentFragment();
      for (let i = idx; i < end; i++) {
        frag.appendChild(items[i].el);
      }
      sphere.appendChild(frag);
      idx = end;
      if (idx < items.length) {
        requestAnimationFrame(batchAppend);
      } else {
        setSphereReady(true);
      }
    };
    requestAnimationFrame(batchAppend);

    return () => {
      // 清理 img.onload 防止内存泄漏
      items.forEach(({ img }) => { img.onload = null; img.onerror = null; });
    };
  }, [grid, yOff, wallPhotos]);

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

  // 弹窗关闭时重启动画
  useEffect(() => {
    if (!lb) {
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
  }, [lb, animate]);

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

        {/* 操作按钮：管理层→管理照片墙，社员→上传照片 */}
        {showPhotoManager && (
          <button
            onClick={() => setShowManager(true)}
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
        {!showPhotoManager && isLoggedIn && (
          <button
            onClick={() => setShowUpload(true)}
            className="absolute top-[80px] right-10 z-20 px-6 py-2.5 rounded text-sm font-song active:scale-95 transition-all"
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            上传照片
          </button>
        )}

        {/* 3D 球体 */}
        <div
          className="pw-wrap"
          onMouseDown={md}
          onMouseMove={mm}
          onMouseUp={mu}
          onMouseEnter={me}
          onMouseLeave={ml}
        >
          <div ref={sphereRef} className="pw-sphere" />
        </div>

        {/* 加载提示 */}
        {!sphereReady && wallPhotos.length > 0 && (
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
            <img src={lb.s} alt={lb.t} draggable={false} />
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

      {/* 照片管理弹窗 */}
      {showManager && <PhotoManager onClose={() => setShowManager(false)} />}

      {/* 照片上传弹窗（社员用） */}
      {showUpload && <PhotoUploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
