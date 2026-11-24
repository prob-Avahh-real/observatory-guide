import { VIDEO_THEMES } from '../data/tourVideos.js';
import { OBSERVATORIES } from '../data/observatories.js';

const CACHE_NAME = 'observatory-videos-v1';
const META_KEY = 'observatory-cache-meta';

/** 收集所有不重复的视频 URL（仅 8 个主题视频，去重后体积小） */
export function collectUniqueVideoUrls() {
  const urls = new Set();
  for (const theme of Object.values(VIDEO_THEMES)) {
    if (theme.url) urls.add(theme.url);
  }
  for (const obs of OBSERVATORIES) {
    for (const scene of obs.tour || []) {
      if (scene.videoUrl) urls.add(scene.videoUrl);
    }
  }
  return [...urls];
}

export function isCacheSupported() {
  return typeof caches !== 'undefined';
}

async function openCache() {
  return caches.open(CACHE_NAME);
}

/** 读取缓存元数据 */
export function getCacheMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCacheMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** 查询已缓存 URL 列表 */
export async function getCachedUrls() {
  if (!isCacheSupported()) return [];
  const cache = await openCache();
  const keys = await cache.keys();
  return keys.map((r) => r.url);
}

/** 缓存统计 */
export async function getCacheStats() {
  const urls = collectUniqueVideoUrls();
  const cached = await getCachedUrls();
  const cachedSet = new Set(cached);
  const hit = urls.filter((u) => cachedSet.has(u)).length;
  return {
    total: urls.length,
    cached: hit,
    ready: hit === urls.length,
    pct: urls.length ? Math.round((hit / urls.length) * 100) : 0,
  };
}

/** 下载并缓存单个视频 */
export async function fetchAndCache(url) {
  if (!isCacheSupported()) return false;
  const cache = await openCache();
  if (await cache.match(url)) return true;

  const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  await cache.put(url, resp.clone());

  const meta = getCacheMeta();
  meta[url] = { at: Date.now(), size: Number(resp.headers.get('content-length')) || 0 };
  saveCacheMeta(meta);
  return true;
}

/** 解析播放 URL：优先本地缓存 blob，否则远程 + 后台缓存 */
export async function resolveVideoUrl(remoteUrl) {
  if (!remoteUrl) return remoteUrl;
  if (!isCacheSupported()) return remoteUrl;

  try {
    const cache = await openCache();
    const hit = await cache.match(remoteUrl);
    if (hit) {
      const blob = await hit.blob();
      return URL.createObjectURL(blob);
    }
    fetchAndCache(remoteUrl).catch(() => {});
    return remoteUrl;
  } catch {
    return remoteUrl;
  }
}

/** 批量预缓存，支持进度回调 */
export async function prefetchAll(onProgress) {
  const urls = collectUniqueVideoUrls();
  let done = 0;
  let failed = 0;

  for (const url of urls) {
    try {
      await fetchAndCache(url);
    } catch {
      failed++;
    }
    done++;
    onProgress?.({ done, total: urls.length, failed, url, pct: Math.round((done / urls.length) * 100) });
  }

  return { done, total: urls.length, failed };
}

/** 清除全部视频缓存 */
export async function clearVideoCache() {
  if (!isCacheSupported()) return;
  await caches.delete(CACHE_NAME);
  localStorage.removeItem(META_KEY);
}

/** 启动后台静默预缓存（Wi-Fi 友好：仅缓存尚未命中的） */
export async function prefetchInBackground(onProgress) {
  const urls = collectUniqueVideoUrls();
  const cached = new Set(await getCachedUrls());
  const pending = urls.filter((u) => !cached.has(u));
  if (!pending.length) {
    onProgress?.({ done: urls.length, total: urls.length, failed: 0, pct: 100, silent: true });
    return { done: urls.length, total: urls.length, failed: 0 };
  }

  let done = urls.length - pending.length;
  let failed = 0;
  for (const url of pending) {
    try {
      await fetchAndCache(url);
    } catch {
      failed++;
    }
    done++;
    onProgress?.({ done, total: urls.length, failed, url, pct: Math.round((done / urls.length) * 100) });
    await new Promise((r) => setTimeout(r, 100));
  }
  return { done, total: urls.length, failed };
}
