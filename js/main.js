const body = document.body;
const pct = document.getElementById("pct");
const clock = document.getElementById("clock");
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const beacons = [...document.querySelectorAll(".beacon")];
const station = document.getElementById("station");

const cards = {
  resume: {
    code: "CV",
    title: "个人简历",
    meta: "游戏原画 · 资深场景",
    html: `
      <div class="cv">
        <section>
          <h3>基本信息</h3>
          <p>籍贯：北京　年龄：1990.5</p>
          <p>毕业院校：北京工业大学</p>
          <p>手机：<a href="tel:18612238615">18612238615</a></p>
          <p>邮箱：<a href="mailto:zxy08165108@163.com">zxy08165108@163.com</a></p>
        </section>
        <section>
          <h3>个人评价</h3>
          <p>职场老鸟一只，对游戏美术兴趣不减反增，保持良好的学习心态，愿意尝试并努力学习新技能。永远不会失去求知的欲望。</p>
        </section>
        <section>
          <h3>个人履历</h3>
          <p><span class="cv-time">2022.11 — 至今</span>猩球游戏　资深场景</p>
          <p><span class="cv-time">2021.11 — 2022.8</span>麦吉太文　场景原画（战棋）<br>概念、单体</p>
          <p><span class="cv-time">2020.5 — 2021.11</span>北京趣加　场景原画（欧美卡通）<br>物件、怪点、资源点、主城及单体建筑设计</p>
          <p><span class="cv-time">2018.10 — 2020.5</span>福州龙腾简合　高级场景<br>场景优化及城堡装扮（皮肤）绘制</p>
          <p><span class="cv-time">2017.11 — 2018.5</span>接包</p>
          <p><span class="cv-time">2017.4 — 2017.11</span>北京畅游创想软件技术有限公司　2D 场景原画<br>刺客信条手游版 DEMO 场景及气氛图设计（未立项）<br>欧美风格手游 DEMO 场景及气氛图设计（未立项）<br>中国风卡牌手游 DEMO 场景及气氛图设计（未立项）</p>
          <p><span class="cv-time">2016.4 — 2017.3</span>福州网龙网络公司　2D 场景原画<br>魔域世界手游场景设计<br>英魂之刃　MOBA 类游戏场景设计<br>无境战地　游戏场景气氛设计<br>一战风云 VR 游戏场景规划气氛设计</p>
          <p><span class="cv-time">2015.1 — 2016.1</span>负负得正影视文化有限公司　影视概念设计<br>电影《西游记之女儿国》前期角色、怪物及场景初始设定<br>电影《哪吒闹海》前期角色、怪物及场景初始设定</p>
          <p><span class="cv-time">2014.5 — 2014.12</span>中国手游娱乐集团《光荣之路》　UI 界面及人物、怪物原画设计</p>
          <p><span class="cv-time">2013.8 — 2014.3</span>西安磐石信息科技有限公司　原画师兼实习生代课老师</p>
          <p><span class="cv-time">2012.7 — 2013.3</span>一丁画室　原画学习</p>
          <p><span class="cv-time">2008.9 — 2012.6</span>北京工业大学艺术设计学院　数字媒体专业</p>
        </section>
        <section>
          <h3>技能方向</h3>
          <p>游戏原画　2D 场景　概念 / 气氛图　角色与怪物设定　影视概念设计</p>
        </section>
      </div>`,
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
    html: `<p>手机　<a href="tel:18612238615">18612238615</a></p><p>邮箱　<a href="mailto:zxy08165108@163.com">zxy08165108@163.com</a></p><p><a href="https://gitee.com/GodTalk" target="_blank" rel="noopener">Gitee · GodTalk</a></p>`,
  },
};

const title = document.querySelector(".fly-title");
const gateUi = [...document.querySelectorAll(".gate-ui")];

