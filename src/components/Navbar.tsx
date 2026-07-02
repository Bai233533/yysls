import { Link } from "react-router-dom";
import { Bell, User, Palette, Volume2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { target: "hero", label: "首页" },
  { target: "members", label: "百业成员" },
  { target: "photowall", label: "照片墙" },
  { target: "photowall", label: "百业资料" },
  { target: "photowall", label: "加入我们" },
];

// 导航项对应的唯一 section id（用于高亮判定，多个导航项可映射到同一个 section）
const HIGHLIGHT_MAP: Record<string, string> = {
  hero: "hero",
  members: "members",
  photowall: "photowall",
};

export default function Navbar({ onOpenBackground }: { onOpenBackground?: () => void }) {
  const [activeSection, setActiveSection] = useState("hero");
  // 记录是否由点击触发，避免点击后滚动过程中被覆盖
  const clickLockRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sections = ["hero", "members", "photowall"];

    const handleScroll = () => {
      if (clickLockRef.current) return; // 点击导航后锁定，等滚动结束

      const scrollMid = window.scrollY + window.innerHeight / 2;
      let current = "hero";

      // 从前往后遍历，找到 scrollMid 落在哪个 section 内
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollMid >= top && scrollMid < bottom) {
          current = id;
          break;
        }
        // 如果超过该 section 且是最后一个，就选它
        if (scrollMid >= top) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    // 点击导航时锁定高亮，防止滚动过程中的抖动
    clickLockRef.current = true;
    setActiveSection(HIGHLIGHT_MAP[id] || id);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickLockRef.current = false;
    }, 1200); // 等平滑滚动基本完成

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
                  activeSection === link.target
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
          {onOpenBackground && (
            <button
              onClick={onOpenBackground}
              className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200"
              title="更换背景"
            >
              <Palette size={18} strokeWidth={1.5} />
            </button>
          )}
          <button className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200">
            <Volume2 size={18} strokeWidth={1.5} />
          </button>
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
