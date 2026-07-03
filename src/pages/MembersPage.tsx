import { UserPlus } from "lucide-react";
import Navbar from "../components/Navbar";
import MemberGrid from "../components/MemberGrid";
import Pagination from "../components/Pagination";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";

export default function MembersPage() {
  const { currentPage, membersPerPage, members, setCurrentPage } = useStore();
  const { member: currentUser } = useAuth();
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

  return (
    <div className="relative min-h-screen bg-surface text-on-surface selection:bg-secondary/30">
      <Navbar />

      <main className="pt-32 pb-24 px-16 md:px-64 max-w-[1440px] mx-auto relative">
        {/* Atmospheric Background Elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-tertiary-container/10 blur-[150px] rounded-full pointer-events-none" />

        {/* Section Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-outline-variant/20 pb-8">
            <div>
              <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2 tracking-tight">
                百业成员
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant opacity-70 flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="w-8 h-[1px] bg-secondary/50" />
                Members of Baiye
              </p>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            <button className="group relative flex items-center gap-3 px-8 py-3 rounded-none btn-metallic text-on-surface font-label-sm text-label-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-secondary/10 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <UserPlus size={16} />
              <span className="relative z-10">添加成员</span>
            </button>
          </div>
        </section>

        {/* Members Grid */}
        <MemberGrid members={paginatedMembers} currentPage={currentPage} />
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-lowest border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center px-16 md:px-64 py-12">
        <div className="flex flex-col gap-4 mb-8 md:mb-0">
          <h3 className="font-headline-md text-headline-md text-secondary tracking-widest">
            1152 Baiye
          </h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
            © 1152 Baiye Guild. All Rights Reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100">
            Guild Laws
          </a>
          <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100">
            Contact High Command
          </a>
          <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100">
            Privacy Scrolls
          </a>
          <a href="#" className="font-label-sm text-label-sm text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100">
            Terms of Honor
          </a>
        </div>
      </footer>
    </div>
  );
}