const PATH_MAX = 24;
const WHEEL_STEP = 0.45;
const TOUCH_SCALE = 0.05;
const KEY_STEP = 0.8;
const ENTER_STEP = 4.5;
const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 本站入口" },
  { key: "resume", at: 4.5, label: "CV 个人简历" },
  { key: "software", at: 8, label: "SW 常用软件" },
  { key: "works", at: 12, label: "WK 个人作品" },
  { key: "unity", at: 16, label: "UN Unity效果" },
  { key: "tools", at: 20, label: "TL 工具研发" },
  { key: "contact", at: 23.2, label: "CT 联系方式" },
];
const SPACE = 48;
const px = [
  [0, -18], [4, -12.34], [6, -7], [8, -2.5], [10, -2.5], [11, -1.6], [13, 0], [15, 0],
  [17, 4.5], [18.97, -15], [19, 0], [22.5, 4.5], [23.5, 9.5], [23.53, 2.8], [24, 2.8],
];
const py = [
  [0, 0], [8, 0], [10, 0.1], [11, 1], [13, 1], [15, 1.75], [17, 1], [18.97, 14],
  [19, -3.6], [22.5, 4.7], [23.5, 15.5], [23.53, 0.5], [24, 1.2],
];
const pz = [
  [0, 0], [7.5, 0], [10, -3.5], [11, 0], [13, 3], [15, 5], [17, 15], [18.97, 40],
  [19, -6], [22.5, 3.2], [23.5, 3.85], [23.53, -2.8], [24, -2.8],
];
const rxk = [
  [0, 0], [7.5, 0], [10, 10], [11, -10], [13, 5], [17, 5], [18.97, 45], [19, 0],
  [22.37, 17], [23.5, 31], [23.53, 0], [24, 0],
];
const ryk = [
  [0, -90], [7.5, -90], [8.17, -30], [10, 15], [11, 120], [13, 180], [15.5, 180],
  [18.97, 135], [19, 250], [23.03, -112], [23.5, -112], [23.53, -45], [24, -45],
];

const beaconWorld = {
  resume: [-1.2, 2.2, 10.5],
  software: [-4, 0.8, 3],
  works: [2.2, 1.8, 6.4],
  unity: [6.4, 1.2, 13],
  tools: [-7.5, 3.2, 18],
  contact: [8.2, 3.6, 8.5],
};

const fields = {
  software: {
    spread: [7.4, 4.8, 6.6],
    items: [
      { name: "Photoshop" },
      { name: "Illustrator" },
      { name: "Substance" },
      { name: "Painter" },
      { name: "Unity" },
      { name: "Blender" },
      { name: "ZBrush" },
      { name: "After Effects" },
      { name: "PureRef" },
      { name: "RizomUV" },
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

const fieldNodes = [];

const cam = {
  x: 0,
  y: 0,
  z: 0,
  rx: 0,
  ry: 0,
  lookX: 0,
  lookY: 0,
  mx: 0,
  my: 0,
  progress: 0,
  target: 0,
  vz: 0,
};

const dust = [];
const motes = [];
let ready = false;
let lastTouchY = 0;
let phase = "is-boot";

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function spawnDust() {
  dust.length = 0;
  motes.length = 0;
  for (let i = 0; i < 260; i += 1) {
    dust.push({
      x: (Math.random() - 0.5) * 92,
      y: (Math.random() - 0.5) * 52,
      z: (Math.random() - 0.4) * 96,
    });
  }
  for (let i = 0; i < 40; i += 1) {
    let x = (Math.random() - 0.5) * 72;
    let y = (Math.random() - 0.5) * 44;
    let z = (Math.random() - 0.3) * 80;
    if (Math.abs(x) < 5 && Math.abs(y) < 3.5) {
      x += (x < 0 ? -1 : 1) * (8 + Math.random() * 14);
      y += (y < 0 ? -1 : 1) * (6 + Math.random() * 10);
    }
    motes.push({
      x,
      y,
      z,
      r: 0.16 + Math.random() * 0.32,
    });
  }
}

function sample(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < keys.length - 1; i += 1) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const u = (t - a[0]) / (b[0] - a[0]);
      const s = u * u * (3 - 2 * u);
      return a[1] + (b[1] - a[1]) * s;
    }
  }
  return last[1];
}

function poseAt(t) {
  const deg = Math.PI / 180;
  cam.x = sample(px, t) * SPACE;
  cam.y = sample(py, t) * SPACE;
  cam.z = sample(pz, t) * SPACE;
  cam.rx = sample(rxk, t) * deg;
  cam.ry = sample(ryk, t) * deg;
}

