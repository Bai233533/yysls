import { useEffect, useRef } from "react";

/* ================================================================
 *  更新公告面板 — 点击导航栏铃铛按钮显示
 * ================================================================ */

interface NoticeItem {
  date: string;
  tag: string;
  content: string;
}

const NOTICE_LIST: NoticeItem[] = [
  {
    date: "2025-07-06",
    tag: "新功能",
    content: "新增成员称号功能，社长/副社长可为成员设置专属称号",
  },
  {
    date: "2025-07-06",
    tag: "优化",
    content: "照片墙升级为桶形球体布局，支持自适应紧凑排列",
  },
  {
    date: "2025-07-06",
    tag: "优化",
    content: "照片上传改为Storage存储，加载速度大幅提升",
  },
  {
    date: "2025-07-06",
    tag: "新功能",
    content: "新增成员头像裁剪功能，上传时可选择展示区域",
  },
  {
    date: "2025-07-06",
    tag: "新功能",
    content: "背景音乐系统上线，导航栏支持音量控制",
  },
  {
    date: "2025-07-06",
    tag: "优化",
    content: "全站性能优化：移除模糊滤镜、GPU加速、延迟渲染",
  },
  {
    date: "2025-07-06",
    tag: "新功能",
    content: "欢迎页预加载首页数据，提升跳转体验",
  },
  {
    date: "2025-07-05",
    tag: "修复",
    content: "修复走马灯照片闪烁和抽搐问题",
  },
  {
    date: "2025-07-05",
    tag: "修复",
    content: "修复编辑成员后数据库不更新的问题",
  },
  {
    date: "2025-07-05",
    tag: "修复",
    content: "修复刷新页面重复添加成员记录的问题",
  },
];

interface Props {
  onClose: () => void;
}

export default function NoticePanel({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const tagColor = (tag: string) => {
    switch (tag) {
      case "新功能": return { bg: "rgba(212,175,55,0.15)", border: "rgba(212,175,55,0.3)", text: "#e9c176" };
      case "优化": return { bg: "rgba(100,200,150,0.12)", border: "rgba(100,200,150,0.25)", text: "#8dd4a8" };
      case "修复": return { bg: "rgba(180,130,100,0.12)", border: "rgba(180,130,100,0.25)", text: "#c4a882" };
      default: return { bg: "rgba(200,200,200,0.1)", border: "rgba(200,200,200,0.2)", text: "#aaa" };
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[340px] max-h-[480px] rounded-xl border border-gold-400/20 overflow-hidden flex flex-col"
      style={{ background: "rgba(18,16,14,0.97)", boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }}
    >
      {/* 标题 */}
      <div className="px-5 py-3 border-b border-gold-400/10 flex items-center justify-between flex-none">
        <div>
          <h4 className="font-calligraphy text-base tracking-wider" style={{ color: "#e9c176" }}>更新公告</h4>
          <p className="font-song text-[9px] mt-0.5 tracking-wider" style={{ color: "rgba(233,193,118,0.3)" }}>UPDATE LOG</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse" title="有新内容" />
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(212,175,55,0.2) transparent" }}>
        {NOTICE_LIST.map((item, i) => {
          const tc = tagColor(item.tag);
          return (
            <div key={i} className="group">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-song px-1.5 py-0.5 rounded border"
                  style={{ background: tc.bg, borderColor: tc.border, color: tc.text }}
                >
                  {item.tag}
                </span>
                <span className="text-[10px] font-song" style={{ color: "rgba(233,193,118,0.3)" }}>
                  {item.date}
                </span>
              </div>
              <p className="text-xs font-song leading-relaxed pl-0.5" style={{ color: "rgba(233,193,118,0.65)" }}>
                {item.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
