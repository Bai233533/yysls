/**
 * 预加载工具 - 提前加载图片和视频，确保流畅浏览
 */

// 检测是否为移动设备
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// 检测URL是否为视频
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("data:video") || 
         url.endsWith(".mp4") || 
         url.endsWith(".webm") || 
         url.endsWith(".ogg") ||
         url.includes("/video/");
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 预加载单张图片
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url || url.startsWith("data:")) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// 预加载单个视频（只加载元数据）
function preloadVideo(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => resolve();
    video.onerror = () => resolve();
    video.src = url;
  });
}

// 预加载单个媒体（自动判断图片或视频）
export function preloadMedia(url: string): Promise<void> {
  if (!url) return Promise.resolve();
  if (isVideoUrl(url)) {
    return preloadVideo(url);
  }
  return preloadImage(url);
}

// 批量预加载（移动端降低并发+加间隔，避免Safari阻塞）
async function batchPreload(urls: string[], concurrency?: number): Promise<void> {
  const validUrls = urls.filter(url => url && url.length > 0);
  if (validUrls.length === 0) return;

  const mobile = isMobile();
  const batch = concurrency ?? (mobile ? 3 : 6);
  const gap = mobile ? 80 : 0; // 移动端每批间隔80ms，给浏览器喘息

  for (let i = 0; i < validUrls.length; i += batch) {
    const chunk = validUrls.slice(i, i + batch);
    await Promise.all(chunk.map(url => preloadMedia(url)));
    if (gap && i + batch < validUrls.length) {
      await delay(gap);
    }
  }
}

// 预加载会员头像（移动端用，只加载小图）
export function preloadAvatars(members: Array<{ avatarUrl?: string }>): Promise<void> {
  const urls = members.map(m => m.avatarUrl || "").filter(Boolean);
  if (urls.length === 0) return Promise.resolve();
  console.log(`[Preload] 预加载 ${urls.length} 个头像...`);
  return batchPreload(urls);
}

// 预加载会员详情媒体（桌面端用）
export function preloadMemberMedia(members: Array<{
  detailUrl?: string;
  detailMedia1?: string;
  detailMedia2?: string;
  detailMedia3?: string;
}>): Promise<void> {
  const urls: string[] = [];
  
  members.forEach(member => {
    if (member.detailUrl) urls.push(member.detailUrl);
    if (member.detailMedia1) urls.push(member.detailMedia1);
    if (member.detailMedia2) urls.push(member.detailMedia2);
    if (member.detailMedia3) urls.push(member.detailMedia3);
  });

  console.log(`[Preload] 开始预加载 ${urls.length} 个会员媒体...`);
  return batchPreload(urls);
}

// 预加载照片墙图片
export function preloadWallPhotos(photos: Array<{ src?: string }>): Promise<void> {
  const urls = photos.map(p => p.src || "").filter(Boolean);
  if (urls.length === 0) return Promise.resolve();

  console.log(`[Preload] 开始预加载 ${urls.length} 张照片墙图片...`);
  return batchPreload(urls);
}

// 综合预加载：移动端只预加载头像+照片墙，桌面端预加载全部详情图
export async function preloadAll(
  members: Array<{
    avatarUrl?: string;
    detailUrl?: string;
    detailMedia1?: string;
    detailMedia2?: string;
    detailMedia3?: string;
  }>,
  wallPhotos: Array<{ src?: string }>
): Promise<void> {
  const startTime = Date.now();
  
  if (isMobile()) {
    // 移动端：只预加载头像（小图），不预加载详情图（大图），等用户点击时再加载
    await preloadAvatars(members);
    await preloadWallPhotos(wallPhotos);
    console.log(`[Preload] 移动端模式：仅预加载头像+照片墙`);
  } else {
    // 桌面端：并行预加载全部详情图+照片墙
    await Promise.all([
      preloadMemberMedia(members),
      preloadWallPhotos(wallPhotos),
    ]);
  }

  const elapsed = Date.now() - startTime;
  console.log(`[Preload] 全部预加载完成，耗时 ${elapsed}ms`);
}
