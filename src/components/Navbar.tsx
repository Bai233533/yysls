import { Link } from "react-router-dom";
import { Bell, User } from "lucide-react";

const navLinks = [
  { target: "members", label: "百业成员" },
  { target: "hero", label: "照片墙" },
  { target: "members", label: "百业资料" },
  { target: "members", label: "加入我们" },
];

export default function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gold-400/15"
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(12,10,8,0.75)",
      }}
    >
      <div className="flex justify-between items-center px-8 md:px-16 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-calligraphy text-2xl tracking-widest hover:opacity-80 transition-colors" style={{ color: "#e9c176" }}>
            情意结
          </Link>
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link, i) => (
              <button
                key={i}
                onClick={() => scrollTo(link.target)}
                className={`font-song text-sm transition-colors pb-1 ${
                  i === 0
                    ? "text-gold-200 ink-underline font-medium"
                    : "text-gold-200/50 hover:text-gold-200"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200">
            <Bell size={18} strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200">
            <User size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
