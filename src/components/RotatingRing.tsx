export default function RotatingRing() {
  return (
    <div className="absolute inset-0 rotating-labels opacity-40">
      <svg className="w-full h-full fill-secondary" viewBox="0 0 100 100">
        <path
          d="M 50, 50 m -38, 0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          fill="transparent"
          id="circlePath"
        />
        <text className="text-[5.5px] tracking-widest" style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600 }}>
          <textPath xlinkHref="#circlePath">
            WINDS OF YANYUN • BAIYE GUILD • 燕云十六声 • 百业 • COMMANDER OF THE FRONTIER •
          </textPath>
        </text>
      </svg>
    </div>
  );
}
