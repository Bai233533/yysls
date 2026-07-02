import { useEffect, useState, useRef, useCallback } from "react";
import { useStore } from "../store/useStore";

export default function MemberDetailModal() {
  const { members, selectedMember, setSelectedMember } = useStore();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  /* 拖拽状态 */
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const rotY = useRef(0);
  const rotX = useRef(0);

  const MAX_Y = 45; // 左右最大旋转角度
  const MAX_X = 25; // 上下最大旋转角度
  const SENS_Y = 0.25; // 左右灵敏度
  const SENS_X = 0.2;  // 上下灵敏度

  const member = selectedMember ? members.find((m) => m.id === selectedMember.id) ?? null : null;

  useEffect(() => {
    if (member) {
      setVisible(true);
      setClosing(false);
      rotY.current = 0;
      rotX.current = 0;
    }
  }, [member?.id]);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setSelectedMember(null); }, 250);
  };

  /* 应用旋转 */
  const applyRot = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      `perspective(1000px) rotateY(${rotY.current}deg) rotateX(${rotX.current}deg) scale(1.03)`;
  }, []);

  /* 回弹动画 */
  const bounceBack = useCallback(() => {
    const startRy = rotY.current;
    const startRx = rotX.current;
    const dur = 400;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      rotY.current = startRy * (1 - ease);
      rotX.current = startRx * (1 - ease);
      applyRot();
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else if (cardRef.current) {
        cardRef.current.style.transform = "perspective(1000px) rotateY(0) rotateX(0) scale(1)";
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [applyRot]);

  const handleDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
    }
    window.addEventListener("mousemove", onWindowMove);
    window.addEventListener("mouseup", onWindowUp);
    e.preventDefault();
  }, []);

  /* 全局鼠标移动（按住后移出卡片也能旋转） */
  const onWindowMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !cardRef.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    rotY.current = Math.max(-MAX_Y, Math.min(MAX_Y, dx * SENS_Y));
    rotX.current = Math.max(-MAX_X, Math.min(MAX_X, -dy * SENS_X));
    applyRot();
  }, [applyRot]);

  /* 全局鼠标松开 */
  const onWindowUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    window.removeEventListener("mousemove", onWindowMove);
    window.removeEventListener("mouseup", onWindowUp);
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    }
    bounceBack();
  }, [bounceBack, onWindowMove]);

  /* 组件卸载时清理全局事件 */
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onWindowMove, onWindowUp]);

  if (!member && !visible) return null;
  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center select-none"
      style={{
        animation: closing ? "modalOut 0.25s cubic-bezier(0.4,0,1,1) forwards" : "modalIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        userSelect: "none",
        MozUserSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(12,10,8,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={close}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-[105] w-[300px] sm:w-[340px] aspect-[3/4] rounded overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          boxShadow: "0 0 0 1px rgba(193,155,77,0.35), 0 0 60px rgba(193,155,77,0.25), 0 25px 80px rgba(0,0,0,0.6)",
          transformStyle: "preserve-3d",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseDown={handleDown}
      >
        {/* Background Image */}
        <img
          src={member.detailUrl}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* 流光效果（持续循环） */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background: `linear-gradient(
              135deg,
              transparent 0%,
              transparent 30%,
              rgba(230, 180, 90, 0.1) 42%,
              rgba(255, 230, 150, 0.28) 50%,
              rgba(230, 180, 90, 0.1) 58%,
              transparent 70%,
              transparent 100%
            )`,
            backgroundSize: "250% 250%",
            animation: "mc-shine-detail 3.5s linear infinite",
            mixBlendMode: "overlay",
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-transparent to-ink-900/60 pointer-events-none" />

        {/* 边缘金色内描边 */}
        <div
          className="absolute inset-0 pointer-events-none z-[6]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(193,155,77,0.2), inset 0 0 30px rgba(0,0,0,0.3)" }}
        />

        {/* Top: Name & Title */}
        <div
          className="absolute top-8 left-0 w-full text-center z-10 px-4 pointer-events-none"
          style={{ transform: "translateZ(30px)", userSelect: "none" }}
        >
          <h2 className="text-gold-100 text-3xl font-calligraphy tracking-wider"
            style={{ textShadow: "0 0 20px rgba(233,193,118,0.4), 0 2px 8px rgba(0,0,0,0.6)", userSelect: "none" }}
          >
            {member.name}
          </h2>
          <p className="text-gold-200/50 text-sm mt-1.5 tracking-widest font-song"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)", userSelect: "none" }}
          >
            {member.title}
          </p>
        </div>

        {/* Bottom: Glass Info Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pointer-events-none"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="px-4 py-3 rounded flex items-center gap-3"
            style={{ background: "rgba(12,10,8,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(193,155,77,0.25)" }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-400/40 flex-none">
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-gold-100 text-sm font-song font-semibold truncate">@{member.title}</span>
              <span className="text-gold-200/50 text-xs font-song truncate">{member.role}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mc-shine-detail {
          0%   { background-position: 100% 100%; }
          100% { background-position: -100% -100%; }
        }
      `}</style>
    </div>
  );
}
