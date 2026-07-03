import { PenTool } from "lucide-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import HeroLogo from "../components/HeroLogo";
import PhotoWall from "../components/PhotoWall";
import MemberGrid from "../components/MemberGrid";
import Pagination from "../components/Pagination";
import MemberDetailModal from "../components/MemberDetailModal";
import EditModal from "../components/EditModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import GitHubSync from "../components/GitHubSync";
import BackgroundPicker from "../components/BackgroundPicker";
import WelcomeToast from "../components/WelcomeToast";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import PasswordRecoveryModal from "../components/PasswordRecoveryModal";
import { useStore } from "../store/useStore";
import { usePermission } from "../hooks/usePermission";
import { useAuth } from "../contexts/AuthContext";

const CARD_W = 96; // w-24 = 96px
const MIN_GAP = 8; // gap-2 = 8px
const TARGET_WIDTH = 4; // 需要填满至少 4 倍屏幕宽度以保证无缝滚动

export default function HomePage() {
  const { members, currentPage, membersPerPage, setCurrentPage, setSelectedMember, setAddingMember, syncFromCloud, heroBackground } = useStore();
  const { showAddMember } = usePermission();
  const { member: currentUser } = useAuth();
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [viewportW, setViewportW] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
  const [authModal, setAuthModal] = useState<"login" | "register" | "recovery" | null>(null);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-sync from cloud on page load
  useEffect(() => {
    syncFromCloud();
  }, []); // eslint-disable-line
  const totalPages = Math.ceil(members.length / membersPerPage);
  // 按职位排序：社长 > 副社长 > 指挥 > 登录的自己(社员) > 其他社员
  const ROLE_ORDER: Record<string, number> = { "社长": 0, "副社长": 1, "指挥": 2, "社员": 3 };
  const sortedMembers = [...members].sort((a, b) => {
    const aRank = a.id === currentUser?.id && a.role === "社员" ? 2.5 : (ROLE_ORDER[a.role] ?? 4);
    const bRank = b.id === currentUser?.id && b.role === "社员" ? 2.5 : (ROLE_ORDER[b.role] ?? 4);
    return aRank - bRank;
  });
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  );

  const marqueeRef = useRef<HTMLDivElement>(null);
  const [marqueeStyle, setMarqueeStyle] = useState<React.CSSProperties>({});

  // 动态计算重复次数和间距，确保滚动内容宽度 >= 屏幕 * TARGET_WIDTH
  const { repeatedMembers, gap } = useMemo(() => {
    const n = members.length || 1;
    const targetTotal = viewportW * TARGET_WIDTH;
    const minItemW = CARD_W + MIN_GAP;
    const minTotalPerSet = n * minItemW;
    const repeatCount = Math.max(2, Math.ceil(targetTotal / minTotalPerSet));

    const totalCards = n * repeatCount;
    const totalWithMinGap = totalCards * minItemW;
    let finalGap = MIN_GAP;
    if (totalWithMinGap < targetTotal) {
      finalGap = (targetTotal - CARD_W * totalCards) / totalCards;
      finalGap = Math.max(MIN_GAP, Math.min(finalGap, 120));
    }

    const repeated: typeof members = [];
    for (let r = 0; r < repeatCount; r++) {
      repeated.push(...members);
    }
    return { repeatedMembers: repeated, gap: finalGap };
  }, [members, viewportW]);

  // 渲染后测量一组成员的实际宽度，用 JS 动画精确滚动一组的距离
  const setupMarquee = useCallback(() => {
    const el = marqueeRef.current;
    if (!el || members.length === 0) return;
    // 一组成员的宽度 = N 个卡片 + (N-1) 个间距
    const oneSetW = members.length * CARD_W + (Math.max(0, members.length - 1)) * gap;
    const speed = 80; // px/s
    const duration = oneSetW / speed;
    // 通过 CSS 变量控制滚动距离，keyframes 中使用 calc(-1 * var(--marquee-offset))
    el.style.setProperty("--marquee-offset", `${oneSetW}px`);
    setMarqueeStyle({
      animation: `marquee-pixel ${duration}s linear infinite`,
    });
  }, [members.length, gap]);

  useEffect(() => {
    // 等 DOM 渲染完成后设置动画
    const raf = requestAnimationFrame(() => setupMarquee());
    return () => cancelAnimationFrame(raf);
  }, [setupMarquee]);

  return (
    <div className="relative min-h-screen w-full bg-ink-900">
      <Navbar onOpenBackground={() => setShowBgPicker(true)} onOpenLogin={() => setAuthModal("login")} />

      {/* ===== SECTION: Hero ===== */}
      <section id="hero" className="relative min-h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Ink wash mountain background */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center transition-all duration-1000 scale-105"
            style={{
              backgroundImage: `url('${heroBackground}')`,
              filter: "sepia(0.3) saturate(0.7) brightness(0.4) contrast(1.1)",
            }}
          />
          <div className="absolute inset-0 ink-wash-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-ink-900/70" />
        </div>

        {/* Central Logo */}
        <div className="relative z-20 flex flex-col items-center select-none mt-[-40px]">
          <HeroLogo />

          {/* Slogan */}
          <div className="mt-12 text-center max-w-2xl px-6">
            <div className="ink-divider w-32 mx-auto mb-6" />
            <h2 className="font-calligraphy text-gold-200 tracking-[0.4em] mb-4" style={{ fontSize: "28px" }}>
              燕云十六声 · 百业之巅
            </h2>
            <div className="ink-divider w-20 mx-auto my-4" />
            <p className="font-song text-gold-200/60 leading-relaxed text-sm">
              "展示各流派咸鱼大才，摸鱼我们是认真的！"
            </p>
          </div>
        </div>

        {/* Auto-scrolling Member Gallery - Ink Scroll Style */}
        <div className="absolute bottom-0 left-0 w-full z-30 pb-4">
          <div className="overflow-hidden">
            <div
              ref={marqueeRef}
              className="flex marquee-track w-max"
              style={{ gap: `${gap}px`, ...marqueeStyle }}
            >
              {repeatedMembers.map((member, i) => (
                <div
                  key={`${member.id}-${i}`}
                  onClick={() => setSelectedMember(member)}
                  className="flex-none w-24 aspect-[3/4] cursor-pointer group relative overflow-hidden rounded"
                  style={{ border: "1px solid rgba(193,155,77,0.2)" }}
                >
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[9px] text-gold-200 font-song tracking-tighter">{member.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION: Members ===== */}
      <section id="members" className="relative bg-ink-900">
        <main className="pt-20 pb-16 px-8 md:px-16 max-w-[1400px] mx-auto">
          {/* Section Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-400/10 pb-6">
            {/* 左侧：标题 */}
            <div>
              <h2 className="font-calligraphy text-gold-200 mb-2" style={{ fontSize: "36px" }}>
                百业成员
              </h2>
              <p className="font-song text-gold-200/40 text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="ink-divider w-8" />
                Members of Baiye
              </p>
            </div>

            {/* 中间：翻页 */}
            <div className="hidden md:block">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {/* 右侧：添加成员 */}
            {showAddMember && (
              <button onClick={() => setAddingMember(true)} className="flex items-center gap-2 px-5 py-2.5 btn-ink rounded text-sm font-song active:scale-95">
                <PenTool size={14} />
                <span>添加成员</span>
              </button>
            )}
          </div>

          {/* 移动端翻页（小屏显示在标题下方） */}
          <div className="md:hidden flex justify-center mb-8">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>

          <MemberGrid members={paginatedMembers} currentPage={currentPage} />
        </main>
      </section>

      {/* ===== SECTION: Photo Wall (3D 球形照片墙) ===== */}
      <PhotoWall />

      {/* ===== SECTION: Footer ===== */}
      <footer className="w-full bg-ink-900 border-t border-gold-400/10 flex flex-col md:flex-row justify-between items-center px-8 md:px-16 py-10">
        <div className="flex flex-col gap-3 mb-8 md:mb-0">
          <h3 className="font-calligraphy text-gold-200 text-xl tracking-widest">百业</h3>
          <p className="font-song text-gold-200/30 text-xs">© 1152 Baiye Guild. All Rights Reserved.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {["江湖规矩", "联络总舵", "隐私卷轴", "义气条款"].map((label) => (
            <a key={label} href="#" className="font-song text-xs text-gold-200/30 hover:text-gold-200/70 transition-colors">
              {label}
            </a>
          ))}
        </div>
      </footer>

      <MemberDetailModal />
      <EditModal />
      <DeleteConfirmDialog />
      <GitHubSync />
      <WelcomeToast />
      {showBgPicker && <BackgroundPicker onClose={() => setShowBgPicker(false)} />}

      {/* Auth Modals */}
      <LoginModal open={authModal === "login"} onClose={() => setAuthModal(null)}
        onSwitchToRegister={() => setAuthModal("register")} onSwitchToRecovery={() => setAuthModal("recovery")} />
      <RegisterModal open={authModal === "register"} onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal("login")} />
      <PasswordRecoveryModal open={authModal === "recovery"} onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal("login")} />
    </div>
  );
}
