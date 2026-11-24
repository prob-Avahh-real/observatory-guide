/**
 * 公开域/免费天文视频素材库
 * 来源：NASA SVS（公有域）、Mixkit（免费商用）
 * 按主题分类，供导览场景匹配
 */
export const VIDEO_THEMES = {
  observatory: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-telescope-on-a-tripod-456-large.mp4',
    poster: 'https://images.unsplash.com/photo-1419242902214-272b31fbd132?w=800&q=80',
    credit: 'Mixkit',
  },
  stars: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4',
    poster: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80',
    credit: 'Mixkit',
  },
  milkyway: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-milky-way-and-stars-in-the-night-sky-404-large.mp4',
    poster: 'https://images.unsplash.com/photo-1444703686981-a3abbc475d45?w=800&q=80',
    credit: 'Mixkit',
  },
  nightsky: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-and-a-tree-402-large.mp4',
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80',
    credit: 'Mixkit',
  },
  radio: {
    url: 'https://assets.science.nasa.gov/content/dam/science/psd/svs/video_files/2018/2018-003/2018-003-0001_1920x1080_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&q=80',
    credit: 'NASA SVS',
  },
  solar: {
    url: 'https://assets.science.nasa.gov/content/dam/science/psd/svs/video_files/2023/2023-084/2023-084-0001_1920x1080_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&q=80',
    credit: 'NASA SVS',
  },
  earth: {
    url: 'https://assets.science.nasa.gov/content/dam/science/psd/svs/video_files/2021/2021-185/2021-185-0001_1920x1080_30fps.mp4',
    poster: 'https://images.unsplash.com/photo-1614730321146-b6fa6bd46ad4?w=800&q=80',
    credit: 'NASA SVS',
  },
  deepSpace: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-view-of-stars-in-space-3190-large.mp4',
    poster: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&q=80',
    credit: 'Mixkit',
  },
};

/** 台站专属视频（官方/纪录片公开片段、NASA 主题素材） */
export const OBSERVATORY_VIDEOS = {
  'fast-guizhou': [
    { ...VIDEO_THEMES.radio, title: '射电望远镜' },
    { url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4',
      poster: VIDEO_THEMES.stars.poster, credit: 'Mixkit', title: '聆听宇宙' },
    { ...VIDEO_THEMES.nightsky, title: '喀斯特洼地' },
    { ...VIDEO_THEMES.deepSpace, title: '脉冲星' },
  ],
  'xl-observatory': [
    { ...VIDEO_THEMES.observatory, title: '燕山观测站' },
    { ...VIDEO_THEMES.milkyway, title: 'LAMOST 巡天' },
    { ...VIDEO_THEMES.stars, title: '光谱数据' },
    { ...VIDEO_THEMES.nightsky, title: '晴夜观测' },
  ],
  'pmo-nanjing': [
    { url: 'https://assets.mixkit.co/videos/preview/mixkit-telescope-on-a-tripod-456-large.mp4',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
      credit: 'Mixkit', title: '紫金山巅' },
    { ...VIDEO_THEMES.observatory, title: '百年台址' },
    { ...VIDEO_THEMES.stars, title: '小行星发现' },
    { ...VIDEO_THEMES.deepSpace, title: '前沿研究' },
  ],
  'yaoan-lijiang': [
    { ...VIDEO_THEMES.milkyway, title: '玉龙雪山' },
    { ...VIDEO_THEMES.observatory, title: '2.4米望远镜' },
    { ...VIDEO_THEMES.stars, title: '时域天文' },
    { ...VIDEO_THEMES.nightsky, title: '透明夜天' },
  ],
  'naoc-ali': [
    { ...VIDEO_THEMES.earth, title: '世界屋脊' },
    { ...VIDEO_THEMES.milkyway, title: '透明大气' },
    { ...VIDEO_THEMES.deepSpace, title: '引力波' },
    { ...VIDEO_THEMES.observatory, title: '未来之眼' },
  ],
  'lenghu-qinghai': [
    { ...VIDEO_THEMES.earth, title: '世界级台址' },
    { ...VIDEO_THEMES.milkyway, title: '4200米晴夜' },
    { ...VIDEO_THEMES.observatory, title: '望远镜群' },
    { ...VIDEO_THEMES.stars, title: '时域天文' },
  ],
};

/** 按场景关键词自动匹配视频主题 */
const KEYWORD_THEME = [
  [/射电|FAST|脉冲|天线|毫米波/, 'radio'],
  [/太阳|黑子|耀斑|日珥/, 'solar'],
  [/银河|星空|露营|观星|夜天|草原/, 'milkyway'],
  [/望远镜|光学|LAMOST|domo|圆顶/, 'observatory'],
  [/地球|屋脊|卫星|轨道|空间/, 'earth'],
  [/深空|宇宙|光谱|星系/, 'deepSpace'],
];

export function matchVideoForScene(obsId, scene, sceneIdx) {
  if (OBSERVATORY_VIDEOS[obsId]?.[sceneIdx]) {
    return OBSERVATORY_VIDEOS[obsId][sceneIdx];
  }
  const text = `${scene.title} ${scene.caption}`;
  for (const [re, theme] of KEYWORD_THEME) {
    if (re.test(text)) return { ...VIDEO_THEMES[theme], title: scene.title };
  }
  const fallback = ['stars', 'milkyway', 'nightsky', 'observatory'];
  const key = fallback[sceneIdx % fallback.length];
  return { ...VIDEO_THEMES[key], title: scene.title };
}

export function enrichTourWithVideos(observatory) {
  if (!observatory.tour) return observatory;
  return {
    ...observatory,
    tour: observatory.tour.map((scene, i) => {
      const vid = matchVideoForScene(observatory.id, scene, i);
      return {
        ...scene,
        videoUrl: scene.videoUrl || vid.url,
        posterUrl: scene.posterUrl || vid.poster,
        videoCredit: vid.credit,
      };
    }),
  };
}
