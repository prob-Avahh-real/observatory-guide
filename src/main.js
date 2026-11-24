import { OBSERVATORIES } from './data/observatories.js';
import { ChinaMap } from './map/chinaMap.js';
import { VoiceGuide, initVoices } from './voice/guide.js';
import { VideoTour } from './tour/videoTour.js';
import { UIManager } from './ui/manager.js';
import { SmartInput } from './devices/smartInput.js';
import { CacheManager } from './cache/cacheManager.js';

const mapCanvas = document.getElementById('map-canvas');
const tourCanvas = document.getElementById('tour-canvas');

const map = new ChinaMap(mapCanvas);
const voice = new VoiceGuide();
const tour = new VideoTour(tourCanvas, voice);
const ui = new UIManager(map, voice, tour);
const smart = new SmartInput(ui);
const cacheMgr = new CacheManager();

map.setMarkers(OBSERVATORIES);
map.onSelect = (id) => ui.selectObservatory(id);

function loop() {
  map.draw();
  requestAnimationFrame(loop);
}

initVoices().then(() => {
  loop();
  smart.enable();
  cacheMgr.startBackgroundPrefetch();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) voice.stop();
});
