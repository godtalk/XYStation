const body = document.body;
const pct = document.getElementById("pct");
const clock = document.getElementById("clock");
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const ash = document.getElementById("ash");
const ashCtx = ash.getContext("2d");
const beacons = [...document.querySelectorAll(".beacon")];
const station = document.getElementById("station");

const cards = {
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

const title = document.querySelector(".fly-title");
const gateUi = [...document.querySelectorAll(".gate-ui")];

const PATH_MAX = 24;
const WHEEL_STEP = 0.3;
const TOUCH_SCALE = 0.05;
const KEY_STEP = 0.8;
const ENTER_STEP = 4.5;
const HOLD_TICKS = 3;
const HOLD_KEYS = ["resume", "software", "works"];
const holdState = {
  resume: { count: 0, armed: true },
  software: { count: 0, armed: true },
  works: { count: 0, armed: true },
};
const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 本站入口" },
  { key: "resume", at: 4.5, label: "CV 个人简历" },
  { key: "software", at: 8, label: "SW 常用软件" },
  { key: "works", at: 12, until: 15.2, label: "WK 个人作品" },
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
  vel: 0,
};

const dust = [];
const motes = [];
const floaters = [];
let vortexClock = 0;
let ready = false;
let lastTouchY = 0;
let phase = "is-boot";