function project(wx, wy, wz) {
  let x = wx * SPACE - cam.x;
  let y = wy * SPACE - cam.y;
  let z = wz * SPACE - cam.z;
  const cy = Math.cos(-cam.ry);
  const sy = Math.sin(-cam.ry);
  const x1 = x * cy - z * sy;
  let z1 = x * sy + z * cy;
  const cx = Math.cos(-cam.rx);
  const sx = Math.sin(-cam.rx);
  const y1 = y * cx - z1 * sx;
  const z2 = y * sx + z1 * cx;
  const lx = -cam.lookY * 0.32;
  const ly = -cam.lookX * 0.22;
  const clx = Math.cos(-lx);
  const slx = Math.sin(-lx);
  const y2 = y1 * clx - z2 * slx;
  const z3 = y1 * slx + z2 * clx;
  const cly = Math.cos(-ly);
  const sly = Math.sin(-ly);
  const x2 = x1 * cly - z3 * sly;
  const z4 = x1 * sly + z3 * cly;
  if (z4 < 12) return null;
  const focal = Math.min(innerWidth, innerHeight) * 0.92;
  return {
    x: innerWidth / 2 + (x2 * focal) / z4,
    y: innerHeight * 0.48 + (y2 * focal) / z4,
    s: focal / z4,
    depth: z4,
  };
}

function titleMaskRect() {
  if (phase === "is-station") return null;
  const op = Number.parseFloat(title.style.opacity || "1");
  if (op < 0.08) return null;
  const r = title.getBoundingClientRect();
  if (r.width < 4) return null;
  return {
    left: r.left - 16,
    right: r.right + 16,
    top: r.top - 10,
    bottom: r.bottom + 10,
  };
}

function hitsTitle(a, mask) {
  return mask && a.x >= mask.left && a.x <= mask.right && a.y >= mask.top && a.y <= mask.bottom;
}

function drawWorld() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.fillStyle = "#1a1814";
  ctx.strokeStyle = "rgba(22, 21, 19, 0.45)";
  const mask = titleMaskRect();

  motes.forEach((m) => {
    const a = project(m.x, m.y, m.z);
    if (!a || hitsTitle(a, mask)) return;
    const alpha = Math.min(0.28, 140 / a.depth);
    ctx.globalAlpha = alpha;
    const size = Math.max(2, a.s * m.r * 0.9);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  });

  dust.forEach((p) => {
    const a = project(p.x, p.y, p.z);
    if (!a || hitsTitle(a, mask)) return;
    ctx.globalAlpha = Math.min(0.5, 90 / a.depth);
    ctx.beginPath();
    ctx.arc(a.x, a.y, Math.max(0.4, a.s * 0.012), 0, Math.PI * 2);
    ctx.fill();
  });

  drawFieldLinks();
  ctx.globalAlpha = 1;
}

function layoutBeacons() {
  const atGate = phase !== "is-station";
  beacons.forEach((el) => {
    if (atGate) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    const pos = beaconWorld[el.dataset.id];
    if (!pos) return;
    const p = project(pos[0], pos[1], pos[2]);
    if (!p || p.depth < 20 || p.depth > 1400) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    const visible = Math.max(0, 1 - Math.abs(p.depth - 280) / 900);
    const holoOn = holoVisibility(el.dataset.id, cam.progress) > 0.18;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.style.opacity = holoOn ? "0" : String(visible * 0.95);
    el.style.pointerEvents = !holoOn && visible > 0.22 ? "auto" : "none";
    const scale = clamp(p.s * 0.045, 0.45, 1.35);
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
  });
  layoutHolos();
  layoutFields();
}

function holoVisibility(id, t) {
  const stop = NAV_STOPS.find((item) => item.key === id);
  if (!stop) return 0;
  return clamp(1 - Math.abs(t - stop.at) / 2.4, 0, 1);
}

function layoutHolos() {
  document.querySelectorAll(".holo").forEach((el) => {
    const id = el.dataset.id;
    const vis = holoVisibility(id, cam.progress);
    if (vis < 0.1) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    if (id === "resume" && innerWidth >= 720) {
      const navW = 176;
      el.style.left = `${navW + (innerWidth - navW) * 0.52}px`;
      el.style.top = "50%";
      el.style.bottom = "auto";
      el.style.transform = "translate(-50%, -50%)";
    } else if (innerWidth < 720) {
      el.style.left = "12px";
      el.style.top = "auto";
      el.style.bottom = "92px";
      el.style.transform = "none";
    } else {
      const pos = beaconWorld[id];
      const p = pos ? project(pos[0], pos[1], pos[2]) : null;
      if (!p) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        return;
      }
      el.style.bottom = "auto";
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      const scale = clamp(p.s * 0.042, 0.7, 1);
      el.style.transform = `translate(22px, -52%) scale(${scale})`;
    }
    el.style.opacity = String(vis);
    el.style.pointerEvents = vis > 0.28 ? "auto" : "none";
    el.style.zIndex = String(4 + Math.round(vis * 6));
  });
  syncScrollTracks();
}

