// Simplified China outline (lng, lat) — normalized for map projection
export const CHINA_OUTLINE = [
  [73.5, 39.5], [80, 45], [87, 49], [96, 42], [105, 41.5],
  [111, 43.5], [119, 46], [125, 48], [131, 45], [134, 48],
  [130, 42], [124, 40], [122, 37], [121, 31], [122, 28],
  [120, 25], [117, 23], [110, 21], [108, 18], [109, 15],
  [106, 10], [100, 8], [98, 22], [97, 28], [92, 27],
  [88, 28], [85, 30], [79, 32], [76, 35], [73.5, 39.5],
];

export const MAP_BOUNDS = {
  minLng: 73, maxLng: 135,
  minLat: 8, maxLat: 54,
};

export function projectToCanvas(lng, lat, width, height, padding = 40) {
  const { minLng, maxLng, minLat, maxLat } = MAP_BOUNDS;
  const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - padding * 2);
  const y = height - padding - ((lat - minLat) / (maxLat - minLat)) * (height - padding * 2);
  return { x, y };
}

export function canvasToGeo(x, y, width, height, padding = 40) {
  const { minLng, maxLng, minLat, maxLat } = MAP_BOUNDS;
  const lng = minLng + ((x - padding) / (width - padding * 2)) * (maxLng - minLng);
  const lat = minLat + ((height - padding - y) / (height - padding * 2)) * (maxLat - minLat);
  return { lng, lat };
}

export class ChinaMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.markers = [];
    this.selectedId = null;
    this.hoveredId = null;
    this.filter = 'all';
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.lastTouch = null;
    this.onSelect = null;
    this.stars = this._genStars(120);
    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _genStars(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.5 + 0.2,
    }));
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width;
    this.h = rect.height;
  }

  setMarkers(observatories) {
    this.markers = observatories;
  }

  setFilter(type) {
    this.filter = type;
  }

  select(id) {
    this.selectedId = id;
    if (id) {
      const obs = this.markers.find((m) => m.id === id);
      if (obs) this._focusOn(obs.lng, obs.lat);
    }
  }

  _focusOn(lng, lat) {
    const { x, y } = projectToCanvas(lng, lat, this.w, this.h);
    this.offsetX = this.w / 2 - x * this.scale;
    this.offsetY = this.h / 2 - y * this.scale;
    this.scale = Math.min(Math.max(this.scale, 1.3), 2.5);
  }

  _bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastTouch = getPos(e);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      if (this.isDragging && this.lastTouch) {
        this.offsetX += pos.x - this.lastTouch.x;
        this.offsetY += pos.y - this.lastTouch.y;
        this.lastTouch = pos;
      } else {
        this.hoveredId = this._hitTest(pos.x, pos.y);
        this.canvas.style.cursor = this.hoveredId ? 'pointer' : 'grab';
      }
    });
    window.addEventListener('mouseup', () => { this.isDragging = false; this.lastTouch = null; });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastTouch = getPos(e);
      }
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging && this.lastTouch) {
        const pos = getPos(e);
        this.offsetX += pos.x - this.lastTouch.x;
        this.offsetY += pos.y - this.lastTouch.y;
        this.lastTouch = pos;
      }
    }, { passive: true });
    this.canvas.addEventListener('touchend', () => { this.isDragging = false; this.lastTouch = null; });

    this.canvas.addEventListener('click', (e) => {
      const pos = getPos(e);
      const id = this._hitTest(pos.x, pos.y);
      if (id && this.onSelect) {
        this.selectedId = id;
        this.onSelect(id);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.min(Math.max(this.scale * delta, 0.8), 3);
    }, { passive: false });
  }

  _hitTest(px, py) {
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i];
      if (this.filter !== 'all' && m.type !== this.filter) continue;
      const { x, y } = this._transform(m.lng, m.lat);
      const r = m.id === this.selectedId ? 18 : 14;
      if ((px - x) ** 2 + (py - y) ** 2 < r ** 2) return m.id;
    }
    return null;
  }

  _transform(lng, lat) {
    const p = projectToCanvas(lng, lat, this.w, this.h);
    return {
      x: p.x * this.scale + this.offsetX,
      y: p.y * this.scale + this.offsetY,
    };
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    // Starfield background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#050818');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const s of this.stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // China outline
    ctx.beginPath();
    const pts = CHINA_OUTLINE.map(([lng, lat]) => projectToCanvas(lng, lat, w, h));
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 58, 95, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.35)';
    ctx.lineWidth = 1.5 / this.scale;
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.06)';
    ctx.lineWidth = 0.5 / this.scale;
    for (let lng = 80; lng <= 130; lng += 10) {
      const p1 = projectToCanvas(lng, 18, w, h);
      const p2 = projectToCanvas(lng, 50, w, h);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let lat = 20; lat <= 50; lat += 10) {
      const p1 = projectToCanvas(75, lat, w, h);
      const p2 = projectToCanvas(132, lat, w, h);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    // Markers
    const time = Date.now() / 1000;
    for (const m of this.markers) {
      if (this.filter !== 'all' && m.type !== this.filter) continue;
      const { x, y } = projectToCanvas(m.lng, m.lat, w, h);
      const isSelected = m.id === this.selectedId;
      const isHovered = m.id === this.hoveredId;
      const colors = { national: '#4a9eff', university: '#a78bfa', public: '#34d399' };
      const color = colors[m.type] || '#4a9eff';
      const r = isSelected ? 10 : isHovered ? 8 : 6;

      if (isSelected) {
        const pulse = 8 + Math.sin(time * 3) * 4;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = color + '33';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / this.scale;
      ctx.stroke();

      if (isSelected || isHovered) {
        ctx.font = `${11 / this.scale}px sans-serif`;
        ctx.fillStyle = '#e8edf5';
        ctx.textAlign = 'center';
        ctx.fillText(m.shortName, x, y - r - 6 / this.scale);
      }
    }

    ctx.restore();
  }
}