function fitCanvas(el, context) {
  el.width = innerWidth * devicePixelRatio;
  el.height = innerHeight * devicePixelRatio;
  el.style.width = `${innerWidth}px`;
  el.style.height = `${innerHeight}px`;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function resize() {
  fitCanvas(canvas, ctx);
  fitCanvas(ash, ashCtx);
}

function sinNoise2(x, y, z) {
  return [
    Math.sin(x * 12.9898 + y * 78.233) * Math.cos(z * 45.164) * 0.5,
    Math.cos(x * 91.123 + z * 37.719) * Math.sin(y * 83.456) * 0.5,
  ];
}

function spawnDust() {
  dust.length = 0;
  motes.length = 0;
  floaters.length = 0;
  for (let i = 0; i < 260; i += 1) {
    const x = (Math.random() - 0.5) * 92;
    const y = (Math.random() - 0.5) * 52;
    const z = (Math.random() - 0.4) * 96;
    dust.push({
      x, y, z, bx: x, by: y, bz: z, ph: Math.random() * Math.PI * 2,
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
      x, y, z, bx: x, by: y, bz: z,
      r: 0.16 + Math.random() * 0.32,
      ph: Math.random() * Math.PI * 2,
    });
  }
  const area = innerWidth * innerHeight;
  const count = Math.round(Math.min(28000, Math.max(14000, area / 55)));
  const rMax = Math.min(innerWidth, innerHeight) * 0.74;
  const rMin = 10;
  const arms = 6;
  const twist = 1.22;
  const gap = (Math.PI * 2) / arms;
  for (let i = 0; i < count; i += 1) {
    const u = Math.pow(Math.random(), 1.35);
    const tail = Math.pow(Math.random(), 3.8) * rMax * 0.28;
    const r = rMin + u * (rMax - rMin) + tail;
    const arm = i % arms;
    const onArm = Math.random() > 0.22;
    const th = onArm
      ? arm * gap + Math.log(r / rMin) * twist + (Math.random() - 0.5) * 0.55
      : Math.random() * Math.PI * 2;
    floaters.push({
      r,
      th,
      th0: th,
      rMax,
      rMin,
      twist,
      seed: Math.random() * 40,
      mass: 0.48 + Math.random() * 1.2,
      size: 1,
      a: onArm ? 0.2 + Math.random() * 0.32 : 0.1 + Math.random() * 0.16,
    });
  }
}

function tickDust(now) {
  const t = now / 1000;
  const dt = Math.min(0.033, vortexClock ? (now - vortexClock) / 1000 : 0.016);
  vortexClock = now;
  dust.forEach((p) => {
    p.x = p.bx + Math.sin(t * 0.07 + p.ph) * 1.6;
    p.y = p.by + Math.cos(t * 0.055 + p.ph * 1.1) * 1.2;
    p.z = p.bz + Math.sin(t * 0.04 + p.ph * 0.8) * 2.1;
  });
  motes.forEach((m) => {
    m.x = m.bx + Math.sin(t * 0.05 + m.ph) * 1.1;
    m.y = m.by + Math.cos(t * 0.045 + m.ph) * 0.9;
    m.z = m.bz + Math.sin(t * 0.035 + m.ph * 0.7) * 1.4;
  });
  const cx = innerWidth * 0.5 + cam.lookX * 48;
  const cy = innerHeight * 0.48 + cam.lookY * 32;
  const omega = -0.34;
  const flow = 0.03;
  const amp = 86;
  const crawl = t * 0.08;
  for (let i = 0; i < floaters.length; i += 1) {
    const p = floaters[i];
    p.th += omega * dt;
    p.r += ((p.r * omega) / p.twist) * flow * dt;
    if (p.r < p.rMin) {
      p.r = p.rMax * (0.72 + Math.random() * 0.28);
      const arm = Math.floor(Math.random() * 6);
      p.th = arm * ((Math.PI * 2) / 6) + Math.log(p.r / p.rMin) * p.twist + (Math.random() - 0.5) * 0.5;
      p.th0 = p.th;
    }
    const xw = Math.cos(p.th) * p.r;
    const yw = Math.sin(p.th) * p.r;
    const n1 = sinNoise2(p.r * 0.0065, p.th0 * 0.7, crawl + p.seed * 0.03);
    const n2 = sinNoise2(p.r * 0.013, p.th0 * 1.4, crawl * 0.85 + p.seed * 0.02);
    const lx = (n1[0] + n2[0] * 0.45) * amp;
    const ly = (n1[1] + n2[1] * 0.45) * amp;
    const ct = Math.cos(p.th);
    const st = Math.sin(p.th);
    p.x = cx + xw + lx * ct - ly * st;
    p.y = cy + yw + lx * st + ly * ct;
    const u = p.r / p.rMax;
    p.size = p.mass * (0.55 + u * 1.25);
    p.aView = clamp((p.a || 0.2) * (0.75 + u * 0.35), 0.08, 0.5);
  }
}

function drawFloaters() {
  ashCtx.clearRect(0, 0, innerWidth, innerHeight);
  const vis = phase === "is-station" ? clamp(1 - cam.progress / 5.2, 0.12, 1) : 1;
  if (vis < 0.02) return;
  ashCtx.fillStyle = "#1a1814";
  for (let i = 0; i < floaters.length; i += 1) {
    const p = floaters[i];
    ashCtx.globalAlpha = (p.aView || p.a) * vis;
    const sz = Math.max(0.4, p.size);
    ashCtx.fillRect(p.x, p.y, sz, sz);
  }
  ashCtx.globalAlpha = 1;
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

function drawWorld() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.fillStyle = "#1a1814";
  ctx.strokeStyle = "rgba(22, 21, 19, 0.45)";

  motes.forEach((m) => {
    const a = project(m.x, m.y, m.z);
    if (!a) return;
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
    if (!a) return;
    ctx.globalAlpha = Math.min(0.62, 110 / a.depth);
    ctx.beginPath();
    ctx.arc(a.x, a.y, Math.max(0.65, a.s * 0.018), 0, Math.PI * 2);
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
  const fade = 1.45;
  if (stop.until != null) {
    if (t >= stop.at && t <= stop.until) return 1;
    const edge = t < stop.at ? stop.at : stop.until;
    return clamp(1 - Math.abs(t - edge) / fade, 0, 1);
  }
  return clamp(1 - Math.abs(t - stop.at) / fade, 0, 1);
}

function slamOf(vis) {
  const s = vis * vis;
  return {
    scale: 0.76 + s * 0.24,
    blur: (1 - s) * 14,
    yaw: (1 - s) * 16,
    lift: (1 - s) * 36,
  };
}

function layoutHolos() {
  document.querySelectorAll(".holo").forEach((el) => {
    const id = el.dataset.id;
    const vis = holoVisibility(id, cam.progress);
    if (vis < 0.1) {
      el.style.opacity = "0";
      el.style.filter = "none";
      el.style.pointerEvents = "none";
      return;
    }
    const slam = slamOf(vis);
    if (id === "resume" && innerWidth >= 720) {
      const navW = 210;
      el.style.left = `${navW + (innerWidth - navW) / 2}px`;
      el.style.top = "50%";
      el.style.bottom = "auto";
      el.style.transform = `translate(-50%, calc(-50% + ${slam.lift}px)) scale(${slam.scale}) rotateY(${slam.yaw}deg)`;
    } else if (innerWidth < 720) {
      el.style.left = "12px";
      el.style.top = "auto";
      el.style.bottom = "92px";
      el.style.transform = `scale(${slam.scale})`;
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
      const scale = clamp(p.s * 0.042, 0.7, 1) * slam.scale;
      el.style.transform = `translate(22px, -52%) scale(${scale}) rotateY(${slam.yaw}deg)`;
    }
    el.style.filter = slam.blur < 0.4 ? "none" : `blur(${slam.blur.toFixed(1)}px)`;
    el.style.opacity = String(Math.pow(vis, 0.65));
    el.style.pointerEvents = vis > 0.42 ? "auto" : "none";
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
      if (item.img && group === "works") {
        el.addEventListener("click", () => openPeek(src, item.name, el));
      }
      station.appendChild(el);
      fieldNodes.push({ el, group, x: pos[0], y: pos[1], z: pos[2], size, at: item.at, scale: item.s || 1 });
    });
  });
}

function layoutFields() {
  const now = performance.now() / 1000;
  const navW = innerWidth >= 720 ? 220 : 12;
  const areaW = innerWidth - navW - 40;
  const areaH = innerHeight - 110;
  ["software", "works"].forEach((group) => {
    const vis = phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
    const nodes = fieldNodes.filter((node) => node.group === group);
    if (group === "software") layoutSoftware(nodes, vis, now, navW, areaW, areaH);
    else layoutWorks(nodes, vis, navW, areaW, areaH);
  });
}

function layoutWorks(nodes, vis, navW, areaW, areaH) {
  const rows = areaW < 640 ? 3 : 2;
  const cols = Math.ceil(nodes.length / rows);
  const gap = areaW < 640 ? 14 : 24;
  const cellH = Math.min(areaH / rows - 36, rows === 2 ? 268 : 176);
  const cellW = cellH * 1.58;
  const wallW = cols * (cellW + gap) - gap;
  const wallH = rows * (cellH + gap + 20) - gap;
  const viewL = navW + 28;
  const viewW = areaW - 12;
  const ox = viewL;
  const oy = innerHeight * 0.5 - wallH * 0.5;
  const stop = stopByKey("works");
  const start = stop.at;
  const end = stop.until || start + 3;
  const u = clamp((cam.progress - start) / Math.max(0.001, end - start), 0, 1);
  const panMax = Math.max(0, wallW - viewW * 0.62);
  const pan = panMax * u + cam.lookX * 22;
  const focusX = viewL + viewW * 0.42;

  nodes.forEach((node, n) => {
    if (vis < 0.08) {
      node.el.style.opacity = "0";
      node.el.style.pointerEvents = "none";
      node.screen = null;
      return;
    }
    const col = Math.floor(n / rows);
    const row = n % rows;
    const x = ox + col * (cellW + gap) + cellW * 0.5 - pan;
    const y = oy + row * (cellH + gap + 18) + cellH * 0.5;
    const dx = (x - focusX) / Math.max(220, viewW);
    const dist = Math.abs(dx);
    const on = x > -cellW && x < innerWidth + cellW;
    const scale = clamp(1.06 - dist * 0.48, 0.58, 1.1);
    const yaw = clamp(-dx * 38, -46, 46);
    const z = (1.05 - dist) * 90;
    const fade = vis * (on ? clamp(1.12 - dist * 0.72, 0.16, 1) : 0);
    node.el.style.setProperty("--plate", `${Math.round(cellW)}px`);
    node.el.style.setProperty("--plate-h", `${Math.round(cellH)}px`);
    node.el.style.left = `${x}px`;
    node.el.style.top = `${y}px`;
    node.el.style.opacity = String(fade);
    node.el.style.pointerEvents = fade > 0.28 ? "auto" : "none";
    node.el.style.zIndex = String(8 + Math.round(scale * 12));
    node.el.style.transform = `translate(-50%, -50%) translateZ(${z}px) rotateY(${yaw}deg) scale(${scale})`;
    node.screen = { x, y, vis: fade, depth: scale };
  });
}

let softClock = 0;

function layoutSoftware(nodes, vis, now, navW, areaW, areaH) {
  const boardW = Math.min(areaW * 0.86, 1280);
  const boardH = Math.min(areaH * 0.66, 620);
  const ox = navW + 20 + (areaW - boardW) * 0.5;
  const oy = (innerHeight - boardH) * 0.46;
  const compact = areaW < 640;
  const base = compact ? 110 : Math.max(134, Math.min(178, boardW * 0.142));
  const compactAt = [
    [0.28, 0.14], [0.72, 0.14], [0.28, 0.38], [0.72, 0.38],
    [0.28, 0.62], [0.72, 0.62], [0.28, 0.86], [0.72, 0.86],
  ];
  const tms = performance.now();
  const dt = Math.min(2.2, (tms - (softClock || tms)) / 16.67) || 1;
  softClock = tms;
  const live = [];

  nodes.forEach((node, n) => {
    const s = compact ? 1 : (node.scale || 1);
    const size = Math.round(base * s);
    node.el.style.setProperty("--soft", `${size}px`);
    const rad = size * 0.5 + 24;
    const slot = compact ? compactAt[n] : (node.at || [0.5, 0.5]);
    if (!node.body) {
      const ang = hash01(n * 7.3 + 2) * Math.PI * 2;
      const spd = 0.08 + hash01(n * 3.1) * 0.06;
      node.body = {
        x: ox + slot[0] * boardW,
        y: oy + slot[1] * boardH,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        ph: hash01(n * 4.4) * Math.PI * 2,
        zf: 0.18 + hash01(n * 8.7) * 0.12,
      };
    }
    node.body.r = rad;
    if (vis < 0.08) {
      node.el.style.opacity = "0";
      node.el.style.pointerEvents = "none";
      node.screen = null;
      return;
    }
    live.push(node);
  });

  const pad = 8;
  live.forEach((node) => {
    const b = node.body;
    b.vx += (Math.random() - 0.5) * 0.008 * dt;
    b.vy += (Math.random() - 0.5) * 0.008 * dt;
    let spd = Math.hypot(b.vx, b.vy);
    if (spd < 0.001) {
      b.vx = 0.1;
      b.vy = 0.04;
      spd = Math.hypot(b.vx, b.vy);
    }
    const minS = 0.05;
    const maxS = 0.16;
    if (spd < minS || spd > maxS) {
      const next = clamp(spd, minS, maxS) / spd;
      b.vx *= next;
      b.vy *= next;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x - b.r < ox + pad) {
      b.x = ox + pad + b.r;
      b.vx = Math.abs(b.vx);
    } else if (b.x + b.r > ox + boardW - pad) {
      b.x = ox + boardW - pad - b.r;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y - b.r < oy + pad) {
      b.y = oy + pad + b.r;
      b.vy = Math.abs(b.vy);
    } else if (b.y + b.r > oy + boardH - pad) {
      b.y = oy + boardH - pad - b.r;
      b.vy = -Math.abs(b.vy);
    }
  });

  live.forEach((node, n) => {
    const b = node.body;
    const wave = Math.sin(now * b.zf + b.ph);
    b.scale = 0.82 + (wave * 0.5 + 0.5) * 0.4;
    b.r = (Math.round(base * (compact ? 1 : node.scale || 1)) * 0.5 + 38) * b.scale;
  });

  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i].body;
      const b = live[j].body;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist >= minDist) continue;
      if (dist < 0.001) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;
      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const dv = vb - va;
      a.vx += dv * nx;
      a.vy += dv * ny;
      b.vx -= dv * nx;
      b.vy -= dv * ny;
    }
  }

  live.forEach((node, n) => {
    const b = node.body;
    const spd = Math.hypot(b.vx, b.vy);
    if (spd > 0.16) {
      b.vx *= 0.16 / spd;
      b.vy *= 0.16 / spd;
    }
    node.el.style.left = `${b.x}px`;
    node.el.style.top = `${b.y}px`;
    node.el.style.opacity = String(vis);
    node.el.style.pointerEvents = "none";
    node.el.style.zIndex = String(6 + Math.round(b.scale * 12));
    node.el.style.transform = `translate(-50%, -50%) scale(${b.scale})`;
    node.el.style.filter = `brightness(${0.92 + (b.scale - 0.82) * 0.35})`;
    node.screen = { x: b.x, y: b.y, vis, depth: b.scale };
  });
}