function syncScrollTracks() {
  document.querySelectorAll(".float-scroll").forEach((pane) => {
    const wrap = pane.parentElement;
    const fill = wrap.querySelector(".float-fill");
    const thumb = wrap.querySelector(".float-thumb");
    if (!fill) return;
    const max = pane.scrollHeight - pane.clientHeight;
    const ratio = max <= 0 ? 0 : pane.scrollTop / max;
    wrap.classList.toggle("is-scrollable", max > 8);
    fill.style.height = `${ratio * 100}%`;
    if (thumb) thumb.style.top = `${ratio * 100}%`;
  });
}

function bindScrollTracks() {
  document.querySelectorAll(".float-wrap").forEach((wrap) => {
    const pane = wrap.querySelector(".float-scroll");
    const rail = wrap.querySelector(".float-rail");
    if (!pane) return;
    pane.addEventListener("scroll", syncScrollTracks, { passive: true });
    if (!rail) return;
    rail.addEventListener("pointerdown", (event) => {
      const rect = rail.getBoundingClientRect();
      const ratio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      pane.scrollTop = ratio * (pane.scrollHeight - pane.clientHeight);
    });
  });
  syncScrollTracks();
}

function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function scatterAround(origin, count, spread, seed) {
  const pts = [];
  let k = seed;
  let guard = 0;
  while (pts.length < count && guard < 500) {
    guard += 1;
    k += 1;
    const next = [
      origin[0] + (hash01(k) - 0.5) * spread[0],
      origin[1] + (hash01(k + 19) - 0.5) * spread[1],
      origin[2] + (hash01(k + 41) - 0.5) * spread[2],
    ];
    if (pts.some((pt) => Math.hypot(pt[0] - next[0], pt[1] - next[1], pt[2] - next[2]) < 1.45)) continue;
    pts.push(next);
  }
  return pts;
}

function buildFields() {
  fieldNodes.length = 0;
  Object.entries(fields).forEach(([group, field], g) => {
    const origin = beaconWorld[group];
    const pts = scatterAround(origin, field.items.length, field.spread, 17 + g * 80);
    field.items.forEach((item, i) => {
      const pos = pts[i] || origin;
      const el = document.createElement("button");
      el.type = "button";
      el.className = `dot ${group === "works" ? "dot-work" : "dot-soft"}`;
      el.dataset.group = group;
      const size = 0.7 + hash01(i * 9.1 + g) * 0.9;
      el.style.setProperty("--dot", `${8 + size * 8}px`);
      el.style.setProperty("--plate", `${96 + size * 54}px`);
      el.style.setProperty("--plate-h", `${60 + size * 32}px`);
      if (item.img) el.classList.add("has-img");
      const src = encodeURI(item.img || "");
      el.innerHTML = `${item.img ? `<img src="${src}" alt="${item.name || "作品"}">` : "<i></i>"}${item.name ? `<span>${item.name}</span>` : ""}`;
      if (item.img) {
        el.addEventListener("click", () => openPeek(src, item.name));
      }
      station.appendChild(el);
      fieldNodes.push({ el, group, x: pos[0], y: pos[1], z: pos[2], size });
    });
  });
}

