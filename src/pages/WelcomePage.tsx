import { useNavigate } from "react-router-dom";
import Particles from "../components/Particles";
import GodRays from "../components/GodRays";
import RotatingRing from "../components/RotatingRing";

export default function WelcomePage() {
  const navigate = useNavigate();

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

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center h-full px-16 md:px-64 text-center">
        {/* Logo Branding */}
        <div className="space-y-6 mb-12 animate-fade-in-up">
          <div className="flex flex-col items-center">
            {/* Title Logo */}
            <h1 className="font-calligraphy text-[72px] md:text-[96px] text-on-surface leading-none drop-shadow-[0_0_30px_rgba(0,0,0,1)]">
              燕云十六声
            </h1>
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
