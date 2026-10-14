import { cam, runtime } from "./state.js";
import { beaconWorld, fields, holoVisibility, stopByKey } from "./data.js?v=packs";
import { clamp, hash01, isVideoSrc, mediaURL, screenFit } from "./util.js";
import { openPeek } from "./peek.js";

const station = document.getElementById("station");
const fieldNodes = [];
const primed = new Set();

function clipPool() {
  let pool = document.getElementById("clip-pool");
  if (pool) return pool;
  pool = document.createElement("div");
  pool.id = "clip-pool";
  pool.setAttribute("aria-hidden", "true");
  document.body.appendChild(pool);
  return pool;
}

function primeVideo(url) {
  if (!url || primed.has(url)) return;
  primed.add(url);
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.href = url;
  document.head.appendChild(link);
}

function warmClip(clip, url) {
  clip.preload = "auto";
  clip.muted = true;
  clip.loop = true;
  clip.playsInline = true;
  clip.setAttribute("playsinline", "");
  clip.setAttribute("preload", "auto");
  clip.src = url;
  const pool = clipPool();
  pool.appendChild(clip);
  clip.load();
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
      el.className = `dot ${group === "software" ? "dot-soft" : "dot-work"}`;
      el.dataset.group = group;
      const size = 0.7 + hash01(i * 9.1 + g) * 0.9;
      el.style.setProperty("--dot", `${8 + size * 8}px`);
      el.style.setProperty("--plate", `${96 + size * 54}px`);
      el.style.setProperty("--plate-h", `${60 + size * 32}px`);
      const videoSrc = item.video || (isVideoSrc(item.img) ? item.img : "");
      const poster = item.poster || (!videoSrc && item.img ? item.img : "");
      const src = mediaURL(videoSrc || poster || "");
      if (src) el.classList.add("has-img");
      if (videoSrc) el.classList.add("has-video");
      if (poster && !videoSrc) {
        el.innerHTML = `<img src="${mediaURL(poster)}" alt="${item.name || "作品"}">${item.name ? `<span>${item.name}</span>` : ""}`;
      } else if (videoSrc) {
        const clip = document.createElement("video");
        clip.muted = true;
        clip.loop = true;
        clip.playsInline = true;
        if (poster) clip.poster = mediaURL(poster);
        if (item.name) {
          const label = document.createElement("span");
          label.textContent = item.name;
          el.appendChild(label);
        }
        primeVideo(src);
        warmClip(clip, src);
        el.insertBefore(clip, el.firstChild);
        el.addEventListener("pointerenter", () => {
          if (clip.parentElement !== el) return;
          clip.play().catch(() => {});
        });
        el.addEventListener("pointerleave", () => {
          if (clip.parentElement !== el) return;
          clip.pause();
          clip.currentTime = 0;
        });
      } else {
        el.innerHTML = `<i></i>${item.name ? `<span>${item.name}</span>` : ""}`;
      }
      if (src && group !== "software") {
        el.addEventListener("click", () => openPeek(src, item.name, el, Boolean(videoSrc)));
      }
      station.appendChild(el);
      fieldNodes.push({
        el, group, x: pos[0], y: pos[1], z: pos[2], size,
        at: item.at, scale: item.s || 1, pack: item.pack || "",
      });
    });
  });
}

function layoutFields() {
  const now = performance.now() / 1000;
  const navW = innerWidth >= 720 ? 220 : 12;
  const areaW = innerWidth - navW - 40;
  const areaH = innerHeight - 110;
  ["software", "works", "tools"].forEach((group) => {
    const vis = runtime.phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
    const nodes = fieldNodes.filter((node) => node.group === group);
    if (group === "software") layoutSoftware(nodes, vis, now, navW, areaW, areaH);
    else layoutWall(group, nodes, vis, navW, areaW, areaH);
  });
}

const PACK_LABEL = {
  scene: "场景原画",
  war: "战场",
  bug: "蚂蚱",
  qf: "QF",
  slg: "SLG",
};

function packLabelEl() {
  let el = document.getElementById("pack-label");
  if (el) return el;
  el = document.createElement("p");
  el.id = "pack-label";
  el.className = "pack-label";
  station.appendChild(el);
  return el;
}

function splitPages(nodes, perPage) {
  const bags = [];
  nodes.forEach((node) => {
    const id = node.pack || "_";
    let bag = bags.find((item) => item.id === id);
    if (!bag) {
      bag = { id, label: PACK_LABEL[id] || "", nodes: [] };
      bags.push(bag);
    }
    bag.nodes.push(node);
  });
  const pages = [];
  bags.forEach((bag) => {
    for (let i = 0; i < bag.nodes.length; i += perPage) {
      pages.push({
        id: bag.id,
        label: bag.label,
        nodes: bag.nodes.slice(i, i + perPage),
      });
    }
  });
  return pages.length ? pages : [{ id: "_", label: "", nodes }];
}

function paintCard(node, x, y, cellW, cellH, fade, scale, yaw) {
  const pw = Math.round(cellW);
  const ph = Math.round(cellH);
  node.el.style.setProperty("--plate", `${pw}px`);
  node.el.style.setProperty("--plate-h", `${ph}px`);
  node.el.style.width = `${pw}px`;
  const media = node.el.querySelector("img, video, .peek-hole");
  if (media) {
    media.style.width = `${pw}px`;
    media.style.height = `${ph}px`;
    media.style.maxWidth = `${pw}px`;
    media.style.maxHeight = `${ph}px`;
  }
  node.el.style.left = `${x}px`;
  node.el.style.top = `${y}px`;
  node.el.style.opacity = String(fade);
  node.el.style.pointerEvents = fade > 0.28 ? "auto" : "none";
  node.el.style.zIndex = String(8 + Math.round(scale * 12));
  node.el.style.transform = `translate(-50%, -50%) rotateY(${yaw}deg) scale(${scale})`;
  node.screen = { x, y, vis: fade, depth: scale };
}

