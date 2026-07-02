import { PenTool } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useStore } from "../store/useStore";

export default function HomePage() {
  const { members, currentPage, membersPerPage, setCurrentPage, setSelectedMember, setAddingMember, syncFromCloud, heroBackground } = useStore();
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Auto-sync from cloud on page load
  useEffect(() => {
    syncFromCloud();
  }, []); // eslint-disable-line
  const totalPages = Math.ceil(members.length / membersPerPage);
  const paginatedMembers = members.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  );
  const doubledMembers = [...members, ...members];

  return (
    <div className="relative min-h-screen w-full bg-ink-900">
      <Navbar onOpenBackground={() => setShowBgPicker(true)} />

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
            <div className="flex gap-2 animate-marquee w-max">
              {doubledMembers.map((member, i) => (
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
                    style={{ filter: "sepia(0.2) saturate(0.8) brightness(0.8)" }}
                    loading="lazy"
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
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-calligraphy text-gold-200 mb-2" style={{ fontSize: "36px" }}>
                百业成员
              </h2>
              <p className="font-song text-gold-200/40 text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="ink-divider w-8" />
                Members of Baiye
              </p>
            </div>
            <button onClick={() => setAddingMember(true)} className="flex items-center gap-2 px-5 py-2.5 btn-ink rounded text-sm font-song active:scale-95">
              <PenTool size={14} />
              <span>添加成员</span>
            </button>
          </div>

          <MemberGrid members={paginatedMembers} currentPage={currentPage} />

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
      {showBgPicker && <BackgroundPicker onClose={() => setShowBgPicker(false)} />}
    </div>
  );
}
