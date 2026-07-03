import { useEffect } from "react";

/**
 * 锁定 body 滚动，防止弹框打开时背景页面还能滚动。
 * 使用引用计数：多个弹框同时打开时，全部关闭后才恢复滚动。
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const html = document.documentElement;

    // 记录当前滚动位置
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // 计算滚动条宽度，避免锁定时布局抖动
    const scrollbarW = window.innerWidth - html.clientWidth;

    // 锁定滚动
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = "100%";
    body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      // 恢复滚动
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.width = "";
      body.style.paddingRight = "";

      // 恢复滚动位置
      window.scrollTo(scrollX, scrollY);
    };
  }, [active]);
}
