import { useEffect, useState, useRef } from "react";
import MemberCard from "./MemberCard";
import type { Member } from "../data/members";

interface MemberGridProps {
  members: Member[];
  currentPage: number;
}

/**
 * 卡片网格分页组件
 * - 翻页时：旧卡片淡出 → 新卡片逐张淡入 + 微上浮
 * - 仅对单张卡片做 transform + opacity，容器不做动画，杜绝抽搐
 * - 固定容器高度，防止布局跳变
 * - 动画期间锁定分页按钮
 */
export default function MemberGrid({ members, currentPage }: MemberGridProps) {
  const [displayMembers, setDisplayMembers] = useState<Member[]>(members);
  const [entering, setEntering] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | "auto">("auto");
  const prevPageRef = useRef(currentPage);
  const isInitial = useRef(true);
  const prevMembersRef = useRef(members);

  // 非翻页场景（编辑/新增成员时），直接同步
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      prevMembersRef.current = members;
      setDisplayMembers(members);
      return;
    }
    if (prevMembersRef.current !== members) {
      prevMembersRef.current = members;
      setDisplayMembers(members);
      setEntering(false);
      setFadingOut(false);
    }
  }, [members]);

  // 页码变化时触发翻页动画
  useEffect(() => {
    if (isInitial.current) return;
    if (prevPageRef.current === currentPage) return;

    setIsAnimating(true);
    setFadingOut(true);

    // 旧卡片淡出
    const fadeTimer = setTimeout(() => {
      setDisplayMembers(members);
      setFadingOut(false);
      setEntering(true);

      // 新卡片逐张进场完成后恢复
      const enterDuration = 200 + members.length * 30;
      const doneTimer = setTimeout(() => {
        setEntering(false);
        setIsAnimating(false);
        prevPageRef.current = currentPage;
      }, enterDuration);

      return () => clearTimeout(doneTimer);
    }, 180);

    return () => clearTimeout(fadeTimer);
  }, [currentPage, members]);

  // 固定容器高度
  useEffect(() => {
    if (containerRef.current && !fadingOut) {
      setContainerHeight(containerRef.current.scrollHeight);
    }
  }, [displayMembers, fadingOut]);

  return (
    <div className="overflow-hidden rounded">
      <div
        ref={containerRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"
        style={{
          minHeight: typeof containerHeight === "number" ? `${containerHeight}px` : "auto",
        }}
      >
        {displayMembers.map((member, i) => (
          <div
            key={member.id}
            style={{
              opacity: fadingOut ? 0 : 1,
              transform: fadingOut
                ? "translateY(8px) scale(0.97)"
                : entering
                  ? "translateY(12px) scale(0.97)"
                  : "translateY(0) scale(1)",
              transition: entering
                ? `opacity 280ms cubic-bezier(0.22,1,0.36,1) ${i * 30}ms, transform 280ms cubic-bezier(0.22,1,0.36,1) ${i * 30}ms`
                : "opacity 180ms ease-out, transform 180ms ease-out",
              transitionDelay: fadingOut ? `${(members.length - 1 - i) * 15}ms` : undefined,
            }}
          >
            <MemberCard member={member} />
          </div>
        ))}
      </div>
    </div>
  );
}
