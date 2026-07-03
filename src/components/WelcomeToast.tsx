import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

/**
 * 新成员欢迎弹框
 * - 武侠风格：水墨背景 + 金色边框 + 印章装饰
 * - 从顶部滑入，3.5 秒后自动消失
 * - 点击可提前关闭
 */
export default function WelcomeToast() {
  const welcomeName = useStore((s) => s.welcomeName);
  const clearWelcome = useStore((s) => s.clearWelcome);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (welcomeName) {
      setLeaving(false);
      setVisible(true);
      const timer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => {
          setVisible(false);
          clearWelcome();
        }, 500);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [welcomeName, clearWelcome]);

  if (!visible || !welcomeName) return null;

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      clearWelcome();
    }, 500);
  };

  return (
    <div
      className="fixed top-20 left-1/2 z-[200] pointer-events-auto"
      style={{
        transform: "translateX(-50%)",
        animation: leaving
          ? "toast-out 0.5s cubic-bezier(0.4,0,0.2,1) forwards"
          : "toast-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
    >
      <div
        className="relative px-8 py-5 rounded-lg overflow-hidden cursor-pointer"
        onClick={handleClose}
        style={{
          background: "linear-gradient(135deg, rgba(18,14,10,0.95) 0%, rgba(30,24,16,0.95) 100%)",
          border: "1px solid rgba(233,193,118,0.4)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(193,155,77,0.1), inset 0 1px 0 rgba(233,193,118,0.1)",
          minWidth: "380px",
          maxWidth: "90vw",
        }}
      >
        {/* 四角金色装饰 */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold-400/60" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold-400/60" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold-400/60" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold-400/60" />

        {/* 顶部装饰线 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px]"
          style={{
            width: "60%",
            background: "linear-gradient(90deg, transparent, #e9c176, transparent)",
          }}
        />

        {/* 内容 */}
        <div className="flex items-center gap-4">
          {/* 印章图标 */}
          <div className="flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(211,80,65,0.2) 0%, rgba(211,80,65,0.1) 100%)",
                border: "1.5px solid rgba(211,80,65,0.5)",
              }}
            >
              <span className="text-lg" style={{ color: "#d35041" }}>
                &#x559C;
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3
              className="font-calligraphy text-base tracking-wider"
              style={{ color: "#e9c176" }}
            >
              欢迎新宝宝进入大家庭
            </h3>
            <p className="font-song text-xs" style={{ color: "rgba(233,193,118,0.5)" }}>
              <span style={{ color: "#e9c176" }}>{welcomeName}</span>
              {" "}已加入百业 · 愿在情意结一直开心
            </p>
          </div>
        </div>

        {/* 底部装饰线 */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px]"
          style={{
            width: "40%",
            background: "linear-gradient(90deg, transparent, rgba(233,193,118,0.3), transparent)",
          }}
        />

        {/* 水墨粒子装饰 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                background: `rgba(233,193,118,${0.15 + Math.random() * 0.2})`,
                animation: `toast-sparkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
