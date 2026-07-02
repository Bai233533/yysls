import { useRef, useEffect, useCallback, useState } from "react";
import { useStore } from "../store/useStore";
import PhotoManager from "./PhotoManager";

/* ================================================================
 *  3D 圆柱网格照片墙组件
 *  - 严格行列网格，360° 完整圆柱环绕
 *  - 纯圆柱面（无桶形收缩），侧面对透视压缩明显
 *  - 拖拽绕垂直轴旋转 + 惯性 + 自动旋转 + 悬停暂停 + 点击放大
 *  - 照片数据从 Supabase 加载（fallback 使用预设数据）
 * ================================================================ */

// ========== 圆柱参数 ==========
const CYL_R = 450;           // 圆柱半径（中间行）
const ROWS = 7;              // 行数
const COLS = 36;             // 列数（增加列数，左右更宽）
const IMG = 65;              // 图片尺寸
const ROW_GAP = 80;          // 行间距
const BARREL = 0.72;         // 顶底行半径缩放（越小弯曲越大，1=纯圆柱）
const AUTO_SPEED = 0.06;     // 自动旋转速度（度/帧，越小越慢）
const FRICTION = 0.95;       // 惯性衰减
const DRAG_SENS = 0.25;      // 拖拽灵敏度

// 计算某行的桶形半径（中间行最大，顶底行缩小）
function rowRadius(row: number): number {
  const mid = (ROWS - 1) / 2;                          // 中间行索引 (3)
  const norm = Math.abs(row - mid) / mid;              // 0=中间, 1=顶/底
  return CYL_R * (1 - (1 - BARREL) * norm * norm);     // 二次曲线过渡
}

// ========== 圆柱面网格（严格行列对齐） ==========
interface Cell {
  theta: number;  // 水平角（弧度）
  row: number;    // 行索引
}

function buildGrid(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({
        theta: (2 * Math.PI * c) / COLS,
        row: r,
      });
    }
  }
  return cells;
}

export default function PhotoWall() {
  const wallPhotos = useStore((s) => s.wallPhotos);
  const loadWallPhotos = useStore((s) => s.loadWallPhotos);

  const cylRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const rotY = useRef(0);
  const velY = useRef(0);
  const drag = useRef(false);
  const hover = useRef(false);
  const lastX = useRef(0);

  const [lb, setLb] = useState<{ s: string; t: string } | null>(null);
  const lbRef = useRef(false); // 跟踪弹窗状态，弹窗打开时暂停旋转
  const [showManager, setShowManager] = useState(false);

  const grid = useRef(buildGrid()).current;
  const yOff = ((ROWS - 1) * ROW_GAP) / 2;

  // 挂载时从 Supabase 加载照片
  useEffect(() => {
    loadWallPhotos();
  }, []); // eslint-disable-line

  // 构建 DOM
  useEffect(() => {
    const cyl = cylRef.current;
    if (!cyl) return;
    cyl.innerHTML = "";

    grid.forEach((cell, i) => {
      const photo = wallPhotos[i % wallPhotos.length];
      const { theta, row } = cell;

      // 桶形圆柱面坐标（每行半径不同，顶底向内弯曲）
      const r = rowRadius(row);
      const x = r * Math.sin(theta);
      const y = row * ROW_GAP - yOff;
      const z = r * Math.cos(theta);

      // 每张图片绕 Y 轴旋转，正面朝向圆柱外侧
      const ry = (theta * 180) / Math.PI;

      const el = document.createElement("div");
      el.className = "pw-item";
      el.style.width = el.style.height = `${IMG}px`;
      el.style.transform =
        `translate3d(${x - IMG / 2}px,${y - IMG / 2}px,${z}px) rotateY(${ry}deg)`;

      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.title;
      img.loading = "lazy";
      img.draggable = false;

      const lbl = document.createElement("span");
      lbl.className = "pw-lbl";
      lbl.textContent = photo.title;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setLb({ s: photo.src.replace("/400/400", "/900/900"), t: photo.title });
        lbRef.current = true;
      });

      el.append(img, lbl);
      cyl.appendChild(el);
    });
  }, [grid, yOff, wallPhotos]);

  // 动画循环
  const animate = useCallback(() => {
    const cyl = cylRef.current;
    if (!cyl) return;
    // 弹窗打开时完全暂停旋转
    if (lbRef.current) {
      velY.current = 0;
      animRef.current = requestAnimationFrame(animate);
      return;
    }
    if (!drag.current && !hover.current) rotY.current += AUTO_SPEED;
    if (!drag.current) {
      velY.current *= FRICTION;
      rotY.current += velY.current;
    }
    cyl.style.transform = `rotateY(${rotY.current}deg)`;
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

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
        <div className="pw-stars">
          <div className="pw-shoot" />
          <div className="pw-shoot" />
          <div className="pw-shoot" />
        </div>
        <div className="pw-nebula" />

        {/* 标题 - 左上角 */}
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

        {/* 管理按钮 - 右上角 */}
        <button
          onClick={() => setShowManager(true)}
          className="absolute top-[80px] right-10 z-20 px-6 py-2.5 rounded text-sm font-song active:scale-95 transition-all"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            e.currentTarget.style.background = "rgba(20,20,20,0.85)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.background = "rgba(0,0,0,0.7)";
          }}
        >
          管理照片墙
        </button>

        {/* 3D 透视容器 */}
        <div
          className="pw-wrap"
          onMouseDown={md}
          onMouseMove={mm}
          onMouseUp={mu}
          onMouseEnter={me}
          onMouseLeave={ml}
        >
          <div ref={cylRef} className="pw-sphere" />
        </div>
      </section>

      {/* 放大弹窗 */}
      {lb && (
        <div className="pw-lb" onClick={() => { setLb(null); lbRef.current = false; }}>
          <div className="pw-lb-box" onClick={(e) => e.stopPropagation()}>
            <img src={lb.s} alt={lb.t} draggable={false} />
            <span className="pw-lb-t">{lb.t}</span>
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
    </>
  );
}
