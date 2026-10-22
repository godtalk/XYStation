import { clamp } from "./util.js";

export const cards = {
  resume: {
    code: "CV",
    title: "郑新义",
    meta: "游戏原画 · 资深场景",
    left: `
      <p class="cv-info">北京　1990.5　北京工业大学</p>
      <p class="cv-hit"><a href="tel:18612238615">18612238615</a></p>
      <p class="cv-hit"><a href="mailto:zxy08165108@163.com">zxy08165108@163.com</a></p>
      <p class="cv-quote">职场老鸟一只，对游戏美术兴趣不减反增。保持学习心态，愿意尝试新技能，永远不会失去求知的欲望。</p>`,
    right: `
      <p class="cv-job s1"><span class="cv-time">2022.11 — 至今</span><strong>猩球游戏</strong><b>资深场景</b></p>
      <p class="cv-job s2"><span class="cv-time">2021.11 — 2022.8</span><strong>麦吉太文</strong><b>场景原画 · 战棋</b></p>
      <p class="cv-job s3"><span class="cv-time">2020.5 — 2021.11</span><strong>北京趣加</strong><b>场景原画 · 欧美卡通</b></p>
      <p class="cv-job s4"><span class="cv-time">2018.10 — 2020.5</span><strong>福州龙腾简合</strong><b>高级场景</b></p>
      <p class="cv-job s5"><span class="cv-time">2017.4 — 2018.5</span>畅游创想　2D 场景　/　接包</p>
      <p class="cv-job s5"><span class="cv-time">2016.4 — 2017.3</span>福州网龙　魔域 / 英魂之刃 / 无境战地</p>
      <p class="cv-job s5"><span class="cv-time">2015.1 — 2016.1</span>负负得正　《女儿国》《哪吒闹海》设定</p>
      <p class="cv-job s5"><span class="cv-time">2008 — 2014</span>北工大 · 一丁画室 · 磐石 · 中国手游</p>`,
  },
  software: {
    code: "SW",
    title: "常用软件",
    meta: "日常工具",
  },
  works: {
    code: "WK",
    title: "场景原画",
    meta: "原画 / 场景 / 设定",
  },
  blender: {
    code: "BL",
    title: "Blender 效果",
    meta: "镜头 / 场景动画",
  },
  unity: {
    code: "UN",
    title: "Unity 效果",
    meta: "场景效果 / Shader / 演示",
  },
  tools: {
    code: "TL",
    title: "工具研发",
    meta: "自研工具 / 流程",
  },
  contact: {
    code: "CONTACT",
    title: "联系方式",
    meta: "公开联系方式",
    html: `<p>手机　<a href="tel:18612238615">18612238615</a></p><p>邮箱　<a href="mailto:zxy08165108@163.com">zxy08165108@163.com</a></p><p><a href="https://github.com/godtalk" target="_blank" rel="noopener">GitHub · godtalk</a></p>`,
  },
};

export const PATH_MAX = 24;
export const WHEEL_SCALE = 0.00008;
export const TOUCH_SCALE = 0.05;
export const KEY_IMPULSE = 0.28;
export const VEL_MAX = 0.38;
export const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 本站入口", short: "00 入口" },
  { key: "resume", at: 4.5, label: "CV 个人简历", short: "CV 简历" },
  { key: "software", at: 8, label: "SW 常用软件", short: "SW 软件" },
  { key: "works", at: 12, until: 14.2, label: "WK 原画作品", short: "WK 原画" },
  { key: "blender", at: 14.9, until: 17.0, label: "BL Blender效果", short: "BL Blender" },
  { key: "unity", at: 17.7, until: 19.8, label: "UN Unity效果", short: "UN UNITY" },
  { key: "tools", at: 20.5, until: 22.6, label: "TL 工具研发", short: "TL 工具" },
  { key: "contact", at: 23.2, label: "CT 联系方式", short: "CT 联系" },
];
export const SPACE = 48;