function layoutFields() {
  const now = performance.now() / 1000;
  const navW = innerWidth >= 720 ? 220 : 12;
  const areaW = innerWidth - navW - 40;
  const areaH = innerHeight - 110;
  const cx = navW + areaW * 0.5;
  const cy = innerHeight * 0.5;
  ["software", "works"].forEach((group) => {
    const vis = phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
    const nodes = fieldNodes.filter((node) => node.group === group);
    const wide = group === "works";
    nodes.forEach((node, n) => {
      if (vis < 0.08) {
        node.el.style.opacity = "0";
        node.el.style.pointerEvents = "none";
        node.screen = null;
        return;
      }
      const seed = wide ? 40 : 3;
      const a = hash01(n * 2.17 + seed);
      const b = hash01(n * 5.91 + seed + 11);
      const c = hash01(n * 13.3 + seed + 8);
      const rx = areaW * (wide ? 0.44 : 0.4) * (0.22 + a);
      const ry = areaH * (wide ? 0.4 : 0.36) * (0.24 + b);
      const ang = (n + 0.2) * 2.399963 + c * 0.35;
      const bob = wide ? 6 : 10;
      const bobX = Math.sin(now * 0.45 + n * 1.1) * bob + cam.lookX * 14;
      const bobY = Math.cos(now * 0.38 + n * 0.8) * bob + cam.lookY * 10;
      const x = cx + Math.cos(ang) * rx + bobX;
      const y = cy + Math.sin(ang) * ry + bobY;
      node.el.style.left = `${x}px`;
      node.el.style.top = `${y}px`;
      node.el.style.opacity = String(vis);
      node.el.style.pointerEvents = vis > 0.22 ? "auto" : "none";
      node.el.style.zIndex = String(5 + Math.round(vis * 6));
      node.el.style.transform = `translate(-50%, -50%) scale(${0.94 + node.size * 0.1})`;
      node.screen = { x, y, vis, depth: 1 };
    });
  });
}

function drawFieldLinks() {
  ["software"].forEach((group) => {
    const vis = phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
    if (vis < 0.12) return;
    const pts = fieldNodes.filter((node) => node.group === group && node.screen);
    ctx.strokeStyle = "rgba(22, 21, 19, 0.22)";
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i].screen;
      for (let j = i + 1; j < pts.length; j += 1) {
        const b = pts[j].screen;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 220 || d < 30) continue;
        ctx.globalAlpha = vis * 0.22 * (1 - d / 220);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  });
}

function buildHolos() {
  Object.entries(cards).forEach(([id, card]) => {
    if (fields[id] || !card.html) return;
    const el = document.createElement("article");
    el.className = `holo${id === "resume" ? " holo-resume" : ""}`;
    el.dataset.id = id;
    const scroll = `<div class="float-scroll">${card.html}</div><div class="float-rail" aria-hidden="true"><span class="float-fill"></span><i class="float-thumb"></i></div>`;
    if (id === "resume") {
      el.innerHTML = `<div class="cv-split"><img class="cv-avatar" src="images/TouXiang.png" alt="头像"><div class="cv-right"><p class="holo-code">${card.code}</p><h2>${card.title}</h2><p class="holo-meta">${card.meta}</p><div class="float-wrap">${scroll}</div></div></div>`;
    } else {
      el.innerHTML = `<p class="holo-code">${card.code}</p><h2>${card.title}</h2><p class="holo-meta">${card.meta}</p><div class="float-wrap">${scroll}</div>`;
    }
    station.appendChild(el);
  });
  bindScrollTracks();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setPhase(name) {
  if (phase === name) return;
  phase = name;
  body.classList.remove("is-boot", "is-gate", "is-station");
  body.classList.add(name);
  document.getElementById("gate").setAttribute("aria-hidden", name === "is-boot");
  document.getElementById("station").setAttribute("aria-hidden", name === "is-boot");
}

function applyProgress(t) {
  const p = t / PATH_MAX;
  const fly = clamp(p / 0.12, 0, 1);
  title.style.transform = `translateZ(${fly * 1260}px) scale(${1 + fly * 3.4})`;
  title.style.opacity = String(1 - fly);
  gateUi.forEach((el) => {
    const fade = clamp(1 - p / 0.05, 0, 1);
    el.style.opacity = String(fade);
    el.style.pointerEvents = fade < 0.2 ? "none" : "auto";
  });
  poseAt(t);
  layoutBeacons();
  syncRail(t);
  if (!ready) return;
  if (cam.target >= 4 || t >= 3.1) setPhase("is-station");
  else setPhase("is-gate");
}

function stopAt(t) {
  let current = NAV_STOPS[0];
  for (const stop of NAV_STOPS) {
    if (t + 0.12 >= stop.at) current = stop;
  }
  return current;
}

function jumpTo(key) {
  const stop = NAV_STOPS.find((item) => item.key === key);
  if (!ready || !stop) return;
  cam.target = stop.at;
}

function syncRail(t) {
  const now = document.getElementById("rail-now");
  const current = stopAt(t);
  now.textContent = current.label;
  NAV_STOPS.forEach((stop, index) => {
    const next = NAV_STOPS[index + 1];
    if (!next) return;
    const span = next.at - stop.at;
    const fill = span <= 0 ? 0 : clamp((t - stop.at) / span, 0, 1);
    const seg = document.querySelector(`.rail-seg[data-from="${stop.key}"]`);
    if (seg) seg.style.setProperty("--seg", `${fill * 100}%`);
  });
  setActiveNav(current.key);
}

function nudge(delta) {
  if (!ready || body.classList.contains("is-peek")) return;
  cam.target = clamp(cam.target + delta, 0, PATH_MAX);
}

function openPeek(src, caption) {
  const peek = document.getElementById("peek");
  const img = document.getElementById("peek-img");
  const cap = document.getElementById("peek-cap");
  img.src = src;
  img.alt = caption || "作品";
  cap.textContent = caption || "";
  peek.hidden = false;
  requestAnimationFrame(() => peek.classList.add("is-on"));
  body.classList.add("is-peek");
}

function closePeek() {
  const peek = document.getElementById("peek");
  peek.classList.remove("is-on");
  body.classList.remove("is-peek");
  window.setTimeout(() => {
    if (!peek.classList.contains("is-on")) peek.hidden = true;
  }, 220);
}

function boot() {
  const start = performance.now();
  const duration = 1800;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    pct.textContent = `${Math.round((1 - (1 - t) ** 3) * 100)}%`;
    if (t < 1) {
      requestAnimationFrame(step);
      return;
    }
    ready = true;
    setPhase("is-gate");
  };
  requestAnimationFrame(step);
}

