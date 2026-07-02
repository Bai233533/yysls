export default function HeroLogo() {
  return (
    <div className="relative w-56 h-56 flex items-center justify-center select-none">
      {/* Outer ink wash aura */}
      <div className="absolute inset-[-20px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(193,155,77,0.15) 0%, rgba(193,155,77,0.05) 40%, transparent 70%)",
        }}
      />

      {/* Rotating ring - outer */}
      <div className="absolute inset-0 rounded-full"
        style={{
          border: "1.5px solid rgba(193,155,77,0.2)",
          animation: "rotateText 30s linear infinite",
        }}
      />

      {/* Rotating ring - inner */}
      <div className="absolute inset-3 rounded-full"
        style={{
          border: "1px solid rgba(193,155,77,0.12)",
          animation: "rotateText 30s linear infinite reverse",
        }}
      />

      {/* Rotating text ring */}
      <svg className="absolute inset-0 w-full h-full rotating-labels" viewBox="0 0 224 224">
        <defs>
          <path id="textCircle" d="M 112, 112 m -95, 0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" fill="none" />
        </defs>
        <text fill="rgba(193,155,77,0.25)" fontSize="10" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          <textPath href="#textCircle" startOffset="0%">
            燕云十六声 · 百业 · 燕云十六声 · 百业 · 燕云十六声 · 百业 ·
          </textPath>
        </text>
      </svg>

      {/* Seal body */}
      <div className="w-36 h-36 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #f5f0e6 0%, #ebe4d4 50%, #ddd4c0 100%)",
          boxShadow: "0 0 40px rgba(193,155,77,0.15), 0 0 80px rgba(193,155,77,0.05), inset 0 0 30px rgba(0,0,0,0.03)",
        }}
      >
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Inner border */}
        <div className="absolute inset-2 rounded-full border border-gold-500/20" />

        {/* Main text */}
        <div className="relative z-10 text-center">
          <h1 className="font-calligraphy leading-none" style={{ fontSize: "52px", color: "#000000" }}>
            情
          </h1>
          <div className="flex items-center justify-center gap-1 -mt-1">
            <div className="w-6 h-[0.5px]" style={{ background: "rgba(0,0,0,0.2)" }} />
            <span className="font-calligraphy" style={{ fontSize: "36px", lineHeight: 1, color: "#000000" }}>意结</span>
            <div className="w-6 h-[0.5px]" style={{ background: "rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        {/* Small red seal accent */}
        <div className="absolute bottom-5 right-6 w-4 h-4 flex items-center justify-center"
          style={{
            border: "1px solid rgba(211,80,65,0.4)",
            color: "rgba(211,80,65,0.5)",
            fontSize: "6px",
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          印
        </div>

        {/* Ink splash decorations */}
        <svg className="absolute top-3 left-4 w-3 h-3 opacity-20" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="3" fill="#3d3220" />
        </svg>
        <svg className="absolute bottom-8 left-3 w-2 h-2 opacity-15" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="#3d3220" />
        </svg>
      </div>
    </div>
  );
}
