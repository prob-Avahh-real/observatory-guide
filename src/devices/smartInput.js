const TILT = 5;
const SHAKE = 20;
const ACCEL_TAP = 8;
const SWING = 3;
const RING_THROTTLE = 8;
const CANE_THROTTLE = 6;

export class SmartInput {
  constructor(ui) {
    this.ui = ui;
    this.enabled = false;
    this.ringFrame = 0;
    this.caneFrame = 0;
    this.lastBeta = null;
    this.lastGamma = null;
    this.lastAccel = { x: 0, y: 0, z: 0 };
  }

  async enable() {
    if (this.enabled) return;
    this._setupRingUI();
    this._setupCaneUI();
    this._setupGlassesVoice();
  }

  _setupRingUI() {
    const el = document.getElementById('ring-status');
    if (!el || typeof DeviceOrientationEvent === 'undefined') return;

    const activate = () => {
      this.enabled = true;
      el.classList.add('active');
      el.textContent = '💍 已连接';
      window.addEventListener('deviceorientation', (e) => this._onOrientation(e));
    };

    const DOE = DeviceOrientationEvent;
    if (typeof DOE.requestPermission === 'function') {
      el.textContent = '💍 点击启用';
      el.onclick = async () => {
        try {
          const p = await DOE.requestPermission();
          if (p === 'granted') { activate(); el.onclick = null; }
        } catch { /* */ }
      };
    } else activate();
  }

  _setupCaneUI() {
    const el = document.getElementById('cane-status');
    if (!el || typeof DeviceMotionEvent === 'undefined') return;

    const activate = () => {
      el.classList.add('active');
      el.textContent = '🦯 已连接';
      window.addEventListener('devicemotion', (e) => this._onMotion(e));
    };

    const DME = DeviceMotionEvent;
    if (typeof DME.requestPermission === 'function') {
      el.textContent = '🦯 点击启用';
      el.onclick = async () => {
        try {
          const p = await DME.requestPermission();
          if (p === 'granted') { activate(); el.onclick = null; }
        } catch { /* */ }
      };
    } else activate();
  }

  _setupGlassesVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const el = document.getElementById('voice-dot');
    if (!SR || !el) return;

    const isGlasses = () => {
      const w = innerWidth, h = innerHeight;
      return (w <= 420 && h <= 340) || (w <= 340 && h <= 420);
    };
    if (!isGlasses()) {
      el.title = '智能眼镜模式（窄屏自动启用）';
      return;
    }

    el.classList.add('active');
    const rec = new SR();
    rec.lang = 'zh-CN';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.trim();
        if (/下一个|下一/.test(t)) this.ui.cycleObservatory(1);
        if (/上一个|上一/.test(t)) this.ui.cycleObservatory(-1);
        if (/讲解|介绍|说说/.test(t) && this.ui.selectedId) this.ui.voice.speakObservatory(this.ui.selectedId);
        if (/视频|导览/.test(t)) this.ui.startVideoTour();
        if (/定位|最近/.test(t)) this.ui.locateNearest();
        if (/关闭|返回/.test(t)) {
          if (!document.getElementById('tour-overlay').classList.contains('hidden')) this.ui.closeTour();
          else this.ui.closeDetail();
        }
        if (/暂停|停/.test(t)) this.ui.voice.stop();
      }
    };
    rec.onend = () => { try { rec.start(); } catch { /* */ } };
    try { rec.start(); } catch { /* */ }
  }

  _onOrientation(e) {
    this.ringFrame++;
    if (this.ringFrame % RING_THROTTLE !== 0) return;
    const { beta, gamma } = e;
    if (beta == null || gamma == null) return;

    if (this.lastBeta != null) {
      const dB = Math.abs(beta - this.lastBeta);
      const dG = Math.abs(gamma - this.lastGamma);
      if (dB > SHAKE || dG > SHAKE) {
        if (this.ui.selectedId) this.ui.voice.speakObservatory(this.ui.selectedId);
        this.lastBeta = beta; this.lastGamma = gamma;
        return;
      }
      if (gamma > TILT) this.ui.cycleObservatory(1);
      else if (gamma < -TILT) this.ui.cycleObservatory(-1);
    }
    this.lastBeta = beta;
    this.lastGamma = gamma;
  }

  _onMotion(e) {
    this.caneFrame++;
    if (this.caneFrame % CANE_THROTTLE !== 0) return;
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const dx = Math.abs(acc.x - this.lastAccel.x);
    const dy = Math.abs(acc.y - this.lastAccel.y);
    const dz = Math.abs(acc.z - this.lastAccel.z);
    const spike = dx + dy + dz;

    if (spike > ACCEL_TAP) {
      const tourOpen = !document.getElementById('tour-overlay').classList.contains('hidden');
      if (tourOpen) this.ui.tour.togglePlay();
      else if (this.ui.selectedId) this.ui.startVideoTour();
      else this.ui.cycleObservatory(1);
    } else if (spike > SWING) {
      this.ui.cycleObservatory(acc.x > 0 ? 1 : -1);
    }
    this.lastAccel = { x: acc.x, y: acc.y, z: acc.z };
  }
}
