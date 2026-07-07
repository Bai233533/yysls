import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useStore } from "../store/useStore";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function MemberDetailModal() {
  const { members, selectedMember, setSelectedMember } = useStore();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cardEntered, setCardEntered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // 照片/视频轮播
  const [mediaIndex, setMediaIndex] = useState(0);

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

  // 检测URL是否为视频
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.includes("data:video") || 
           url.endsWith(".mp4") || 
           url.endsWith(".webm") || 
           url.endsWith(".ogg") ||
           url.includes("/video/");
  };

  // 合并照片和视频为媒体列表
  const mediaList = useMemo(() => {
    if (!member) return [];
    const list: { type: "image" | "video"; url: string }[] = [];
    // 主图（大详情）- 自动检测类型
    if (member.detailUrl) {
      list.push({ 
        type: isVideoUrl(member.detailUrl) ? "video" : "image", 
        url: member.detailUrl 
      });
    }
    // 详情媒体（小详情）
    if (member.detailMedia1) list.push({ type: (member.detailMedia1Type || "image") as "image" | "video", url: member.detailMedia1 });
    if (member.detailMedia2) list.push({ type: (member.detailMedia2Type || "image") as "image" | "video", url: member.detailMedia2 });
    if (member.detailMedia3) list.push({ type: (member.detailMedia3Type || "image") as "image" | "video", url: member.detailMedia3 });
    return list;
  }, [member]);

  const hasMedia = mediaList.length > 1;
  const currentMedia = mediaList[mediaIndex];

  useBodyScrollLock(visible);

  useEffect(() => {
    if (member) {
      setVisible(true);
      setClosing(false);
      setCardEntered(false);
      setMediaIndex(0);
      rotY.current = 0;
      rotX.current = 0;
      // 延迟一帧触发翻转入场动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setCardEntered(true));
      });

      // 预加载下一个视频（如果有）
      if (mediaList.length > 1 && mediaList[1].type === "video") {
        const preloadVideo = document.createElement("video");
        preloadVideo.src = mediaList[1].url;
        preloadVideo.preload = "auto";
        preloadVideo.muted = true;
      }
    }
  }, [member?.id]);

  // 视频播放 5 秒后循环 + 预加载下一个视频
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (v.currentTime >= 5) {
        v.currentTime = 0;
        v.play();
      }
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    v.play().catch(() => {});

    // 预加载下一个媒体（如果是视频）
    const nextIndex = (mediaIndex + 1) % mediaList.length;
    if (nextIndex !== mediaIndex && mediaList[nextIndex]?.type === "video") {
      const preloadVideo = document.createElement("video");
      preloadVideo.src = mediaList[nextIndex].url;
      preloadVideo.preload = "auto";
      preloadVideo.muted = true;
    }

    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [mediaIndex, currentMedia, mediaList]);

  const close = () => {
    setClosing(true);
    setCardEntered(false); // 触发翻转退出动画
    setTimeout(() => { setVisible(false); setSelectedMember(null); }, 600);
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
        opacity: closing ? 0 : 1,
        transition: closing ? "opacity 0.5s ease" : "none",
        userSelect: "none",
        MozUserSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(12,10,8,0.8)" }}
        onClick={close}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-[105] w-[300px] sm:w-[340px] aspect-[3/4] rounded overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          boxShadow: "0 0 0 1px rgba(193,155,77,0.35), 0 0 60px rgba(193,155,77,0.25), 0 25px 80px rgba(0,0,0,0.6)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          transition: "transform 0.6s cubic-bezier(0.15, 0.85, 0.25, 1), opacity 0.15s ease",
          transform: cardEntered
            ? "perspective(1000px) rotateY(0deg) scale(1)"
            : "perspective(1000px) rotateY(360deg) scale(0.5)",
        }}
        onMouseDown={handleDown}
      >
        {/* Background Media (photo or video) */}
        {currentMedia?.type === "video" ? (
          <>
            <video
              ref={videoRef}
              src={currentMedia.url}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              muted
              loop
              playsInline
              preload="auto"
              draggable={false}
              onWaiting={() => setVideoLoading(true)}
              onPlaying={() => setVideoLoading(false)}
              onCanPlay={() => setVideoLoading(false)}
            />
            {/* 视频加载状态 */}
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[15]">
                <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <img
            src={currentMedia?.url || member.detailUrl}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* 流光效果（简化版，减少GPU负载） */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(255,230,150,0.15) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "mc-shine-detail 4s ease-in-out infinite",
            willChange: "background-position",
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
            style={{ background: "rgba(12,10,8,0.85)", border: "1px solid rgba(193,155,77,0.25)" }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-400/40 flex-none">
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-gold-100 text-sm font-song font-semibold truncate">@{member.name}</span>
              <span className="text-gold-200/50 text-xs font-song truncate">{member.signature || member.role}</span>
            </div>
            {member.title && (
              <span className="text-gold-100 text-xs font-song tracking-wider flex-none"
                style={{ textShadow: "0 0 8px rgba(233,193,118,0.3)" }}>
                {member.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Navigation Buttons (outside card) */}
      {hasMedia && (
        <div className="absolute inset-0 z-[110] pointer-events-none flex items-center justify-between px-2 sm:px-4">
          <button
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/60 border-2 border-gold-400/50 text-gold-200 hover:bg-black/80 hover:text-gold-100 hover:border-gold-400 transition-all backdrop-blur-md shadow-lg shadow-black/40"
            onClick={(e) => {
              e.stopPropagation();
              setMediaIndex((i) => (i - 1 + mediaList.length) % mediaList.length);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-black/60 border-2 border-gold-400/50 text-gold-200 hover:bg-black/80 hover:text-gold-100 hover:border-gold-400 transition-all backdrop-blur-md shadow-lg shadow-black/40"
            onClick={(e) => {
              e.stopPropagation();
              setMediaIndex((i) => (i + 1) % mediaList.length);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
          {/* 媒体计数器 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-gold-400/30 text-xs text-gold-200 font-song">
            {mediaIndex + 1} / {mediaList.length}
            {currentMedia?.type === "video" && " ▶"}
          </div>
        </div>
      )}

      <style>{`
        @keyframes mc-shine-detail {
          0%   { background-position: 100% 100%; }
          100% { background-position: -100% -100%; }
        }
      `}</style>
    </div>
  );
}
