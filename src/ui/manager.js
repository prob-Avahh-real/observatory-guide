import { OBSERVATORIES, OBSERVATORY_TYPES, getObservatoryById, haversineKm } from '../data/observatories.js';

export class UIManager {
  constructor(map, voice, tour) {
    this.map = map;
    this.voice = voice;
    this.tour = tour;
    this.selectedId = null;
    this.filter = 'all';
    this.userPos = null;

    this._bindElements();
    this._renderList();
    this._updateCount();
  }

  _bindElements() {
    document.getElementById('btn-filter').onclick = () => {
      document.getElementById('filter-bar').classList.toggle('hidden');
    };
    document.getElementById('btn-list').onclick = () => {
      document.getElementById('list-panel').classList.toggle('hidden');
    };
    document.getElementById('btn-close-list').onclick = () => {
      document.getElementById('list-panel').classList.add('hidden');
    };
    document.getElementById('btn-close-detail').onclick = () => this.closeDetail();
    document.getElementById('btn-audio').onclick = () => {
      if (this.selectedId) this.voice.speakObservatory(this.selectedId);
    };
    document.getElementById('btn-video').onclick = () => this.startVideoTour();
    document.getElementById('btn-ask').onclick = () => {
      if (this.selectedId) this.voice.startListening(this.selectedId);
    };
    document.getElementById('btn-locate').onclick = () => this.locateNearest();

    document.getElementById('btn-tour-close').onclick = () => this.closeTour();
    document.getElementById('btn-tour-play').onclick = () => {
      this.tour.togglePlay();
      document.getElementById('btn-tour-play').textContent = this.tour.playing ? '⏸' : '▶';
    };
    document.getElementById('btn-tour-next').onclick = () => this.tour.next();
    document.getElementById('btn-tour-prev').onclick = () => this.tour.prev();

    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.onclick = () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.filter = chip.dataset.type;
        this.map.setFilter(this.filter);
        this._renderList();
        this._updateCount();
      };
    });

    this.voice.onStatusChange = (msg) => {
      const el = document.getElementById('voice-status');
      if (el) el.textContent = msg;
    };
  }

  _updateCount() {
    const count = this.filter === 'all'
      ? OBSERVATORIES.length
      : OBSERVATORIES.filter((o) => o.type === this.filter).length;
    document.getElementById('obs-count').textContent = `${count} 站`;
  }

  _renderList() {
    const container = document.getElementById('list-content');
    const items = this.filter === 'all'
      ? OBSERVATORIES
      : OBSERVATORIES.filter((o) => o.type === this.filter);

    container.innerHTML = items.map((o) => {
      const type = OBSERVATORY_TYPES[o.type];
      return `<button class="list-item" data-id="${o.id}">
        <span class="list-icon">${type.icon}</span>
        <div class="list-info">
          <strong>${o.shortName}</strong>
          <span>${o.province} · ${type.label}</span>
        </div>
        <span class="list-alt">${o.altitude}</span>
      </button>`;
    }).join('');

    container.querySelectorAll('.list-item').forEach((btn) => {
      btn.onclick = () => {
        this.selectObservatory(btn.dataset.id);
        document.getElementById('list-panel').classList.add('hidden');
      };
    });
  }

  selectObservatory(id) {
    this.selectedId = id;
    this.map.select(id);
    const obs = getObservatoryById(id);
    if (!obs) return;

    const panel = document.getElementById('detail-panel');
    panel.classList.remove('hidden');
    document.getElementById('hint').classList.add('hidden');

    const type = OBSERVATORY_TYPES[obs.type];
    document.getElementById('detail-type').textContent = type.label;
    document.getElementById('detail-type').style.background = type.color + '33';
    document.getElementById('detail-type').style.color = type.color;
    document.getElementById('detail-name').textContent = obs.name;
    document.getElementById('detail-location').textContent = `${obs.province} · ${obs.city}`;

    const statsEl = document.getElementById('detail-stats');
    statsEl.innerHTML = Object.entries(obs.stats).map(([k, v]) =>
      `<div class="stat"><span class="stat-key">${k}</span><span class="stat-val">${v}</span></div>`
    ).join('');

    document.getElementById('detail-desc').textContent = obs.description;

    const factsEl = document.getElementById('detail-facts');
    factsEl.innerHTML = obs.facts.map((f) => `<li>${f}</li>`).join('');

    document.getElementById('detail-visit').innerHTML =
      `<strong>🗺️ 参观信息</strong><p>${obs.visitInfo}</p>`;

    const hero = obs.tour?.[0]?.posterUrl;
    const heroEl = document.querySelector('.detail-hero');
    if (hero && heroEl) {
      heroEl.style.backgroundImage = `linear-gradient(to bottom, transparent 40%, var(--panel-bg)), url(${hero})`;
      heroEl.style.backgroundSize = 'cover';
      heroEl.style.backgroundPosition = 'center';
    }
  }

  closeDetail() {
    document.getElementById('detail-panel').classList.add('hidden');
    document.getElementById('hint').classList.remove('hidden');
    this.selectedId = null;
    this.map.selectedId = null;
    this.voice.stop();
  }

  startVideoTour() {
    const obs = getObservatoryById(this.selectedId);
    if (!obs) return;
    document.getElementById('tour-overlay').classList.remove('hidden');
    document.getElementById('btn-tour-play').textContent = '⏸';
    this.tour.start(obs);
  }

  closeTour() {
    document.getElementById('tour-overlay').classList.add('hidden');
    this.tour.stop();
  }

  cycleObservatory(dir) {
    const items = this.filter === 'all'
      ? OBSERVATORIES
      : OBSERVATORIES.filter((o) => o.type === this.filter);
    let idx = items.findIndex((o) => o.id === this.selectedId);
    if (idx < 0) idx = dir > 0 ? -1 : 0;
    idx = (idx + dir + items.length) % items.length;
    this.selectObservatory(items[idx].id);
  }

  locateNearest() {
    if (!navigator.geolocation) {
      this.voice.speak('当前设备不支持定位功能。');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let nearest = OBSERVATORIES[0];
        let minDist = Infinity;
        for (const o of OBSERVATORIES) {
          const d = haversineKm(this.userPos.lat, this.userPos.lng, o.lat, o.lng);
          if (d < minDist) { minDist = d; nearest = o; }
        }
        this.selectObservatory(nearest.id);
        this.voice.speak(`离您最近的是${nearest.name}，约 ${Math.round(minDist)} 公里。`, nearest.id);
      },
      () => this.voice.speak('无法获取位置，请检查定位权限。'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
}
