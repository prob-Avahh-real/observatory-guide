import {
  isCacheSupported,
  getCacheStats,
  prefetchAll,
  clearVideoCache,
  prefetchInBackground,
} from '../cache/videoCache.js';

export class CacheManager {
  constructor() {
    this.busy = false;
    this.btn = document.getElementById('btn-cache');
    this.badge = document.getElementById('cache-status');
    this._bind();
    this._refresh();
  }

  _bind() {
    if (!this.btn) return;

    this.btn.onclick = () => this._onTap();
    this.btn.oncontextmenu = (e) => { e.preventDefault(); this._clear(); };
  }

  async _refresh() {
    if (!this.badge || !isCacheSupported()) return;
    const stats = await getCacheStats();
    this.badge.classList.remove('hidden');
    if (stats.ready) {
      this.badge.textContent = '✓ 离线';
      this.badge.classList.add('ready');
      this.btn.title = '视频已缓存，长按清除';
    } else if (stats.cached > 0) {
      this.badge.textContent = `${stats.pct}%`;
      this.badge.classList.remove('ready');
      this.btn.title = `缓存 ${stats.cached}/${stats.total}，点击继续下载`;
    } else {
      this.badge.textContent = '离线';
      this.badge.classList.remove('ready');
      this.btn.title = '下载导览视频供离线观看';
    }
  }

  async _onTap() {
    if (this.busy || !isCacheSupported()) {
      if (!isCacheSupported()) alert('当前环境不支持离线缓存');
      return;
    }
    const stats = await getCacheStats();
    if (stats.ready) {
      alert(`全部 ${stats.total} 个导览视频已缓存，可离线观看。长按清除缓存。`);
      return;
    }

    this.busy = true;
    this.btn.textContent = '…';
    this.badge.textContent = '0%';

    await prefetchAll((p) => {
      this.badge.textContent = `${p.pct}%`;
      this.btn.title = `下载中 ${p.done}/${p.total}`;
    });

    this.busy = false;
    this.btn.textContent = '⬇️';
    await this._refresh();
  }

  async _clear() {
    if (!confirm('清除全部离线视频缓存？')) return;
    await clearVideoCache();
    await this._refresh();
  }

  /** 应用启动时后台预缓存 */
  startBackgroundPrefetch() {
    if (!isCacheSupported()) return;
    prefetchInBackground((p) => {
      if (this.badge && !this.busy) {
        this.badge.textContent = p.pct >= 100 ? '✓ 离线' : `${p.pct}%`;
        if (p.pct >= 100) this.badge.classList.add('ready');
      }
    }).then(() => this._refresh());
  }
}
