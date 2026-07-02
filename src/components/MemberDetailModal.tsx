import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

export default function MemberDetailModal() {
  const { members, selectedMember, setSelectedMember } = useStore();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Always look up the latest member data from the store
  const member = selectedMember ? members.find((m) => m.id === selectedMember.id) ?? null : null;

  useEffect(() => {
    if (member) { setVisible(true); setClosing(false); }
  }, [member?.id]);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setVisible(false); setSelectedMember(null); }, 250);
  };

  if (!member && !visible) return null;
  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ animation: closing ? "modalOut 0.25s cubic-bezier(0.4,0,1,1) forwards" : "modalIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(12,10,8,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={close}
      />

      {/* Card */}
      <div
        className="relative z-[105] w-[300px] sm:w-[340px] aspect-[3/4] rounded overflow-hidden group"
        style={{ boxShadow: "0 0 0 1px rgba(193,155,77,0.3), 0 0 40px rgba(193,155,77,0.1), 0 20px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Background Image */}
        <img src={member.detailUrl} alt={member.name} className="absolute inset-0 w-full h-full object-cover" />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-transparent to-ink-900/60" />

        {/* Top: Name & Title */}
        <div className="absolute top-8 left-0 w-full text-center z-10 px-4">
          <h2 className="text-gold-100 text-3xl font-calligraphy tracking-wider"
            style={{ textShadow: "0 0 20px rgba(233,193,118,0.3), 0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {member.name}
          </h2>
          <p className="text-gold-200/50 text-sm mt-1.5 tracking-widest font-song"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
          >
            {member.title}
          </p>
        </div>

        {/* Bottom: Glass Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3">
          <div className="px-4 py-3 rounded flex items-center gap-3"
            style={{ background: "rgba(12,10,8,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(193,155,77,0.2)" }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-400/40 flex-none">
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-gold-100 text-sm font-song font-semibold truncate">@{member.title}</span>
              <span className="text-gold-200/50 text-xs font-song truncate">{member.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