function tickClock() {
  clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function setActiveNav(key) {
  const idx = NAV_STOPS.findIndex((item) => item.key === key);
  document.querySelectorAll(".rail-item").forEach((btn) => {
    const btnKey = btn.dataset.go === "gate" ? "gate" : btn.dataset.id;
    const btnIdx = NAV_STOPS.findIndex((item) => item.key === btnKey);
    const on = btnKey === key;
    btn.classList.toggle("is-on", on);
    btn.classList.toggle("is-passed", btnIdx >= 0 && idx >= 0 && btnIdx < idx);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

function loop() {
  cam.lookX += (cam.mx - cam.lookX) * 0.05;
  cam.lookY += (cam.my - cam.lookY) * 0.05;
  const prev = cam.progress;
  cam.progress += (cam.target - cam.progress) * 0.05;
  cam.vz = Math.abs(cam.progress - prev) * PATH_MAX;
  applyProgress(cam.progress);
  drawWorld();
  requestAnimationFrame(loop);
}

resize();
spawnDust();
buildHolos();
buildFields();
layoutBeacons();
tickClock();
setInterval(tickClock, 1000);
boot();
loop();

window.addEventListener("resize", () => {
  resize();
  spawnDust();
});

window.addEventListener("mousemove", (event) => {
  cam.mx = (event.clientX / innerWidth - 0.5) * 1.2;
  cam.my = (event.clientY / innerHeight - 0.5) * 1.2;
  document.documentElement.style.setProperty("--mx", `${(event.clientX / innerWidth) * 100}%`);
  document.documentElement.style.setProperty("--my", `${(event.clientY / innerHeight) * 100}%`);
});

document.getElementById("enter").addEventListener("click", () => nudge(ENTER_STEP));
document.querySelectorAll(".beacon[data-id]").forEach((el) => {
  el.addEventListener("click", () => jumpTo(el.dataset.id));
});
document.querySelectorAll(".rail-item[data-id]").forEach((el) => {
  el.addEventListener("click", () => jumpTo(el.dataset.id));
});
document.querySelectorAll("[data-go='gate']").forEach((el) => {
  el.addEventListener("click", () => jumpTo("gate"));
});
document.querySelector(".peek-mask").addEventListener("click", closePeek);
setActiveNav(null);

window.addEventListener(
  "wheel",
  (event) => {
    if (event.target.closest(".holo") || body.classList.contains("is-peek")) return;
    event.preventDefault();
    const step = event.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
    nudge(step);
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (event) => {
    lastTouchY = event.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    if (event.target.closest(".holo") || body.classList.contains("is-peek")) return;
    event.preventDefault();
    const y = event.touches[0].clientY;
    nudge((lastTouchY - y) * TOUCH_SCALE);
    lastTouchY = y;
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePeek();
    return;
  }
  if (body.classList.contains("is-peek")) return;
  if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Enter") nudge(KEY_STEP);
  if (event.key === "ArrowDown" || event.key === "PageDown") nudge(-KEY_STEP);
});
