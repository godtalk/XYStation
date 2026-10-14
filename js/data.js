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
    title: "个人作品",
    meta: "原画 / 场景 / 设定",
  },
  unity: {
    code: "UN",
    title: "Unity 效果",
    meta: "场景效果 / Shader / 演示",
    html: `<p>这里放 Unity 效果图、录屏截图或说明。图片同样放到 <code>images</code> 再引用。</p>`,
  },
  tools: {
    code: "TL",
    title: "工具研发",
    meta: "自研工具 / 流程",
    html: `<p>这里写你做过的工具、插件或流程优化。有截图就一起挂上。</p>`,
  },
  contact: {
    code: "CONTACT",
    title: "联络",
    meta: "公开联系方式",
    html: `<p>手机　<a href="tel:18612238615">18612238615</a></p><p>邮箱　<a href="mailto:zxy08165108@163.com">zxy08165108@163.com</a></p><p><a href="https://github.com/godtalk" target="_blank" rel="noopener">GitHub · godtalk</a></p>`,
  },
};

export const PATH_MAX = 24;
export const WHEEL_STEP = 0.15;
export const TOUCH_SCALE = 0.05;
export const KEY_STEP = 0.8;
export const ENTER_STEP = 4.5;
export const HOLD_TICKS = 3;
export const HOLD_KEYS = ["resume", "software", "works"];
export const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 本站入口" },
  { key: "resume", at: 4.5, label: "CV 个人简历" },
  { key: "software", at: 8, label: "SW 常用软件" },
  { key: "works", at: 12, until: 15.2, label: "WK 个人作品" },
  { key: "unity", at: 16, label: "UN Unity效果" },
  { key: "tools", at: 20, label: "TL 工具研发" },
  { key: "contact", at: 23.2, label: "CT 联系方式" },
];
export const SPACE = 48;
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
      { name: "封冥", img: "images/封冥.jpg" },
      { name: "三途栈道", img: "images/三途栈道.jpg" },
      { name: "忏魂之地", img: "images/忏魂之地.jpg" },
      { name: "悬根之扉", img: "images/悬根之扉.jpg" },
      { name: "空中铁匠铺", img: "images/空中铁匠铺.jpg" },
      { name: "战场", img: "images/战场_1.jpg" },
      { name: "战场", img: "images/战场_2.jpg" },
      { name: "蚂蚱", img: "images/蚂蚱_1.jpg" },
      { name: "蚂蚱", img: "images/蚂蚱_2.jpg" },
      { name: "", img: "images/10.jpg" },
      { name: "", img: "images/QF_1.jpg" },
      { name: "", img: "images/QF_2.jpg" },
      { name: "", img: "images/QF_3.jpg" },
      { name: "", img: "images/QF_4.jpg" },
      { name: "", img: "images/QF_5.jpg" },
      { name: "", img: "images/QF_6.jpg" },
      { name: "", img: "images/QF_7.jpg" },
      { name: "", img: "images/QF_9.jpg" },
      { name: "", img: "images/QF_10.jpg" },
      { name: "", img: "images/SLG_1.jpg" },
      { name: "", img: "images/SLG_2.jpg" },
      { name: "", img: "images/SLG_3.jpg" },
      { name: "", img: "images/SLG_4.jpg" },
      { name: "", img: "images/SLG_5.jpg" },
      { name: "", img: "images/SLG_6.jpg" },
      { name: "", img: "images/SLG_7.jpg" },
      { name: "", img: "images/SLG_8.jpg" },
      { name: "", img: "images/SLG_9.jpg" },
      { name: "", img: "images/SLG_10.jpg" },
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
