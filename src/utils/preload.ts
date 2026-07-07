/**
 * 预加载工具 - 提前加载图片和视频，确保流畅浏览
 */

// 检测URL是否为视频
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("data:video") || 
         url.endsWith(".mp4") || 
         url.endsWith(".webm") || 
         url.endsWith(".ogg") ||
         url.includes("/video/");
}

// 预加载单张图片
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url || url.startsWith("data:")) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // 加载失败也继续
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
    video.preload = "metadata"; // 只加载元数据，不下载完整视频
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

// 批量预加载（并发限制）
async function batchPreload(urls: string[], concurrency = 6): Promise<void> {
  const validUrls = urls.filter(url => url && url.length > 0);
  if (validUrls.length === 0) return;

  // 分批处理
  for (let i = 0; i < validUrls.length; i += concurrency) {
    const batch = validUrls.slice(i, i + concurrency);
    await Promise.all(batch.map(url => preloadMedia(url)));
  }
}

// 预加载会员详情媒体
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

// 综合预加载（会员 + 照片墙）
export async function preloadAll(
  members: Array<{
    detailUrl?: string;
    detailMedia1?: string;
    detailMedia2?: string;
    detailMedia3?: string;
  }>,
  wallPhotos: Array<{ src?: string }>
): Promise<void> {
  const startTime = Date.now();
  
  // 并行预加载会员媒体和照片墙
  await Promise.all([
    preloadMemberMedia(members),
    preloadWallPhotos(wallPhotos),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`[Preload] 全部预加载完成，耗时 ${elapsed}ms`);
}
