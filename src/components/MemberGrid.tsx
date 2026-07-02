import { useEffect, useState, useRef } from "react";
import MemberCard from "./MemberCard";
import type { Member } from "../data/members";

interface MemberGridProps {
  members: Member[];
  currentPage: number;
}

/**
 * 卡片网格分页组件
 * - 固定容器高度，杜绝布局跳动
 * - 退场动画 → 替换数据 → 进场动画，时序严格分离
 * - 仅使用 transform + opacity，不触发重排
 * - 动画期间锁定分页按钮，防止叠加
 */
export default function MemberGrid({ members, currentPage }: MemberGridProps) {
  // 动画阶段：idle / exiting / entering
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  // 当前展示的成员数据
  const [displayMembers, setDisplayMembers] = useState<Member[]>(members);
  // 容器固定高度，防止跳变
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | "auto">("auto");
  // 锁定分页按钮
  const [isAnimating, setIsAnimating] = useState(false);
  // 记录上一次的页码
  const prevPageRef = useRef(currentPage);

  // 初始化时直接展示，无动画
  const isInitial = useRef(true);
  const prevMembersRef = useRef(members);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      prevMembersRef.current = members;
      setDisplayMembers(members);
      return;
    }
    // 非翻页场景（编辑/新增成员时），直接同步更新显示数据
    if (prevMembersRef.current !== members) {
      prevMembersRef.current = members;
      setDisplayMembers(members);
    }
  }, [members]);

  // 页码变化时触发动画
  useEffect(() => {
    if (isInitial.current) return;
    if (prevPageRef.current === currentPage) return;

    // 锁定动画
    setIsAnimating(true);
    setPhase("exiting");

    // 退场动画结束后，替换数据，触发进场
    const exitTimer = setTimeout(() => {
      setDisplayMembers(members);
      setPhase("entering");

      // 进场动画结束后，恢复 idle
      const enterTimer = setTimeout(() => {
        setPhase("idle");
        setIsAnimating(false);
        prevPageRef.current = currentPage;
      }, 250 + (members.length - 1) * 25);

      return () => clearTimeout(enterTimer);
    }, 200);

    return () => clearTimeout(exitTimer);
  }, [currentPage, members]);

  // 固定容器高度：测量实际高度后锁定
  useEffect(() => {
    if (containerRef.current && phase === "idle") {
      setContainerHeight(containerRef.current.scrollHeight);
    }
  }, [displayMembers, phase]);

  return (
    <div className="overflow-hidden rounded">
      {/* 固定高度容器，防止跳变 */}
      <div
        ref={containerRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"
        style={{
          minHeight: typeof containerHeight === "number" ? `${containerHeight}px` : "auto",
          opacity: phase === "exiting" ? 0 : 1,
          transform: phase === "exiting" ? "translateY(-12px)" : "translateY(0)",
          transition: "opacity 200ms cubic-bezier(0.4,0,0.2,1), transform 200ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {displayMembers.map((member, i) => (
          <div
            key={member.id}
            style={{
              opacity: phase === "entering" ? 0 : 1,
              transform: phase === "entering" ? "translateY(16px)" : "translateY(0)",
              transition: "opacity 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1)",
              transitionDelay: phase === "entering" ? `${i * 25}ms` : "0ms",
            }}
          >
            <MemberCard member={member} />
          </div>
        ))}
      </div>
    </div>
  );
}
