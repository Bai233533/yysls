/* ================================================================
 *  游戏风格结尾 Footer
 *  - 参考燕云十六声官网风格
 *  - 包含：Logo、适龄提示、防沉迷、备案号、版权信息
 * ================================================================ */

import { useState } from "react";

export default function GameFooter() {
  const [showParentGuide, setShowParentGuide] = useState(false);

  return (
    <footer className="relative bg-ink-900 overflow-hidden">
      {/* 顶部装饰山景 */}
      <div
        className="w-full h-32 md:h-48 bg-cover bg-center bg-bottom"
        style={{
          backgroundImage:
            "url('https://picsum.photos/seed/mountainsilhouette/1920/200')",
          filter: "brightness(0.15) sepia(0.3)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 100%)",
        }}
      />

      {/* 主体内容 */}
      <div
        className="relative py-12 md:py-16"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,12,10,0.95) 0%, #0a0908 100%)",
        }}
      >
        <div className="max-w-[1000px] mx-auto px-8 text-center">
          {/* 游戏 Logo */}
          <div className="mb-8">
            <h2
              className="font-calligraphy text-gold-200 tracking-[0.3em] mb-2"
              style={{ fontSize: "32px" }}
            >
              情意结
            </h2>
            <p className="font-song text-gold-200/30 text-xs tracking-widest">
              燕云十六声 · 百业公会
            </p>
          </div>

          {/* 适龄提示 */}
          <div
            className="inline-block px-6 py-3 rounded-lg mb-6"
            style={{
              background: "rgba(193,155,77,0.05)",
              border: "1px solid rgba(193,155,77,0.15)",
            }}
          >
            <p className="font-song text-sm text-gold-200/60">
              适龄提示：本内容适合{" "}
              <span className="text-gold-200 font-medium">16岁</span>（含）以上用户
            </p>
          </div>

          {/* 健康游戏忠告 */}
          <div className="mb-8 space-y-1">
            <p className="font-song text-xs text-gold-200/40 leading-relaxed">
              抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。
            </p>
            <p className="font-song text-xs text-gold-200/40 leading-relaxed">
              适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。
            </p>
          </div>

          {/* 分隔线 */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent mb-8" />

          {/* 备案信息 */}
          <div className="space-y-2 mb-8">
            <p className="font-song text-xs text-gold-200/30">
              本公会为玩家自发组织，与游戏官方无关
            </p>
            <p className="font-song text-xs text-gold-200/30">
              燕云十六声 © 2024-2026 完美世界 版权所有
            </p>
          </div>

          {/* 底部链接 */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <button
              onClick={() => setShowParentGuide(true)}
              className="font-song text-xs text-gold-200/40 hover:text-gold-200/70 transition-colors"
            >
              点击查看家长关怀平台
            </button>
            <span className="font-song text-xs text-gold-200/20">|</span>
            <a
              href="#"
              className="font-song text-xs text-gold-200/40 hover:text-gold-200/70 transition-colors"
            >
              用户协议
            </a>
            <span className="font-song text-xs text-gold-200/20">|</span>
            <a
              href="#"
              className="font-song text-xs text-gold-200/40 hover:text-gold-200/70 transition-colors"
            >
              隐私政策
            </a>
          </div>

          {/* 版权声明 */}
          <p className="font-song text-[10px] text-gold-200/20">
            © 2024-2026 Baiye Guild. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* 家长关怀平台弹窗 */}
      {showParentGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(12,10,8,0.85)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowParentGuide(false)}
          />
          <div
            className="relative z-[210] w-[480px] max-w-[90vw] rounded-xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #1a1814 0%, #0d0c0a 100%)",
              border: "1px solid rgba(193,155,77,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(193,155,77,0.15)" }}>
              <h4 className="font-calligraphy text-lg text-gold-100 tracking-wider">
                家长关怀平台
              </h4>
            </div>
            <div className="px-6 py-5">
              <p className="font-song text-sm text-gold-200/60 leading-relaxed mb-4">
                为保护未成年人健康成长，我们提供家长关怀服务。如果您是未成年人的家长或监护人，可以通过以下方式联系我们：
              </p>
              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-lg bg-ink-900/50">
                  <p className="font-song text-xs text-gold-200/50 mb-1">
                    客服邮箱
                  </p>
                  <p className="font-song text-sm text-gold-100">
                    parent@baiye-guild.com
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-ink-900/50">
                  <p className="font-song text-xs text-gold-200/50 mb-1">
                    服务时间
                  </p>
                  <p className="font-song text-sm text-gold-100">
                    每日 9:00 - 21:00
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowParentGuide(false)}
                className="w-full py-2.5 rounded-lg font-song text-sm tracking-wider transition-all hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, #c19b4d 0%, #e9c176 100%)",
                  color: "#1a1814",
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
