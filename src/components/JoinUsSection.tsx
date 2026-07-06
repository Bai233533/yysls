/* ================================================================
 *  加入我们 Section
 *  - 入会流程、联系方式、招募信息
 *  - 水墨武侠风格设计
 * ================================================================ */

import { useState } from "react";
import {
  UserPlus,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Users,
} from "lucide-react";

const steps = [
  {
    step: "壹",
    title: "了解百业",
    desc: "浏览百业资料，了解我们的活动和须知",
  },
  {
    step: "贰",
    title: "联系管理",
    desc: "通过下方联系方式，添加百业社长的微信",
  },
  {
    step: "肆",
    title: "正式入会",
    desc: "加入公会频道，开启你的江湖之旅",
  },
];

const requirements = [
  "遵守公会规章制度，我们要做遵纪守法的好社员",
];

export default function JoinUsSection() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section id="joinus" className="relative bg-ink-900 py-20 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, rgba(233,193,118,1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-8 md:px-16">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="ink-divider w-24 mx-auto mb-6" />
          <h2
            className="font-calligraphy text-gold-200 mb-4"
            style={{ fontSize: "42px" }}
          >
            加入我们
          </h2>
          <p className="font-song text-gold-200/40 text-xs uppercase tracking-[0.3em]">
            JOIN US
          </p>
          <div className="ink-divider w-24 mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧：入会流程 */}
          <div>
            <h3 className="font-calligraphy text-2xl text-gold-100 mb-8 tracking-wider flex items-center gap-3">
              <UserPlus size={24} className="text-gold-400" />
              加入我们流程
            </h3>

            <div className="space-y-4">
              {steps.map((item, index) => (
                <div
                  key={index}
                  className="relative flex items-start gap-4 p-4 rounded-lg transition-all duration-300 cursor-pointer"
                  style={{
                    background:
                      hoveredStep === index
                        ? "rgba(193,155,77,0.08)"
                        : "transparent",
                    border: "1px solid rgba(193,155,77,0.1)",
                  }}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* 步骤编号 */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-none font-calligraphy text-xl"
                    style={{
                      background:
                        hoveredStep === index
                          ? "linear-gradient(135deg, #c19b4d 0%, #e9c176 100%)"
                          : "rgba(193,155,77,0.1)",
                      color: hoveredStep === index ? "#1a1814" : "#e9c176",
                      border: "1px solid rgba(193,155,77,0.3)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {item.step}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <h4 className="font-calligraphy text-lg text-gold-100 mb-1">
                      {item.title}
                    </h4>
                    <p className="font-song text-sm text-gold-200/50">
                      {item.desc}
                    </p>
                  </div>

                  {/* 箭头 */}
                  {index < steps.length - 1 && (
                    <ArrowRight
                      size={16}
                      className="absolute -bottom-3 left-8 text-gold-400/30 rotate-90"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：入会要求 + 联系方式 */}
          <div className="space-y-8">
            {/* 入会要求 */}
            <div
              className="p-6 rounded-lg"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,24,20,0.8) 0%, rgba(13,12,10,0.9) 100%)",
                border: "1px solid rgba(193,155,77,0.15)",
              }}
            >
              <h3 className="font-calligraphy text-2xl text-gold-100 mb-6 tracking-wider flex items-center gap-3">
                <CheckCircle size={24} className="text-gold-400" />
                加入要求
              </h3>

              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 font-song text-sm text-gold-200/60"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* 联系方式 */}
            <div
              className="p-6 rounded-lg"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,24,20,0.8) 0%, rgba(13,12,10,0.9) 100%)",
                border: "1px solid rgba(193,155,77,0.15)",
              }}
            >
              <h3 className="font-calligraphy text-2xl text-gold-100 mb-6 tracking-wider flex items-center gap-3">
                <MessageCircle size={24} className="text-gold-400" />
                联系方式
              </h3>

              <div className="space-y-4">
                {/* 社长微信 */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-ink-900/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(193,155,77,0.1)" }}
                  >
                    <Users size={20} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="font-song text-sm text-gold-200/70">
                      社长微信
                    </p>
                    <p className="font-song text-lg text-gold-100 font-medium">
                      Baiye_Guild
                    </p>
                  </div>
                </div>

                {/* 副社长微信 */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-ink-900/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(193,155,77,0.1)" }}
                  >
                    <Users size={20} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="font-song text-sm text-gold-200/70">
                      副社长微信
                    </p>
                    <p className="font-song text-lg text-gold-100 font-medium">
                      Vice_Leader
                    </p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
}
