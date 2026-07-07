import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Particles from "../components/Particles";
import GodRays from "../components/GodRays";
import RotatingRing from "../components/RotatingRing";
import { useStore } from "../store/useStore";

export default function WelcomePage() {
  const navigate = useNavigate();
  const syncFromCloud = useStore((s) => s.syncFromCloud);
  const heroBackground = useStore((s) => s.heroBackground);
  const members = useStore((s) => s.members);

  // 欢迎页阶段预加载首页数据（成员、照片墙、背景图等）
  useEffect(() => {
    syncFromCloud();
  }, []); // eslint-disable-line

  // 预加载首页背景图
  useEffect(() => {
    if (heroBackground) {
      const img = new Image();
      img.src = heroBackground;
    }
  }, [heroBackground]);

  // 预加载成员头像（取前12张，覆盖首屏）
  useEffect(() => {
    if (members.length > 0) {
      members.slice(0, 12).forEach((m) => {
        if (m.avatarUrl) {
          const img = new Image();
          img.src = m.avatarUrl;
        }
      });
    }
  }, [members]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface-lowest">
      {/* Atmospheric Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d0e0f]" />
        <GodRays />
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_10%,#0d0e0f_85%)]" />
        <div id="particle-container" className="absolute inset-0">
          <Particles count={20} />
        </div>
      </div>

      {/* Spotlight Effect - 柔和聚光灯 */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        {/* 主光束 */}
        <div className="spotlight-beam-1" />
        {/* 次光束 */}
        <div className="spotlight-beam-2" />
        {/* 第三光束 - 更淡的补充 */}
        <div className="spotlight-beam-3" />
        {/* 环境光晕 */}
        <div className="spotlight-ambient" />
      </div>

      <style>{`
        @keyframes spotlightSway1 {
          0%, 100% { transform: translateX(-30vw) rotate(-5deg) scaleX(0.9); }
          50% { transform: translateX(30vw) rotate(5deg) scaleX(1.1); }
        }
        @keyframes spotlightSway2 {
          0%, 100% { transform: translateX(20vw) rotate(4deg) scaleX(1.1); }
          50% { transform: translateX(-20vw) rotate(-4deg) scaleX(0.9); }
        }
        @keyframes spotlightSway3 {
          0%, 100% { transform: translateX(-15vw) rotate(-3deg); }
          33% { transform: translateX(10vw) rotate(2deg); }
          66% { transform: translateX(25vw) rotate(4deg); }
        }
        .spotlight-beam-1 {
          position: absolute;
          top: -100px;
          left: 50%;
          width: 500px;
          height: 90vh;
          background: radial-gradient(
            ellipse 40% 70% at 50% 0%,
            rgba(255,240,190,0.45) 0%,
            rgba(233,193,118,0.2) 25%,
            rgba(233,193,118,0.08) 50%,
            rgba(233,193,118,0.02) 75%,
            transparent 100%
          );
          animation: spotlightSway1 18s ease-in-out infinite;
          filter: blur(25px);
          transform-origin: top center;
        }
        .spotlight-beam-2 {
          position: absolute;
          top: -80px;
          left: 50%;
          width: 450px;
          height: 85vh;
          background: radial-gradient(
            ellipse 35% 65% at 50% 0%,
            rgba(255,250,220,0.35) 0%,
            rgba(255,245,200,0.15) 30%,
            rgba(255,240,180,0.05) 60%,
            transparent 100%
          );
          animation: spotlightSway2 24s ease-in-out infinite;
          filter: blur(30px);
          transform-origin: top center;
          opacity: 0.8;
        }
        .spotlight-beam-3 {
          position: absolute;
          top: -60px;
          left: 50%;
          width: 300px;
          height: 70vh;
          background: radial-gradient(
            ellipse 30% 50% at 50% 0%,
            rgba(255,245,200,0.25) 0%,
            rgba(255,240,180,0.1) 40%,
            transparent 80%
          );
          animation: spotlightSway3 28s ease-in-out infinite;
          filter: blur(35px);
          transform-origin: top center;
          opacity: 0.6;
        }
        .spotlight-ambient {
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          width: 100vw;
          height: 400px;
          background: radial-gradient(
            ellipse 60% 80% at 50% 0%,
            rgba(255,240,180,0.2) 0%,
            rgba(233,193,118,0.08) 50%,
            transparent 80%
          );
          filter: blur(40px);
        }
      `}</style>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center h-full px-16 md:px-64 text-center">
        {/* Logo Branding */}
        <div className="space-y-6 mb-12 animate-fade-in-up">
          <div className="flex flex-col items-center">
            {/* Title Logo */}
            <img
              src="https://www.yysls.cn/pc/fab/20250723194326/img/logo_a9b36efe.png?image_process=format,png"
              alt="燕云十六声"
              className="w-[280px] md:w-[360px] h-auto drop-shadow-[0_0_30px_rgba(0,0,0,1)]"
            />
            <p className="font-headline-md text-secondary mt-4 tracking-[0.4em] uppercase text-body-md md:text-headline-md">
              Where Winds Meet
            </p>
            <div className="ink-fade-divider w-24 md:w-48 mt-4" />
            <h2 className="font-headline-lg text-on-surface-variant mt-2 tracking-widest font-light opacity-80 text-body-lg md:text-headline-lg">
              Baiye Guild
            </h2>
          </div>
        </div>

        {/* Interaction Portal */}
        <div className="relative group animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="absolute -inset-4 border border-secondary/10 rounded-lg pointer-events-none group-hover:border-secondary/30 transition-colors duration-500" />
          <button
            className="relative overflow-hidden group/btn px-12 py-4 bg-secondary-container/20 border border-secondary/50 rounded-sm font-headline-md text-secondary tracking-[0.2em] transition-all duration-500 btn-metallic active:scale-95"
            onClick={() => navigate("/home")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10 text-on-secondary font-bold">进入百业</span>
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-secondary" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-secondary" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-secondary" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-secondary" />
          </button>
        </div>
      </main>
    </div>
  );
}