export const THEMES = {
  dark: {
    paper: "#080c14",
    ink: "#f5f8fc",
    muted: "#c8d2de",
    line: "#2a3544",
    accent: "#c45a28",
    glowSpot: "#152033",
    glowMid: "#0c1420",
    vignetteMid: "rgba(6, 10, 18, 0.55)",
    vignetteEdge: "rgba(2, 4, 10, 0.94)",
    vignetteIn: "22%",
    vignetteMidStop: "58%",
    holoFill: "rgba(8, 12, 20, 0.72)",
    railFill: "rgba(8, 12, 20, 0.92)",
    plateFill: "#111820",
    onPhoto: "#f5f8fc",
    dust: "#9eb1c7",
    dustStroke: "rgba(158, 177, 199, 0.42)",
    titleDust: "#ffffff",
    titleScale: "1",
    grainOpacity: "0.12",
    blend: "normal",
    vortex: {
      coneInner: 0.22,
      coneOuter: 2.16,
      sizeInner: 0.4,
      sizeOuter: 1.55,
      sizePow: 0.65,
      pointMul: 1.35,
      useScale: 0,
      pointMin: 0.55,
      pointMax: 11,
      reachAlpha: 0.3,
      lockCount: 1,
      segmentsMin: 240,
      segmentsMax: 280,
    },
  },
  light: {
    paper: "#e7e2d6",
    ink: "#161513",
    muted: "#6f6a60",
    line: "#b7b09f",
    accent: "#c45a28",
    glowSpot: "#f6f1e6",
    glowMid: "#efe8d8",
    vignetteMid: "rgba(22, 21, 19, 0.16)",
    vignetteEdge: "rgba(16, 13, 10, 0.55)",
    vignetteIn: "34%",
    vignetteMidStop: "68%",
    holoFill: "rgba(231, 226, 214, 0.72)",
    railFill: "rgba(231, 226, 214, 0.92)",
    plateFill: "#ddd7c9",
    onPhoto: "#e7e2d6",
    dust: "#1a1814",
    dustStroke: "rgba(22, 21, 19, 0.45)",
    titleDust: "#1a1814",
    titleScale: "2",
    grainOpacity: "0.12",
    blend: "multiply",
    vortex: {
      coneInner: 0.06,
      coneOuter: 2.16,
      sizeInner: 0.55,
      sizeOuter: 1.2,
      sizePow: 1,
      pointMul: 1.5,
      useScale: 1,
      pointMin: 0.55,
      pointMax: 14,
      reachAlpha: 0.3,
      lockCount: 0,
      segmentsMin: 160,
      segmentsMax: 580,
    },
  },
};
export const px = [
  [0, -18], [4, -12.34], [6, -7], [8, -2.5], [10, -2.5], [11, -1.6], [13, 0], [15, 0],
  [17, 4.5], [18.97, -15], [19, 0], [22.5, 4.5], [23.5, 9.5], [23.53, 2.8], [24, 2.8],
];
export const py = [
  [0, 0], [8, 0], [10, 0.1], [11, 1], [13, 1], [15, 1.75], [17, 1], [18.97, 14],
  [19, -3.6], [22.5, 4.7], [23.5, 15.5], [23.53, 0.5], [24, 1.2],
];
export const pz = [
  [0, 0], [7.5, 0], [10, -3.5], [11, 0], [13, 3], [15, 5], [17, 15], [18.97, 40],
  [19, -6], [22.5, 3.2], [23.5, 3.85], [23.53, -2.8], [24, -2.8],
];
export const rxk = [
  [0, 0], [7.5, 0], [10, 10], [11, -10], [13, 5], [17, 5], [18.97, 45], [19, 0],
  [22.37, 17], [23.5, 31], [23.53, 0], [24, 0],
];
export const ryk = [
  [0, -90], [7.5, -90], [8.17, -30], [10, 15], [11, 120], [13, 180], [15.5, 180],
  [18.97, 135], [19, 250], [23.03, -112], [23.5, -112], [23.53, -45], [24, -45],
];

export const beaconWorld = {
  resume: [-1.2, 2.2, 10.5],
  software: [-4, 0.8, 3],
  works: [2.2, 1.8, 6.4],
  blender: [4.2, 1.4, 9.5],
  unity: [6.4, 1.2, 13],
  tools: [-7.5, 3.2, 18],
  contact: [8.2, 3.6, 8.5],
};