function placePage(page, cx, cy, cellW, cellH, gap, cols, fade, shiftX, lookX) {
  const n = page.nodes.length;
  if (!n || fade < 0.04) {
    page.nodes.forEach((node) => {
      node.el.style.opacity = "0";
      node.el.style.pointerEvents = "none";
      node.screen = null;
    });
    return;
  }
  const colsUsed = Math.max(1, Math.min(cols, n));
  const rowsUsed = Math.ceil(n / colsUsed);
  const pageW = colsUsed * cellW + (colsUsed - 1) * gap;
  const pageH = rowsUsed * (cellH + 22) + (rowsUsed - 1) * gap;
  const ox = cx - pageW / 2 + shiftX + lookX * 12;
  const oy = cy - pageH / 2;
  const scale = 0.92 + fade * 0.08;
  page.nodes.forEach((node, i) => {
    const col = i % colsUsed;
    const row = Math.floor(i / colsUsed);
    const x = ox + col * (cellW + gap) + cellW / 2;
    const y = oy + row * (cellH + gap + 22) + cellH / 2;
    paintCard(node, x, y, cellW, cellH, fade, scale, lookX * -6);
  });
}

function layoutWall(group, nodes, vis, navW, areaW, areaH) {
  if (!nodes.length) return;
  const useLabel = group === "works";
  const label = useLabel ? packLabelEl() : null;
  const padL = navW + 48;
  const padR = 56;
  const viewW = Math.max(280, innerWidth - padL - padR);
  const viewH = Math.max(220, areaH - 8);
  const gap = viewW < 700 ? 14 : 24;
  const cols = viewW < 640 ? 2 : viewW < 1180 ? 3 : 4;
  const rows = 2;
  let cellW = (viewW - gap * (cols - 1)) / cols;
  let cellH = cellW / 1.58;
  const maxH = (viewH - 52 - gap) / rows;
  if (cellH > maxH) {
    cellH = maxH;
    cellW = cellH * 1.58;
  }
  const perPage = cols * rows;
  const pages = splitPages(nodes, perPage);
  const stop = stopByKey(group);
  const start = stop.at;
  const end = stop.until || start + 3;
  const u = clamp((cam.progress - start) / Math.max(0.001, end - start), 0, 1);
  const nPages = pages.length;
  const f = nPages <= 1 ? 0 : u * (nPages - 1);
  const index = Math.min(nPages - 1, Math.floor(f + 1e-4));
  const mix = nPages <= 1 ? 0 : clamp(f - index, 0, 1);
  const ease = mix * mix * (3 - 2 * mix);
  const cx = padL + viewW / 2;
  const cy = innerHeight * 0.52;
  const shown = new Set();

  if (vis < 0.08) {
    nodes.forEach((node) => {
      node.el.style.opacity = "0";
      node.el.style.pointerEvents = "none";
      node.screen = null;
    });
    if (label) label.style.opacity = "0";
    return;
  }

  const cur = pages[index];
  const next = pages[index + 1];
  placePage(cur, cx, cy, cellW, cellH, gap, cols, vis * (1 - ease), -ease * 56, cam.lookX);
  cur.nodes.forEach((node) => shown.add(node));
  if (next) {
    placePage(next, cx, cy, cellW, cellH, gap, cols, vis * ease, (1 - ease) * 56, cam.lookX);
    next.nodes.forEach((node) => shown.add(node));
  }
  nodes.forEach((node) => {
    if (shown.has(node)) return;
    node.el.style.opacity = "0";
    node.el.style.pointerEvents = "none";
    node.screen = null;
  });

  if (label) {
    const title = (ease > 0.55 && next ? next.label : cur.label) || "";
    label.textContent = title;
    label.style.left = `${padL}px`;
    label.style.width = `${viewW}px`;
    label.style.opacity = title && vis > 0.35 ? String(vis) : "0";
  }
}

let softClock = 0;

function layoutSoftware(nodes, vis, now, navW, areaW, areaH) {
  const compact = areaW < 640;
  const boardW = areaW * (compact ? 0.94 : 0.88);
  const boardH = areaH * (compact ? 0.82 : 0.78);
  const ox = navW + 20 + (areaW - boardW) * 0.5;
  const oy = (innerHeight - boardH) * 0.48;
  const cell = Math.min(boardW / 4.15, boardH / 2.3);
  const dens = screenFit().density;
  const boost = compact
    ? 1.6
    : 1.6 + (1.3 - 1.6) * clamp((dens - 0.55) / 0.8, 0, 1);
  const base = compact
    ? clamp(cell * 0.78 * boost, 72, 230)
    : clamp(cell * 0.56 * boost, 110, 560);
  const boardKey = `${Math.round(boardW)}:${Math.round(boardH)}:${Math.round(base)}`;
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
    node.el.style.setProperty("--soft-label", `${clamp(size * 0.09, 10, 22)}px`);
    const rad = size * 0.5 + size * 0.18;
    const slot = compact ? compactAt[n] : (node.at || [0.5, 0.5]);
    if (!node.body || node.boardKey !== boardKey) {
      node.boardKey = boardKey;
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
    b.r = (Math.round(base * (compact ? 1 : node.scale || 1)) * 0.68) * b.scale;
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