function drawFieldLinks() {}

function buildHolos() {
  Object.entries(cards).forEach(([id, card]) => {
    if (fields[id] || !(card.html || card.left)) return;
    const el = document.createElement("article");
    el.className = `holo${id === "resume" ? " holo-resume" : ""}`;
    el.dataset.id = id;
    if (id === "resume") {
      el.innerHTML = `<div class="cv-orbit"><div class="cv-col cv-left"><p class="holo-code">${card.code}</p><h2>${card.title}</h2><p class="holo-meta">${card.meta}</p>${card.left}</div><img class="cv-avatar" src="images/TouXiang.png" alt="郑新义"><div class="cv-col cv-right">${card.right}</div></div>`;
    } else {
      const scroll = `<div class="float-scroll">${card.html}</div><div class="float-rail" aria-hidden="true"><span class="float-fill"></span><i class="float-thumb"></i></div>`;
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
  const prev = phase;
  phase = name;
  body.classList.remove("is-boot", "is-gate", "is-station");
  body.classList.add(name);
  document.getElementById("gate").setAttribute("aria-hidden", name === "is-boot");
  document.getElementById("station").setAttribute("aria-hidden", name === "is-boot");
  if (name === "is-gate" && prev !== "is-gate") {
    title.classList.remove("is-pop");
    void title.offsetWidth;
    title.classList.add("is-pop");
  }
}

function applyProgress(t) {
  const p = t / PATH_MAX;
  const fly = clamp(p / 0.09, 0, 1);
  const punch = fly * fly;
  title.style.transform = `translateZ(${punch * 2200}px) scale(${1 + punch * 6.2}) skewX(${punch * -10}deg)`;
  title.style.letterSpacing = `${-0.05 - punch * 0.06}em`;
  title.style.filter = punch < 0.04 ? "none" : `contrast(${1 + punch * 0.6}) blur(${punch * 1.4}px)`;
  title.style.opacity = String(1 - fly);
  gateUi.forEach((el) => {
    const fade = clamp(1 - p / 0.045, 0, 1);
    el.style.opacity = String(fade);
    el.style.pointerEvents = fade < 0.2 ? "none" : "auto";
  });
  const grain = document.querySelector(".grain");
  if (grain) grain.style.opacity = String(0.12 + Math.min(0.28, cam.vz * 0.09));
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

function stopByKey(key) {
  return NAV_STOPS.find((item) => item.key === key);
}

function parkAt(stop) {
  cam.target = stop.at;
  if (cam.progress > stop.at) cam.progress = stop.at;
  if (cam.vel > 0) cam.vel = 0;
}

function armHoldsForJump(key) {
  const dest = stopByKey(key);
  HOLD_KEYS.forEach((holdKey) => {
    const stop = stopByKey(holdKey);
    const hold = holdState[holdKey];
    if (!stop || !hold) return;
    hold.count = 0;
    hold.armed = !dest || dest.at <= stop.at;
  });
}

function jumpTo(key) {
  const stop = stopByKey(key);
  if (!ready || !stop) return;
  armHoldsForJump(key);
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
  const from = cam.target;
  const to = clamp(from + delta, 0, PATH_MAX);

  if (delta > 0) {
    for (const key of HOLD_KEYS) {
      const stop = stopByKey(key);
      const hold = holdState[key];
      if (!stop || !hold) continue;
      if (from < stop.at && to >= stop.at) {
        hold.count = 0;
        hold.armed = true;
        parkAt(stop);
        return;
      }
    }
  } else {
    HOLD_KEYS.forEach((key) => {
      const stop = stopByKey(key);
      const hold = holdState[key];
      if (!stop || !hold) return;
      hold.count = 0;
      if (to <= stop.at) hold.armed = true;
    });
  }

  cam.target = to;
}

function holdStationWheel(delta) {
  if (delta <= 0) return false;
  for (const key of HOLD_KEYS) {
    const stop = stopByKey(key);
    const hold = holdState[key];
    if (!stop || !hold || !hold.armed || cam.target < stop.at - 0.05) continue;
    if (cam.target > stop.at + 0.2) continue;
    hold.count += 1;
    if (hold.count < HOLD_TICKS) {
      parkAt(stop);
      return true;
    }
    hold.armed = false;
    hold.count = 0;
    return false;
  }
  return false;
}

let peekFrom = null;
let peekBusy = false;
let peekSeq = 0;
const PEEK_EASE = "0.48s cubic-bezier(0.22, 1, 0.36, 1)";

function peekEls() {
  return {
    peek: document.getElementById("peek"),
    frame: document.querySelector(".peek-frame"),
    img: document.getElementById("peek-img"),
    cap: document.getElementById("peek-cap"),
  };
}

function originRect(el) {
  const thumb = el?.querySelector("img");
  if (!thumb) return null;
  const r = thumb.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return r;
}

function peekTarget(img) {
  const nw = img.naturalWidth || 1600;
  const nh = img.naturalHeight || 1000;
  const maxW = innerWidth * 0.9;
  const maxH = innerHeight * 0.82;
  const s = Math.min(maxW / nw, maxH / nh);
  const w = nw * s;
  const h = nh * s;
  return {
    left: (innerWidth - w) / 2,
    top: (innerHeight - h) / 2,
    width: w,
    height: h,
  };
}

function placePeekFrame(frame, rect, animate) {
  frame.style.transition = animate
    ? `left ${PEEK_EASE}, top ${PEEK_EASE}, width ${PEEK_EASE}, height ${PEEK_EASE}`
    : "none";
  frame.style.left = `${rect.left}px`;
  frame.style.top = `${rect.top}px`;
  frame.style.width = `${rect.width}px`;
  frame.style.height = `${rect.height}px`;
  frame.style.transform = "none";
}

function resetPeekFrame(frame, img) {
  frame.style.transition = "none";
  frame.style.left = "0px";
  frame.style.top = "0px";
  frame.style.width = "0px";
  frame.style.height = "0px";
  frame.style.transform = "none";
  img.src = "";
}

function openPeek(src, caption, originEl) {
  if (body.classList.contains("is-peek")) return;
  const from = originRect(originEl);
  if (!from) return;
  const { peek, frame, img, cap } = peekEls();
  const seq = ++peekSeq;
  peekBusy = true;
  peekFrom = originEl;
  document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
  originEl.classList.add("is-zooming");
  cap.textContent = caption || "";
  cap.style.opacity = "0";
  img.alt = caption || "作品";
  img.src = src;
  body.classList.add("is-peek");
  const run = () => {
    if (seq !== peekSeq) return;
    placePeekFrame(frame, from, false);
    peek.hidden = false;
    peek.classList.add("is-open", "is-on");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (seq !== peekSeq) return;
        placePeekFrame(frame, peekTarget(img), true);
        window.setTimeout(() => {
          if (seq !== peekSeq) return;
          cap.style.opacity = "1";
          peekBusy = false;
        }, 480);
      });
    });
  };
  if (img.complete && img.naturalWidth) run();
  else img.addEventListener("load", run, { once: true });
}

