import { useEffect, useState } from "react";

/* ================================================================
 *  江湖风 Loading 浮层
 *  - 转圈侠客 SVG 动画
 *  - 随机江湖风提示语
 *  - 淡入淡出
 * ================================================================ */

const MESSAGES = [
  "稍等大侠，正在加载...",
  "运功中，请稍候...",
  "大侠莫急，正在赶路...",
  "轻功施展中...",
  "正在翻山越岭...",
  "内力运转中...",
  "快马加鞭赶来...",
  "御剑飞行中...",
];

interface Props {
  show: boolean;
  message?: string;
}

export default function LoadingOverlay({ show, message }: Props) {
  const [msg, setMsg] = useState(() => message || MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      if (!message) setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [show, message]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{
        background: "rgba(10,7,3,0.82)",
        backdropFilter: "blur(6px)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      {/* 侠客 SVG */}
      <div className="wuxia-spinner">
        <svg viewBox="0 0 120 120" width="80" height="80">
          {/* 身体 */}
          <circle cx="60" cy="60" r="12" fill="#e9c176" opacity="0.9" />
          {/* 斗笠 */}
          <path d="M60 38 L44 52 L76 52 Z" fill="#c49b30" opacity="0.85" />
          {/* 剑 */}
          <line x1="60" y1="48" x2="60" y2="28" stroke="#e9c176" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="56" y1="31" x2="64" y2="31" stroke="#c49b30" strokeWidth="2" strokeLinecap="round" />
          {/* 飘带左 */}
          <path d="M48 56 Q38 68 42 80" fill="none" stroke="#e9c176" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
          {/* 飘带右 */}
          <path d="M72 56 Q82 68 78 80" fill="none" stroke="#e9c176" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        </svg>
      </div>

      {/* 提示语 */}
      <p
        className="font-song text-sm tracking-[0.15em]"
        style={{ color: "rgba(233,193,118,0.75)" }}
      >
        {message || msg}
      </p>
    </div>
  );
}
