import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Pencil, BadgeCheck } from "lucide-react";
import Card3D from "../components/Card3D";
import { members } from "../data/members";

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = members.find((m) => m.id === Number(id));

  if (!member) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-headline-xl text-on-surface mb-4">成员未找到</h2>
          <Link to="/members" className="text-secondary hover:underline">
            返回成员列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface text-on-surface selection:bg-secondary overflow-x-hidden">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-surface to-transparent">
        <nav className="flex justify-between items-center px-6 py-4 max-w-[1440px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-label-sm text-label-sm">返回</span>
          </button>
          <Link to="/" className="font-headline-lg text-headline-lg font-bold text-secondary tracking-widest">
            Baiye
          </Link>
        </nav>
      </header>

      <main className="relative pt-24 pb-24 flex flex-col items-center justify-center min-h-screen">
        <div className="container mx-auto px-16 md:px-64 flex flex-col items-center relative z-10">
          {/* Hero Section / Member Card */}
          <div
            className="group relative w-full max-w-[420px] aspect-[3/4] rounded-xl overflow-hidden metallic-glow border border-outline-variant/30 wuxia-card-hover transition-all duration-500 shadow-2xl"
            style={{ transform: "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)" }}
          >
            {/* 3D Card */}
            <div className="absolute inset-0 z-0">
              <Card3D imageUrl={member.avatarUrl} />
            </div>

            {/* Paper Texture */}
            <div className="absolute inset-0 paper-grain pointer-events-none opacity-20" />

            {/* Top Text Overlay */}
            <div className="absolute top-12 left-0 w-full text-center px-6 flex flex-col gap-2 z-20">
              <h1 className="font-headline-xl text-headline-xl text-white drop-shadow-lg tracking-tight">
                {member.name}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant opacity-80 italic">
                {member.description}
              </p>
            </div>

            {/* Floating Glass Nameplate */}
            <div className="absolute bottom-6 left-6 right-6 z-30">
              <div className="backdrop-blur-xl bg-surface-dim/70 border border-outline-variant/20 p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-secondary overflow-hidden">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {member.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-secondary rounded-full p-0.5">
                        <BadgeCheck size={10} className="text-on-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-lg text-body-lg text-white font-bold">
                      @{member.title}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">
                      {member.role}
                    </span>
                  </div>
                </div>
                <button className="bg-secondary-container hover:bg-secondary hover:text-on-secondary text-secondary font-label-sm text-label-sm px-4 py-2 rounded-lg transition-all duration-300 active:scale-95 border border-secondary/20 shadow-inner">
                  查看更多
                </button>
              </div>
            </div>

            {/* Edit Button */}
            <button className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-secondary font-label-sm text-label-sm transition-all duration-300 hover:bg-black/60 hover:scale-105 active:scale-95">
              <Pencil size={16} />
              <span>编辑</span>
            </button>
          </div>

          {/* Stats Section */}
          <div className="mt-16 w-full max-w-xl flex flex-col items-center">
            <div className="ink-fade-divider w-full mb-2" />
            <div className="flex gap-8">
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-secondary">
                  {member.rank}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  RANK
                </p>
              </div>
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-secondary">
                  {member.karma}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  KARMA
                </p>
              </div>
              <div className="text-center">
                <p className="font-headline-md text-headline-md text-secondary">
                  {member.valor >= 1000
                    ? `${(member.valor / 1000).toFixed(1)}k`
                    : member.valor}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  VALOR
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
