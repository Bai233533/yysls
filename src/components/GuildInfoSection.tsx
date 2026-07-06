/* ================================================================
 *  百业资料 Section
 *  - 公会介绍、成员福利、活动安排等信息展示
 *  - 进群须知公告
 *  - 水墨武侠风格卡片设计
 * ================================================================ */

import { Users, AlertTriangle, Gamepad2, Clock, Ban, HeartHandshake } from "lucide-react";

const noticeItems = [
  {
    icon: Users,
    title: "进群须知",
    items: [
      "进群请修改游戏名字，方便找人，最好加上职业（输出/奶妈/肉盾）",
    ],
  },
  {
    icon: Clock,
    title: "活动时间",
    items: [
      "百业派对：每晚 20:00",
      "破军杀将：每周二、四 20:30",
      "一决高下：每周一、三 20:00",
      "百业本+周本发车：派对结束以后组织（会照顾到每个人都打一遍，没打的群里说一下）",
      "活动开始前会提前@大家",
    ],
  },
  {
    icon: Gamepad2,
    title: "业余活动",
    items: [
      "副本结束之余我们也会开展其他活动",
      "如有想玩的可以群里或私聊社长",
      "参加的人多均会采纳并实施",
      "活动中选取获奖者给予不同奇遇",
      "不管小活动或大活动都希望大家积极参加，都会有不同的奇遇",
    ],
  },
  {
    icon: Ban,
    title: "群规禁令",
    items: [
      "群内禁止黄腔、骂人、吵架",
      "如有矛盾可私下解决或联系社长（蠢蠢哟）",
      "社长不在可联系管理（白予诗、江如琳）",
      "遵守社会主义核心价值观，做五星好市民",
    ],
  },
  {
    icon: HeartHandshake,
    title: "互帮互助",
    items: [
      "群内有打本或者要帮忙的随时招呼",
      "大家有空可以互相帮助",
      "群内黑工常在，社长是万能社长",
      "有事找社长~",
    ],
  },
  {
    icon: AlertTriangle,
    title: "活跃度要求",
    items: [
      "活跃度卡1500",
      "满一周未上线者管理会联系",
      "超过两天未回复者将请离百业",
      "如有临时有事可联系社长或副社或管理说明",
      "一个月可有一周活跃度不满",
    ],
  },
];

export default function GuildInfoSection() {
  return (
    <section id="guildnotice" className="relative bg-ink-900 py-20">
      {/* 顶部水墨山水分隔线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-8 md:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="ink-divider w-24 mx-auto mb-6" />
          <h2
            className="font-calligraphy text-gold-200 mb-4"
            style={{ fontSize: "42px" }}
          >
            进百业须知
          </h2>
          <p className="font-song text-gold-200/40 text-xs uppercase tracking-[0.3em]">
            GUILD NOTICE
          </p>
          <div className="ink-divider w-24 mx-auto mt-6" />
        </div>

        {/* Notice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticeItems.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={index}
                className="group relative p-5 rounded-lg transition-all duration-500 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(26,24,20,0.9) 0%, rgba(13,12,10,0.95) 100%)",
                  border: "1px solid rgba(193,155,77,0.12)",
                }}
              >
                {/* 悬停流光效果 */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, transparent 30%, rgba(233,193,118,0.05) 50%, transparent 70%)",
                  }}
                />

                {/* 标题 */}
                <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(193,155,77,0.1)" }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-none"
                    style={{ background: "rgba(193,155,77,0.1)" }}
                  >
                    <Icon size={18} className="text-gold-400" />
                  </div>
                  <h3 className="font-calligraphy text-xl text-gold-100 tracking-wider">
                    {section.title}
                  </h3>
                </div>

                {/* 内容列表 */}
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 font-song text-sm text-gold-200/60 leading-relaxed"
                    >
                      <span className="text-gold-400/60 mt-1 flex-none">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* 底部装饰线 */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-1/2 h-px transition-all duration-500"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(233,193,118,0.5), transparent)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 公会宣言 */}
        <div className="mt-16 text-center">
          <div
            className="inline-block px-8 py-6 rounded-lg"
            style={{
              background: "rgba(193,155,77,0.05)",
              border: "1px solid rgba(193,155,77,0.15)",
            }}
          >
            <p className="font-calligraphy text-2xl text-gold-200/80 tracking-wider">
              「 江湖路远，义字当先 」
            </p>
            <p className="font-song text-sm text-gold-200/40 mt-2">
              — 燕云十六声 · 百业公会 —
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
