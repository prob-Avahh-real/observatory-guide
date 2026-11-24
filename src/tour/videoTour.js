import { VoiceGuide } from '../voice/guide.js';
import { resolveVideoUrl } from '../cache/videoCache.js';

export class VideoTour {
  constructor(canvas, voice) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.voice = voice;
    this.video = document.getElementById('tour-video');
    this.creditEl = document.getElementById('tour-credit');
    this.obs = null;
    this.sceneIdx = 0;
    this.playing = false;
    this.elapsed = 0;
    this.useVideo = false;
    this._blobUrl = null;
    this._raf = null;
    this._onVideoEnd = () => {};
    this._resize();
    window.addEventListener('resize', () => this._resize());

    if (this.video) {
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute('webkit-playsinline', '');
      this._onVideoEnd = () => {
        if (this.playing && this.sceneIdx < this.obs.tour.length - 1) this.next();
        else this.playing = false;
      };
      this.video.addEventListener('ended', this._onVideoEnd);
      this.video.addEventListener('error', () => this._fallbackToCanvas());
    }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  start(obs) {
    this.obs = obs;
    this.sceneIdx = 0;
    this.elapsed = 0;
    this.playing = true;
    this._loadScene();
    this._loop();
  }

  stop() {
    this.playing = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._revokeBlob();
    this._hideVideo();
    this.voice.stop();
  }

  togglePlay() {
    this.playing = !this.playing;
    if (this.useVideo && this.video) {
      if (this.playing) this.video.play().catch(() => {});
      else this.video.pause();
    }
    if (this.playing) this._loop();
  }

  next() {
    if (!this.obs) return;
    this.sceneIdx = Math.min(this.sceneIdx + 1, this.obs.tour.length - 1);
    this.elapsed = 0;
    this._loadScene();
  }

  prev() {
    this.sceneIdx = Math.max(this.sceneIdx - 1, 0);
    this.elapsed = 0;
    this._loadScene();
  }

  _loadScene() {
    if (!this.obs) return;
    const scene = this.obs.tour[this.sceneIdx];
    const text = `${this.obs.name}，${scene.title}。${scene.caption}。`;
    this.voice.speak(text, this.obs.id);

    const cap = document.getElementById('tour-caption');
    if (cap) cap.innerHTML = `<strong>${scene.title}</strong><br>${scene.caption}`;

    const bar = document.getElementById('tour-bar');
    if (bar) bar.style.width = `${((this.sceneIdx + 1) / this.obs.tour.length) * 100}%`;

    if (scene.videoUrl && this.video) {
      this._tryPlayVideo(scene);
    } else {
      this._fallbackToCanvas();
    }
  }

  _tryPlayVideo(scene) {
    this.useVideo = true;
    this.canvas.classList.add('hidden');
    this.video.classList.remove('hidden');
    if (scene.posterUrl) this.video.poster = scene.posterUrl;
    if (this.creditEl && scene.videoCredit) {
      this.creditEl.textContent = `视频：${scene.videoCredit}`;
      this.creditEl.classList.remove('hidden');
    }

    this._revokeBlob();
    resolveVideoUrl(scene.videoUrl).then((url) => {
      if (!this.obs || this.obs.tour[this.sceneIdx] !== scene) return;
      if (url.startsWith('blob:')) this._blobUrl = url;
      this.video.src = url;
      this.video.loop = true;
      this.video.load();
      this.video.play().catch(() => this._fallbackToCanvas());
    }).catch(() => this._fallbackToCanvas());
  }

  _revokeBlob() {
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl);
      this._blobUrl = null;
    }
  }

  _fallbackToCanvas() {
    this.useVideo = false;
    this._hideVideo();
    this.canvas.classList.remove('hidden');
  }

  _hideVideo() {
    if (!this.video) return;
    this.video.pause();
    this.video.classList.add('hidden');
    if (this.creditEl) this.creditEl.classList.add('hidden');
  }

  _loop() {
    if (!this.playing || !this.obs) return;

    this.elapsed += 1 / 60;
    const scene = this.obs.tour[this.sceneIdx];

    if (!this.useVideo) {
      this._drawScene(scene, this.elapsed);
    }

    if (this.elapsed >= scene.duration) {
      if (this.sceneIdx < this.obs.tour.length - 1) this.next();
      else this.playing = false;
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawScene(scene, t) {
    const { ctx, w, h } = this;
    const [c1, c2, c3] = scene.colors;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.5, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 80; i++) {
      const sx = (i * 137.5 + t * 10) % w;
      const sy = (i * 97.3 + Math.sin(t + i) * 20) % h;
      ctx.globalAlpha = 0.3 + Math.sin(t * 2 + i) * 0.3;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const cx = w / 2;
    const cy = h * 0.55;
    const domeR = Math.min(w, h) * 0.18;
    const pulse = 1 + Math.sin(t * 1.5) * 0.02;
    const angle = -0.4 + Math.sin(t * 0.5) * 0.15;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, domeR, Math.PI, 0);
    ctx.lineTo(domeR, domeR * 0.3);
    ctx.lineTo(-domeR, domeR * 0.3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-8, -domeR * 0.5, 16, domeR * 0.9);
    ctx.beginPath();
    ctx.arc(0, -domeR * 0.5, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74,158,255,0.4)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const beamGrad = ctx.createLinearGradient(0, -domeR * 0.5, 0, -h);
    beamGrad.addColorStop(0, 'rgba(74,158,255,0.3)');
    beamGrad.addColorStop(1, 'rgba(74,158,255,0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-6, -domeR * 0.5);
    ctx.lineTo(6, -domeR * 0.5);
    ctx.lineTo(30, -h);
    ctx.lineTo(-30, -h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.sceneIdx + 1} / ${this.obs.tour.length}`, w - 20, h - 80);
  }
}
