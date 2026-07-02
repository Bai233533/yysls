import { Pencil, Trash2 } from "lucide-react";
import type { Member } from "../data/members";
import { useStore } from "../store/useStore";

interface MemberCardProps {
  member: Member;
  showActions?: boolean;
}

function getSealClass(role: string): string {
  if (role === "社长" || role === "副社长") return "seal-red";
  if (role === "指挥") return "seal-gold";
  return "seal-ink";
}

export default function MemberCard({ member, showActions = true }: MemberCardProps) {
  const setSelectedMember = useStore((s) => s.setSelectedMember);
  const setEditingMember = useStore((s) => s.setEditingMember);
  const setDeleteConfirmId = useStore((s) => s.setDeleteConfirmId);

  return (
    <div
      className="group relative rounded overflow-hidden cursor-pointer gold-border-card transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "linear-gradient(135deg, #f5f0e6 0%, #ebe4d4 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
      onClick={() => setSelectedMember(member)}
    >
      {/* Image Container */}
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          style={{ filter: "sepia(0.15) contrast(1.05) saturate(0.9)" }}
          loading="lazy"
        />
        {/* Ink edge feathering */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 30px rgba(245,240,230,0.6), inset 0 0 60px rgba(245,240,230,0.3)",
          }}
        />

        {/* Top-left Tags - Seal stamp style */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
          <span className="seal-stamp seal-ink bg-rice-100/80 backdrop-blur-sm text-[10px]">
            {member.name}
          </span>
          <span className={`seal-stamp ${getSealClass(member.role)} bg-rice-100/80 backdrop-blur-sm text-[9px]`}>
            {member.role}
          </span>
        </div>

        {/* Bottom-right Action Buttons */}
        {showActions && (
          <div className="absolute bottom-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="w-8 h-8 flex items-center justify-center rounded border border-gold-400/30 transition-all"
              style={{ background: "rgba(12,10,8,0.7)" }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingMember(member);
              }}
            >
              <Pencil size={13} className="text-gold-200" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded border border-gold-400/30 transition-all"
              style={{ background: "rgba(12,10,8,0.7)" }}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(member.id);
              }}
            >
              <Trash2 size={13} className="text-gold-200" />
            </button>
          </div>
        )}

        {/* Hover gold glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: "inset 0 0 20px rgba(193,155,77,0.2)" }}
        />
      </div>
    </div>
  );
}
