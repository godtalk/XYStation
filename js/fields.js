import { cam, runtime } from "./state.js";
import { beaconWorld, fields, holoVisibility, stopByKey } from "./data.js";
import { clamp, hash01 } from "./util.js";
import { openPeek } from "./peek.js";

const station = document.getElementById("station");
const fieldNodes = [];

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
    const vis = runtime.phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
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

export { buildFields, layoutFields };
