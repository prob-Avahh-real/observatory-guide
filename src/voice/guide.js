import { getObservatoryById, OBSERVATORIES } from '../data/observatories.js';

export class VoiceGuide {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.speaking = false;
    this.listening = false;
    this.currentId = null;
    this.onStatusChange = null;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      this.recognition = new SR();
      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onresult = (e) => this._handleQuestion(e.results[0][0].transcript);
      this.recognition.onend = () => { this.listening = false; this._status(''); };
      this.recognition.onerror = () => { this.listening = false; this._status('语音识别失败'); };
    }
  }

  _status(msg) {
    if (this.onStatusChange) this.onStatusChange(msg);
  }

  speak(text, id) {
    this.stop();
    this.currentId = id;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.92;
    const voices = this.synth.getVoices();
    const zh = voices.find((v) => v.lang.startsWith('zh'));
    if (zh) u.voice = zh;
    u.onstart = () => { this.speaking = true; this._status('正在讲解…'); };
    u.onend = () => { this.speaking = false; this._status(''); };
    this.synth.speak(u);
  }

  speakObservatory(id) {
    const obs = getObservatoryById(id);
    if (!obs) return;
    const text = `${obs.voiceIntro} ${obs.description} 主要设备包括：${obs.instruments.join('、')}。`;
    this.speak(text, id);
  }

  stop() {
    this.synth.cancel();
    this.speaking = false;
    if (this.recognition && this.listening) {
      this.recognition.stop();
      this.listening = false;
    }
  }

  startListening(id) {
    if (!this.recognition) { this._status('当前环境不支持语音识别'); return; }
    this.stop();
    this.currentId = id;
    this.listening = true;
    this._status('请说话…（例如：海拔多少？怎么参观？）');
    this.recognition.start();
  }

  _handleQuestion(text) {
    const obs = getObservatoryById(this.currentId);
    if (!obs) { this.speak('请先选择一个天文台。'); return; }

    const q = text.toLowerCase();
    let answer = '';

    if (/海拔|多高|高度/.test(q)) {
      answer = `${obs.name}海拔${obs.altitude}。`;
    } else if (/设备|望远镜|仪器/.test(q)) {
      answer = `${obs.name}的主要设备有：${obs.instruments.join('、')}。`;
    } else if (/参观|开放|怎么去|地址|交通/.test(q)) {
      answer = obs.visitInfo;
    } else if (/哪个省|在哪|位置|地址/.test(q)) {
      answer = `${obs.name}位于${obs.province}${obs.city}。`;
    } else if (/历史|什么时候|建站/.test(q)) {
      answer = obs.stats['建站年份'] || obs.stats['建成年份']
        ? `${obs.name}，${obs.stats['建站年份'] || obs.stats['建成年份']}。`
        : obs.facts[0];
    } else if (/有趣|事实|特色/.test(q)) {
      answer = obs.facts[Math.floor(Math.random() * obs.facts.length)];
    } else if (/介绍|讲讲|说说|是什么/.test(q)) {
      answer = obs.voiceIntro + obs.description;
    } else if (/最近|附近|哪个台/.test(q)) {
      answer = `全国共有 ${OBSERVATORIES.length} 个天文台站收录在星观台中，您可以在地图上浏览或点击定位按钮找到离您最近的台站。`;
    } else {
      answer = `关于${obs.name}，${obs.facts[0]}。您还可以问我海拔、设备、参观方式或历史信息。`;
    }

    this._status(`你问：${text}`);
    setTimeout(() => this.speak(answer, obs.id), 300);
  }

  answerGlobal(text) {
    const q = text.toLowerCase();
    if (/最高|海拔/.test(q)) {
      this.speak('全国海拔最高的专业天文台是西藏阿里观测基地，海拔约 5100 米。');
    } else if (/最大|口径/.test(q)) {
      this.speak('世界上最大的单口径射电望远镜是贵州 FAST 中国天眼，口径 500 米。');
    } else if (/多少|几个|共有/.test(q)) {
      this.speak(`星观台共收录全国 ${OBSERVATORIES.length} 个天文台站，包括国家台站、高校台站和公众开放站点。`);
    } else {
      this.speak('欢迎使用星观台。点击地图上的标记查看天文台详情，或问我关于海拔、设备、参观方式等问题。');
    }
  }
}

export function initVoices() {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) { resolve(v); return; }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
  });
}
