#!/usr/bin/env node
import { readFileSync } from 'fs';
import { OBSERVATORIES, getObservatoryById } from '../src/data/observatories.js';
import { collectUniqueVideoUrls, isCacheSupported } from '../src/cache/videoCache.js';
import { VIDEO_THEMES, OBSERVATORY_VIDEOS } from '../src/data/tourVideos.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error(`  ✗ ${msg}`);
}

console.log('🔭 星观台 · 测试\n');

assert(OBSERVATORIES.length >= 25, `至少 25 个台站 (实际 ${OBSERVATORIES.length})`);

const ids = new Set();
let withVideo = 0;
for (const o of OBSERVATORIES) {
  assert(o.id && o.name && o.lat && o.lng, `台站 ${o.id || '?'} 缺少必要字段`);
  assert(!ids.has(o.id), `重复 ID: ${o.id}`);
  ids.add(o.id);
  assert(o.tour && o.tour.length >= 3, `${o.id} 导览场景不足`);
  assert(o.instruments && o.instruments.length >= 1, `${o.id} 缺少设备信息`);
  assert(o.voiceIntro && o.description, `${o.id} 缺少讲解文本`);
  for (const scene of o.tour) {
    if (scene.videoUrl) withVideo++;
  }
}

assert(withVideo >= OBSERVATORIES.length * 3, `导览视频覆盖不足 (${withVideo} 场景有视频)`);
assert(getObservatoryById('fast-guizhou')?.name.includes('FAST'), 'FAST 天眼数据正确');
assert(getObservatoryById('bj-planetarium')?.type === 'public', '北京天文馆已收录');
assert(getObservatoryById('shao-museum')?.name.includes('上海天文馆'), '上海天文馆已收录');
assert(getObservatoryById('nonexistent') === undefined, '不存在的 ID 返回 undefined');

assert(Object.keys(VIDEO_THEMES).length >= 6, '视频主题库不少于 6 个');
assert(OBSERVATORY_VIDEOS['fast-guizhou']?.length >= 4, 'FAST 专属视频');

const uniqueVideos = collectUniqueVideoUrls();
assert(uniqueVideos.length >= 6 && uniqueVideos.length <= 20, `去重视频 URL 数量合理 (${uniqueVideos.length})`);
assert(typeof isCacheSupported === 'function', '缓存 API 可用');

const html = readFileSync('index.html', 'utf8');
for (const id of ['map-canvas', 'detail-panel', 'tour-overlay', 'tour-video', 'btn-audio', 'btn-video', 'btn-cache']) {
  assert(html.includes(id), `index.html 缺少 #${id}`);
}

for (const f of [
  'src/main.js', 'src/data/observatories.js', 'src/data/extra-observatories.js',
  'src/data/tourVideos.js', 'src/cache/videoCache.js', 'src/cache/cacheManager.js',
  'src/map/chinaMap.js', 'src/voice/guide.js',
  'src/tour/videoTour.js', 'src/ui/manager.js', 'src/devices/smartInput.js',
  'scripts/setup-native.js', 'scripts/build-ios-testflight.sh', 'ios/ExportOptions.plist',
]) {
  try { readFileSync(f); assert(true, ''); }
  catch { assert(false, `缺少文件 ${f}`); }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