export const fields = {
  software: {
    spread: [7.4, 4.8, 6.6],
    items: [
      { name: "Photoshop", img: "images/软件/PhotoShop.png", at: [0.12, 0.28], s: 1.18 },
      { name: "Substance Designer", img: "images/软件/Substance Designer.png", at: [0.38, 0.18], s: 1.0 },
      { name: "Unity", img: "images/软件/Unity.png", at: [0.64, 0.30], s: 1.08 },
      { name: "Blender", img: "images/软件/Blender.png", at: [0.88, 0.20], s: 1.14 },
      { name: "RizomUV", img: "images/软件/Rizomuv.png", at: [0.22, 0.74], s: 0.86 },
      { name: "MShader", img: "images/软件/MShader.png", at: [0.48, 0.80], s: 0.88 },
      { name: "Cursor", img: "images/软件/Cursor.png", at: [0.74, 0.68], s: 0.84 },
      { name: "Codex", img: "images/软件/Codex.png", at: [0.90, 0.78], s: 0.82 },
    ],
  },
  works: {
    spread: [8.6, 5.4, 7.2],
    items: [
      { name: "封冥", img: "images/封冥.jpg", pack: "scene" },
      { name: "三途栈道", img: "images/三途栈道.jpg", pack: "scene" },
      { name: "忏魂之地", img: "images/忏魂之地.jpg", pack: "scene" },
      { name: "悬根之扉", img: "images/悬根之扉.jpg", pack: "scene" },
      { name: "空中铁匠铺", img: "images/空中铁匠铺.jpg", pack: "scene" },
      { name: "战场", img: "images/战场_1.jpg", pack: "war" },
      { name: "战场", img: "images/战场_2.jpg", pack: "war" },
      { name: "蚂蚱", img: "images/蚂蚱_1.jpg", pack: "bug" },
      { name: "蚂蚱", img: "images/蚂蚱_2.jpg", pack: "bug" },
      { name: "", img: "images/10.jpg", pack: "qf" },
      { name: "", img: "images/QF_1.jpg", pack: "qf" },
      { name: "", img: "images/QF_2.jpg", pack: "qf" },
      { name: "", img: "images/QF_3.jpg", pack: "qf" },
      { name: "", img: "images/QF_4.jpg", pack: "qf" },
      { name: "", img: "images/QF_5.jpg", pack: "qf" },
      { name: "", img: "images/QF_6.jpg", pack: "qf" },
      { name: "", img: "images/QF_7.jpg", pack: "qf" },
      { name: "", img: "images/QF_9.jpg", pack: "qf" },
      { name: "", img: "images/QF_10.jpg", pack: "qf" },
      { name: "", img: "images/SLG_1.jpg", pack: "slg" },
      { name: "", img: "images/SLG_2.jpg", pack: "slg" },
      { name: "", img: "images/SLG_3.jpg", pack: "slg" },
      { name: "", img: "images/SLG_4.jpg", pack: "slg" },
      { name: "", img: "images/SLG_5.jpg", pack: "slg" },
      { name: "", img: "images/SLG_6.jpg", pack: "slg" },
      { name: "", img: "images/SLG_7.jpg", pack: "slg" },
      { name: "", img: "images/SLG_8.jpg", pack: "slg" },
      { name: "", img: "images/SLG_9.jpg", pack: "slg" },
      { name: "", img: "images/SLG_10.jpg", pack: "slg" },
      { name: "载具", img: "images/Tank_01.png", pack: "tank", sheet: true },
      { name: "载具", img: "images/Tank_02.png", pack: "tank", sheet: true },
    ],
  },
  blender: {
    spread: [8.6, 5.4, 7.2],
    items: [
      { name: "卡车", video: "MP4/MP4_Blender/卡车.mp4", pack: "blender" },
      { name: "魔法研究所", img: "images/魔法研究所.jpg", video: "MP4/MP4_Blender/魔法研究所.mp4", poster: "images/魔法研究所.jpg", pack: "blender" },
      { name: "空间站", video: "MP4/MP4_Blender/空间站.mp4", pack: "blender" },
      { name: "卡皮巴拉GO", video: "MP4/MP4_Blender/卡皮巴拉GO时间系统效果.mp4", pack: "blender" },
      { name: "船墓", video: "MP4/MP4_Blender/船墓0001-0216.mp4", pack: "blender" },
      { name: "Loading", video: "MP4/MP4_Blender/loading_1v10001-0250.mp4", pack: "blender" },
      { name: "0220", video: "MP4/MP4_Blender/0001-0220.mp4", pack: "blender" },
      { name: "01", video: "MP4/MP4_Blender/10001-0049.mp4", pack: "blender" },
      { name: "02", video: "MP4/MP4_Blender/20001-0047.mp4", pack: "blender" },
      { name: "03", video: "MP4/MP4_Blender/30001-0047.mp4", pack: "blender" },
      { name: "04", video: "MP4/MP4_Blender/40001-0047.mp4", pack: "blender" },
      { name: "05", video: "MP4/MP4_Blender/50001-0047.mp4", pack: "blender" },
      { name: "06", video: "MP4/MP4_Blender/60001-0047.mp4", pack: "blender" },
      { name: "07", video: "MP4/MP4_Blender/70001-0047.mp4", pack: "blender" },
      { name: "08", video: "MP4/MP4_Blender/80001-0047.mp4", pack: "blender" },
      { name: "09", video: "MP4/MP4_Blender/90001-0047.mp4", pack: "blender" },
    ],
  },
  unity: {
    spread: [8.6, 5.4, 7.2],
    items: [
      { name: "08.21", video: "MP4/MP4_Unity/bandicam 2026-08-21 12-18-06-668.mp4", pack: "unity" },
      { name: "08.24", video: "MP4/MP4_Unity/bandicam 2026-08-24 17-20-29-543.mp4", pack: "unity" },
      { name: "08.25", video: "MP4/MP4_Unity/bandicam 2026-08-25 16-59-36-004.mp4", pack: "unity" },
      { name: "08.25", video: "MP4/MP4_Unity/fd6f41dac643a094b6c20c7fda4d83b8_raw.mp4", pack: "unity" },
      { name: "08.28", video: "MP4/MP4_Unity/bandicam 2026-08-28 12-52-50-223.mp4", pack: "unity" },
      { name: "09.18", video: "MP4/MP4_Unity/bandicam 2026-09-18 13-20-03-723.mp4", pack: "unity" },
      { name: "09.18", video: "MP4/MP4_Unity/bandicam 2026-09-18 13-26-48-936.mp4", pack: "unity" },
      { name: "10.14", video: "MP4/MP4_Unity/bandicam 2026-10-14 14-11-59-168.mp4", pack: "unity" },
      { name: "10.23", video: "MP4/MP4_Unity/bb016266a95d0d09d851928f0a797713_raw.mp4", pack: "unity" },
    ],
  },
  tools: {
    spread: [8.6, 5.4, 7.2],
    items: [
      { name: "MShader 讲解", video: "MP4/MP4_Tool/MShader.mp4", pack: "tool" },
      { name: "工具演示", video: "MP4/MP4_Tool/46f589dfb40d785ba567792c98faf0ca_raw.mp4", pack: "tool" },
    ],
  },
};

export function stopByKey(key) {
  return NAV_STOPS.find((item) => item.key === key);
}

export function stopAt(t) {
  let current = NAV_STOPS[0];
  for (const stop of NAV_STOPS) {
    if (t + 0.12 >= stop.at) current = stop;
  }
  return current;
}

export function holoVisibility(id, t) {
  const stop = NAV_STOPS.find((item) => item.key === id);
  if (!stop) return 0;
  const fade = 1.45;
  if (stop.until != null) {
    if (t >= stop.at && t <= stop.until) return 1;
    const edge = t < stop.at ? stop.at : stop.until;
    return clamp(1 - Math.abs(t - edge) / fade, 0, 1);
  }
  return clamp(1 - Math.abs(t - stop.at) / fade, 0, 1);
}
