import { Pencil, Trash2 } from "lucide-react";
import { useRef, useCallback } from "react";
import type { Member } from "../data/members";
import { useStore } from "../store/useStore";

interface MemberCardProps {
  member: Member;
  showActions?: boolean;
}

/* 角色对应标签颜色（暗金古风风格） */
const roleColorMap: Record<string, { bg: string; text: string; border?: string }> = {
  社长:     { bg: "rgba(150,30,30,0.85)",  text: "#f5e6c8", border: "1px solid rgba(230,180,90,0.4)" },
  副社长:   { bg: "rgba(120,25,25,0.8)",   text: "#f5e6c8", border: "1px solid rgba(230,180,90,0.3)" },
  指挥:     { bg: "rgba(150,110,40,0.8)",  text: "#fff5d6", border: "1px solid rgba(230,180,90,0.4)" },
  副指挥:   { bg: "rgba(120,85,30,0.75)",  text: "#fff5d6", border: "1px solid rgba(230,180,90,0.3)" },
  管理:     { bg: "rgba(50,80,140,0.8)",   text: "#e8eef8", border: "1px solid rgba(100,150,220,0.4)" },
  "百业成员": { bg: "rgba(50,48,44,0.75)",   text: "#d4c5a0", border: "1px solid rgba(193,155,77,0.25)" },
};

function getRoleColor(role: string) {
  return roleColorMap[role] || { bg: "rgba(50,48,44,0.7)", text: "#d4c5a0", border: "1px solid rgba(193,155,77,0.2)" };
}

export default function MemberCard({ member, showActions = true }: MemberCardProps) {
  const setSelectedMember = useStore((s) => s.setSelectedMember);
  const setEditingMember = useStore((s) => s.setEditingMember);
  const setDeleteConfirmId = useStore((s) => s.setDeleteConfirmId);
  const roleColor = getRoleColor(member.role);

  const cardRef = useRef<HTMLDivElement>(null);
  const shakeTimer = useRef<number | null>(null);

  /* 点击摇摆效果 */
  const handleClick = useCallback(() => {
    setSelectedMember(member);
    if (!cardRef.current) return;
    const el = cardRef.current;
    /* 先清除可能正在进行的动画 */
    if (shakeTimer.current) {
      cancelAnimationFrame(shakeTimer.current);
      el.style.transform = "";
    }
    let t = 0;
    const total = 24;
    const shake = () => {
      t++;
      const progress = t / total;
      /* 阻尼振荡：先左后右，幅度递减 */
      const angle = Math.sin(progress * Math.PI * 2.5) * 6 * (1 - progress);
      el.style.transform = `perspective(600px) rotateY(${angle}deg) translateY(-2px)`;
      if (t < total) {
        shakeTimer.current = requestAnimationFrame(shake);
      } else {
        el.style.transform = "";
        shakeTimer.current = null;
      }
    };
    shake();
  }, [member, setSelectedMember]);

  return (
    <div
      ref={cardRef}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 mc-card"
      style={{
        background: "linear-gradient(135deg, #1a1814 0%, #0d0c0a 100%)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        border: "1px solid rgba(193,155,77,0.15)",
        transformStyle: "preserve-3d",
      }}
      onClick={handleClick}
    >
      {/* 满版头像 */}
      <div className="aspect-[3/4] relative overflow-hidden">
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: "sepia(0.1) contrast(1.02)" }}
          loading="lazy"
        />

        {/* 古风水印边缘 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: "inset 0 0 24px rgba(0,0,0,0.4)" }}
        />

        {/* 流光扫过效果 */}
        <div className="mc-shine" />

        {/* 角色标签：左上角 */}
        <span
          className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-[10px] font-song tracking-wider z-10 backdrop-blur-sm"
          style={{ background: roleColor.bg, color: roleColor.text, border: roleColor.border }}
        >
          {member.role}
        </span>

        {/* 底部渐变遮罩 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* 操作按钮：右下角 */}
        {showActions && (
          <div className="absolute bottom-2.5 right-2.5 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="w-7 h-7 flex items-center justify-center rounded bg-black/70 text-gold-200/70 hover:text-gold-200 hover:bg-black/90 transition-all border border-gold-400/20 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingMember(member);
              }}
              title="编辑"
            >
              <Pencil size={12} />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded bg-black/70 text-gold-200/70 hover:text-red-400 hover:bg-black/90 transition-all border border-gold-400/20 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(member.id);
              }}
              title="删除"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 卡片底部金边装饰 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] mc-gold-line" />
    </div>
  );
}
