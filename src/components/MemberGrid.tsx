import { useEffect, useState, useRef } from "react";
import MemberCard from "./MemberCard";
import type { Member } from "../data/members";

interface MemberGridProps {
  members: Member[];
  currentPage: number;
}

export default function MemberGrid({ members, currentPage }: MemberGridProps) {
  const [animState, setAnimState] = useState<"entering" | "idle" | "exiting">("idle");
  const prevPage = useRef(currentPage);
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }

    if (prevPage.current === currentPage) return;

    setAnimState("exiting");
    const exitTimer = setTimeout(() => {
      setAnimState("entering");
      const enterTimer = setTimeout(() => setAnimState("idle"), 350);
      return () => clearTimeout(enterTimer);
    }, 300);

    prevPage.current = currentPage;
    return () => clearTimeout(exitTimer);
  }, [currentPage]);

  return (
    <div className="overflow-hidden rounded">
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 transition-all duration-300 ease-in-out"
        style={{
          opacity: animState === "exiting" ? 0 : 1,
          transform: animState === "exiting" ? "translateY(12px) scale(0.98)" : "translateY(0) scale(1)",
        }}
      >
        {members.map((member, i) => (
          <div
            key={member.id}
            className="transition-all duration-300"
            style={{
              opacity: animState === "entering" ? 0 : 1,
              transform: animState === "entering" ? "translateY(16px)" : "translateY(0)",
              transitionDelay: animState === "entering" ? `${i * 40}ms` : "0ms",
            }}
          >
            <MemberCard member={member} />
          </div>
        ))}
      </div>
    </div>
  );
}
