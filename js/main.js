const body = document.body;
const pct = document.getElementById("pct");
const clock = document.getElementById("clock");
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const dossier = document.getElementById("dossier");
const beacons = [...document.querySelectorAll(".beacon")];

const cards = {
  w1: {
    code: "XY-01",
    title: "XYStation 本站",
    meta: "静态站点 / Gitee Pages · 到站",
    html: `<p>这个网站本身是第一件作品：纯 HTML / CSS / JS，不依赖打包，方便挂到 Gitee Pages。</p><p>仓库：<a href="https://gitee.com/GodTalk/xystation" target="_blank" rel="noopener">gitee.com/GodTalk/xystation</a></p>`,
  },
  w2: {
    code: "XY-02",
    title: "项目名称待填",
    meta: "小工具 / 游戏 / 课程作业 · 待发车",
    html: `<p>把这里换成你做过的项目：名字、技术栈、一句话介绍，以及仓库或演示链接。</p>`,
  },
  w3: {
    code: "XY-03",
    title: "实验进行中",
    meta: "学习记录 / 原型 · 待发车",
    html: `<p>适合放还没做完、但想展示思路的东西。完成后再把状态改成到站。</p>`,
  },
  about: {
    code: "ABOUT",
    title: "关于这站",
    meta: "GodTalk · 个人作品站",
    html: `<p>你好，我是 GodTalk。XYStation 用来集中展示作品，而不是一份很长的简历。</p><p>技能：HTML / CSS / JavaScript · Git / Gitee。把真实经历补进这里即可。</p>`,
  },
  contact: {
    code: "CONTACT",
    title: "联络",
    meta: "公开联系方式",
    html: `<p><a href="https://gitee.com/GodTalk" target="_blank" rel="noopener">Gitee · GodTalk</a></p><p><a href="mailto:zxy0816508@163.com">zxy0816508@163.com</a></p>`,
  },
};

const title = document.querySelector(".fly-title");
const gateUi = [...document.querySelectorAll(".gate-ui")];

const PATH_MAX = 24;
const WHEEL_STEP = 0.45;
const TOUCH_SCALE = 0.05;
const KEY_STEP = 0.8;
const ENTER_STEP = 8;
const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 入口" },
  { key: "w1", at: 8, label: "01 本站" },
  { key: "w2", at: 12, label: "02 待发" },
  { key: "w3", at: 16, label: "03 实验" },
  { key: "about", at: 20, label: "AB 关于" },
  { key: "contact", at: 23.2, label: "CT 联络" },
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
  w1: [-4, 0.6, 2.2],
  w2: [2.2, 1.8, 6.4],
  w3: [6.4, 1.2, 13],
  about: [-7.5, 3.2, 18],
  contact: [8.2, 3.6, 8.5],
};

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
  for (let i = 0; i < 220; i += 1) {
    dust.push({
      x: (Math.random() - 0.5) * 46,
      y: (Math.random() - 0.5) * 22,
      z: (Math.random() - 0.35) * 52,
    });
  }
  for (let i = 0; i < 28; i += 1) {
    motes.push({
      x: (Math.random() - 0.5) * 28,
      y: (Math.random() - 0.45) * 14,
      z: (Math.random() - 0.2) * 36,
      r: 0.18 + Math.random() * 0.35,
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
  const lx = cam.lookX * 0.32;
  const ly = cam.lookY * 0.22;
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
    ctx.globalAlpha = Math.min(0.5, 90 / a.depth);
    ctx.beginPath();
    ctx.arc(a.x, a.y, Math.max(0.4, a.s * 0.012), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function layoutBeacons() {
  beacons.forEach((el) => {
    const pos = beaconWorld[el.dataset.id];
    if (!pos) return;
    const p = project(pos[0], pos[1], pos[2]);
    if (!p || p.depth < 20 || p.depth > 1400) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    const visible = Math.max(0, 1 - Math.abs(p.depth - 280) / 900);
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.style.opacity = String(visible * 0.95);
    el.style.pointerEvents = visible > 0.22 ? "auto" : "none";
    const scale = clamp(p.s * 0.045, 0.45, 1.35);
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
  });
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
  if (phase === "is-station") {
    if (t < 5.5) setPhase("is-gate");
  } else if (t >= 7) setPhase("is-station");
  else setPhase("is-gate");
}

function stopAt(t) {
  let current = NAV_STOPS[0];
  for (const stop of NAV_STOPS) {
    if (t >= stop.at) current = stop;
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
  if (dossier.hidden) setActiveNav(current.key);
}

function nudge(delta) {
  if (!ready || !dossier.hidden) return;
  cam.target = clamp(cam.target + delta, 0, PATH_MAX);
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

function openCard(id) {
  const card = cards[id];
  if (!card) return;
  document.getElementById("d-code").textContent = card.code;
  document.getElementById("d-title").textContent = card.title;
  document.getElementById("d-meta").textContent = card.meta;
  document.getElementById("d-body").innerHTML = card.html;
  dossier.hidden = false;
  setActiveNav(id);
}

function closeCard() {
  dossier.hidden = true;
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
  el.addEventListener("click", () => openCard(el.dataset.id));
});
document.querySelectorAll(".rail-item[data-id]").forEach((el) => {
  el.addEventListener("click", () => {
    jumpTo(el.dataset.id);
    openCard(el.dataset.id);
  });
});
document.querySelectorAll("[data-go='gate']").forEach((el) => {
  el.addEventListener("click", () => {
    closeCard();
    jumpTo("gate");
  });
});
document.getElementById("close").addEventListener("click", closeCard);
setActiveNav(null);

window.addEventListener(
  "wheel",
  (event) => {
    if (!dossier.hidden) return;
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
    event.preventDefault();
    const y = event.touches[0].clientY;
    nudge((lastTouchY - y) * TOUCH_SCALE);
    lastTouchY = y;
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Enter") nudge(KEY_STEP);
  if (event.key === "ArrowDown" || event.key === "PageDown") nudge(-KEY_STEP);
  if (event.key === "Escape") closeCard();
});
