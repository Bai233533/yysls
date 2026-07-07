import { useState, useEffect } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

/* ================================================================
 *  首页公告弹窗 — 进入首页时显示一次
 * ================================================================ */

const STORAGE_KEY = "yysls_notice_dismissed";

export default function NoticePopup() {
  const [show, setShow] = useState(false);
  useBodyScrollLock(show);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // 延迟1秒显示，等页面加载
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-[90vw] max-w-[440px] rounded-xl border border-gold-400/20 shadow-2xl overflow-hidden"
        style={{ background: "rgba(18,16,14,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰线 */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)" }} />

        {/* 标题 */}
        <div className="px-6 pt-5 pb-2 text-center">
          <h3 className="font-calligraphy text-xl tracking-[0.2em]" style={{ color: "#e9c176" }}>
            百业公告
          </h3>
          <p className="font-song text-[9px] mt-1 tracking-[0.15em] uppercase" style={{ color: "rgba(233,193,118,0.3)" }}>
            ANNOUNCEMENT
          </p>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          <p className="font-song text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(233,193,118,0.75)" }}>
            无论是谁，都会欢迎任何人参观我们百业。
          </p>
          <p className="font-song text-sm leading-relaxed whitespace-pre-line mt-3" style={{ color: "rgba(233,193,118,0.6)" }}>
            其次这个网页开发时间用时比较少，可能会有很多bug和不足，有意见大家可以随时提，我这边看到就会及时修改。
          </p>
          <p className="font-song text-sm leading-relaxed whitespace-pre-line mt-3" style={{ color: "rgba(233,193,118,0.6)" }}>
            这边更新的内容我也会及时在公告中发布，望大家监督。
          </p>
          <p className="font-song text-sm leading-relaxed whitespace-pre-line mt-3" style={{ color: "rgba(233,193,118,0.55)" }}>
            另外，这个存储大家内容的地方是个国外网站，可能加载会有些缓慢，但是对于自己浏览看过的照片再次翻看就不会卡顿，望大家理解 🙏
          </p>
        </div>

        {/* 按钮 */}
        <div className="px-6 pb-5 flex justify-center">
          <button
            onClick={dismiss}
            className="px-8 py-2 rounded-lg text-sm font-song font-medium tracking-wider transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#e9c176",
            }}
          >
            我知道了
          </button>
        </div>

        {/* 底部装饰线 */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)" }} />
      </div>
    </div>
  );
}
