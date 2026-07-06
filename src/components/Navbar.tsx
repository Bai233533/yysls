import { Link } from "react-router-dom";
import { Bell, User, Palette, Volume2, VolumeX, LogIn, LogOut, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePermission } from "../hooks/usePermission";
import { useStore } from "../store/useStore";

const navLinks = [
  { target: "hero", label: "首页" },
  { target: "members", label: "百业成员" },
  { target: "photowall", label: "照片墙" },
  { target: "guildnotice", label: "进百业须知" },
  { target: "joinus", label: "加入我们" },
];

const HIGHLIGHT_MAP: Record<string, string> = {
  hero: "hero",
  members: "members",
  photowall: "photowall",
  guildnotice: "guildnotice",
  joinus: "joinus",
};

const LEVEL_LABEL: Record<number, string> = { 1: "V1·社长", 2: "V2·副社长", 3: "V3·指挥", 4: "V4·社员", 5: "V5·观众" };

interface Props {
  onOpenBackground?: () => void;
  onOpenLogin?: () => void;
}

export default function Navbar({ onOpenBackground, onOpenLogin }: Props) {
  const [activeSection, setActiveSection] = useState("hero");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const clickLockRef = useRef(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { member, level, signOut, loading } = useAuth();
  const { showAddMember, showPhotoManager } = usePermission();
  const bgMuted = useStore((s) => s.bgMuted);
  const toggleBgMute = useStore((s) => s.toggleBgMute);

  useEffect(() => {
    const sections = ["hero", "members", "photowall", "guildnotice", "joinus"];

    const handleScroll = () => {
      if (clickLockRef.current) return;
      const scrollMid = window.scrollY + window.innerHeight / 2;
      let current = "hero";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (scrollMid >= top && scrollMid < bottom) { current = id; break; }
        if (scrollMid >= top) current = id;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 点击外部关闭用户菜单
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  const scrollTo = (id: string) => {
    clickLockRef.current = true;
    setActiveSection(HIGHLIGHT_MAP[id] || id);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => { clickLockRef.current = false; }, 1200);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gold-400/15"
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        background: "rgba(12,10,8,0.4)",
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
            <button onClick={onOpenBackground}
              className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200"
              title="更换背景">
              <Palette size={18} strokeWidth={1.5} />
            </button>
          )}
          <button onClick={toggleBgMute}
            className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200"
            title={bgMuted ? "取消静音" : "静音"}>
            {bgMuted ? <VolumeX size={18} strokeWidth={1.5} /> : <Volume2 size={18} strokeWidth={1.5} />}
          </button>
          <button className="p-2 hover:bg-gold-400/10 rounded-full transition-all text-gold-200/50 hover:text-gold-200">
            <Bell size={18} strokeWidth={1.5} />
          </button>

          {/* 用户按钮 */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gold-400/10 animate-pulse" />
          ) : member ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gold-400/10 transition-all border border-gold-400/20">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gold-400/30">
                  <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-song text-gold-200 hidden sm:inline">{member.name}</span>
              </button>

              {/* 下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gold-400/20 overflow-hidden"
                  style={{ background: "rgba(24,22,18,0.95)", backdropFilter: "blur(16px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                  <div className="px-4 py-3 border-b border-gold-400/10">
                    <p className="text-sm font-song text-gold-100 font-medium">{member.name}</p>
                    <p className="text-[10px] font-song text-gold-400/60 mt-0.5">
                      {LEVEL_LABEL[level]}
                    </p>
                  </div>
                  <div className="py-1">
                    {(showAddMember || showPhotoManager) && (
                      <div className="px-4 py-1.5">
                        <p className="text-[10px] font-song text-gold-400/40 uppercase tracking-wider">管理</p>
                      </div>
                    )}
                    <button onClick={() => { setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-song text-gold-200/70 hover:text-gold-200 hover:bg-gold-400/5 transition-colors flex items-center gap-2">
                      <Settings size={14} />个人设置
                    </button>
                    <div className="border-t border-gold-400/10 my-1" />
                    <button onClick={() => { signOut(); setShowUserMenu(false); }}
                      className="w-full px-4 py-2 text-left text-xs font-song text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-colors flex items-center gap-2">
                      <LogOut size={14} />退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-400/30 hover:border-gold-400/60 text-gold-200/70 hover:text-gold-200 transition-all text-xs font-song">
              <LogIn size={14} />
              <span className="hidden sm:inline">登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