function closePeek() {
  if (!body.classList.contains("is-peek")) return;
  const { peek, frame, img, cap } = peekEls();
  const seq = ++peekSeq;
  const back = originRect(peekFrom);
  peekBusy = true;
  cap.style.opacity = "0";
  peek.classList.remove("is-on");
  const finish = () => {
    if (seq !== peekSeq) return;
    peek.classList.remove("is-open", "is-on");
    peek.hidden = true;
    body.classList.remove("is-peek");
    document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
    peekFrom = null;
    peekBusy = false;
    resetPeekFrame(frame, img);
  };
  if (back) {
    placePeekFrame(frame, back, true);
    window.setTimeout(finish, 500);
  } else {
    window.setTimeout(finish, 80);
  }
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

function loop(now) {
  cam.lookX += (cam.mx - cam.lookX) * 0.05;
  cam.lookY += (cam.my - cam.lookY) * 0.05;
  const prev = cam.progress;
  cam.vel += (cam.target - cam.progress) * 0.09;
  cam.vel *= 0.78;
  cam.progress += cam.vel;
  cam.progress = clamp(cam.progress, 0, PATH_MAX);
  cam.vz = Math.abs(cam.progress - prev) * PATH_MAX;
  tickDust(now || performance.now());
  applyProgress(cam.progress);
  drawWorld();
  drawFloaters();
  requestAnimationFrame(loop);
}

resize();
spawnDust();
buildHolos();
buildFields();
layoutBeacons();
tickClock();
setInterval(tickClock, 1000);
title.addEventListener("animationend", (event) => {
  if (event.animationName === "title-pop") title.classList.remove("is-pop");
});
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
    if (holdStationWheel(step)) return;
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
