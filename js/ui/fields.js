import { cam, runtime } from "state";
import { beaconWorld, holoVisibility, stopAt, stopByKey } from "path";
import { fields } from "catalog";
import { clamp, hash01, hashNoise, isVideoSrc, mediaURL, thumbURL } from "util";
import { openPeek } from "peek";

const station = document.getElementById("station");
const fieldNodes = [];
const nodesByGroup = {};
let videosOpen = false;

function clipPool() {
  let pool = document.getElementById("clip-pool");
  if (pool) return pool;
  pool = document.createElement("div");
  pool.id = "clip-pool";
  pool.setAttribute("aria-hidden", "true");
  document.body.appendChild(pool);
  return pool;
}

function bufferPct(clip) {
  const duration = clip.duration;
  if (duration && Number.isFinite(duration) && clip.buffered.length) {
    let end = 0;
    for (let i = 0; i < clip.buffered.length; i += 1) end = Math.max(end, clip.buffered.end(i));
    return Math.min(100, Math.round((end / duration) * 100));
  }
  return clip.readyState >= 4 ? 100 : 0;
}

function markFrame(node, clip) {
  const framed = clip.readyState >= 2;
  if (!framed) return;
  node.el.classList.add("is-frame", "is-ready");
  node.el.classList.remove("is-pending");
}

function showFrame(clip) {
  if (!clip || clip.dataset.framed) return;
  if (clip.dataset.src && !clip.getAttribute("src")) {
    clip.preload = "metadata";
    clip.src = clip.dataset.src;
    clip.load();
  }
  const paint = () => {
    if (clip.currentTime < 0.05) {
      try { clip.currentTime = 0.12; } catch { /* not seekable yet */ }
    }
    clip.dataset.framed = "1";
  };
  if (clip.readyState >= 2) paint();
  else clip.addEventListener("loadeddata", paint, { once: true });
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
  Object.keys(nodesByGroup).forEach((key) => {
    nodesByGroup[key] = [];
  });
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
      const strip = group === "works" || group === "blender" || group === "unity" || group === "tools";
      const videoSrc = item.video || (isVideoSrc(item.img) ? item.img : "");
      const still = item.poster || item.img || "";
      const poster = still && !isVideoSrc(still) ? still : "";
      const src = mediaURL(videoSrc || poster || "");
      const thumb = poster && group !== "software" ? thumbURL(poster) : "";
      if (src) el.classList.add("has-img");
      if (item.sheet) el.classList.add("is-sheet");
      if (videoSrc) el.classList.add("has-video");
      if (group === "software" && poster) {
        const img = document.createElement("img");
        img.alt = item.name || "";
        img.decoding = "async";
        img.src = mediaURL(poster);
        el.appendChild(img);
        if (item.name) {
          const label = document.createElement("span");
          label.textContent = item.name;
          el.appendChild(label);
        }
      } else if (poster && !videoSrc) {
        el.classList.add("is-pending");
        const img = document.createElement("img");
        img.alt = item.name || "作品";
        img.decoding = "async";
        img.loading = "lazy";
        el.appendChild(img);
        if (item.name) {
          const label = document.createElement("span");
          label.textContent = item.name;
          el.appendChild(label);
        }
      } else if (videoSrc) {
        el.classList.add("is-pending");
        const clip = document.createElement("video");
        clip.muted = true;
        clip.loop = true;
        clip.playsInline = true;
        if (thumb) clip.poster = thumb;
        if (item.name) {
          const label = document.createElement("span");
          label.textContent = item.name;
          el.appendChild(label);
        }
        clip.preload = "none";
        clip.dataset.src = src;
        el.insertBefore(clip, el.firstChild);
        el.addEventListener("pointerenter", () => {
          if (!el.contains(clip)) return;
          if (clip.dataset.src && !clip.getAttribute("src")) {
            clip.preload = "metadata";
            clip.src = clip.dataset.src;
            clip.load();
          }
          clip.play().catch(() => {});
        });
        el.addEventListener("pointerleave", () => {
          if (!el.contains(clip)) return;
          clip.pause();
        });
      } else {
        el.innerHTML = `<i></i>${item.name ? `<span>${item.name}</span>` : ""}`;
      }
      if (strip) stripFrame(group).strip.appendChild(el);
      else station.appendChild(el);
      const node = {
        el, group, x: pos[0], y: pos[1], z: pos[2], size,
        at: item.at, scale: item.s || 1, pack: item.pack || "",
        src, isVideo: Boolean(videoSrc), name: item.name || "",
        thumb,
        loaded: false,
        queued: false,
      };
      if (src && group !== "software") {
        el.addEventListener("click", () => openPeek(src, item.name, el, Boolean(videoSrc)));
      }
      fieldNodes.push(node);
      if (!nodesByGroup[group]) nodesByGroup[group] = [];
      nodesByGroup[group].push(node);
    });
  });
}

function layoutFields() {
  const now = performance.now() / 1000;
  const navW = innerWidth >= 720 ? 220 : 12;
  const areaW = innerWidth - navW - 40;
  const areaH = innerHeight - 110;
  const lead = leadStrip();
  ["software", "works", "blender", "unity", "tools"].forEach((group) => {
    let vis = runtime.phase === "is-station" ? holoVisibility(group, cam.progress) : 0;
    if (STRIPS[group] && group !== lead) vis = 0;
    const nodes = nodesByGroup[group] || [];
    if (group === "software") layoutSoftware(nodes, vis, now, navW, areaW, areaH);
    else if (STRIPS[group]) layoutStrip(group, nodes, vis, navW, areaW, areaH);
    else layoutWall(group, nodes, vis, navW, areaW, areaH);
  });
}

const PACK_LABEL = {
  scene: "场景原画",
  war: "战场",
  bug: "蚂蚱",
  qf: "QF",
  slg: "SLG",
  tank: "载具",
  clip: "效果视频",
  blender: "Blender 效果",
  unity: "Unity 效果",
  tool: "工具",
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

const STRIPS = {
  works: { rows: 3, visible: 8, aspect: 1 },
  blender: { rows: 2, visible: 2, aspect: 16 / 9 },
  unity: { rows: 2, visible: 2, aspect: 16 / 9 },
  tools: { rows: 1, visible: 2, aspect: 16 / 9 },
};
const WALL_DAMP = 0.95;
const WALL_REST = 0.12;
const WALL_VEL_MAX = 56;
const THUMB = 360;
const LOAD_N = 3;

function makeWall() {
  return {
    px: 0,
    vel: 0,
    maxPx: 0,
    step: 1,
    colsTotal: 1,
    held: false,
    lastTick: 0,
    lastInput: 0,
    layoutKey: "",
    boxKey: "",
    visKey: -1,
    tx: null,
    seen: -1,
    nodes: [],
  };
}

const walls = {
  works: makeWall(),
  blender: makeWall(),
  unity: makeWall(),
  tools: makeWall(),
};

const thumbCache = new Map();
const loadQ = [];
let loadBusy = 0;

function stripFrame(group) {
  const id = `${group}-clip`;
  let clip = document.getElementById(id);
  if (!clip) {
    clip = document.createElement("div");
    clip.id = id;
    clip.className = "works-clip";
    station.appendChild(clip);
  }
  let strip = clip.querySelector(".works-strip");
  if (!strip) {
    strip = document.createElement("div");
    strip.className = "works-strip";
    clip.appendChild(strip);
  }
  return { clip, strip };
}

async function bakeThumb(url) {
  const hit = thumbCache.get(url);
  if (hit) return hit;
  const work = (async () => {
    try {
      const blob = await fetch(url).then((res) => {
        if (!res.ok) throw new Error("thumb");
        return res.blob();
      });
      const bmp = await createImageBitmap(blob);
      const c = document.createElement("canvas");
      c.width = THUMB;
      c.height = THUMB;
      const g = c.getContext("2d");
      const s = Math.max(THUMB / bmp.width, THUMB / bmp.height);
      g.drawImage(
        bmp,
        (THUMB - bmp.width * s) / 2,
        (THUMB - bmp.height * s) / 2,
        bmp.width * s,
        bmp.height * s,
      );
      bmp.close();
      return c.toDataURL("image/jpeg", 0.8);
    } catch {
      return url;
    }
  })();
  thumbCache.set(url, work);
  return work;
}

function pumpLoad() {
  while (loadBusy < LOAD_N && loadQ.length) {
    const node = loadQ.shift();
    loadBusy += 1;
    const img = node.el.querySelector("img");
    const url = node.thumb;
    if (!img || !url) {
      node.loaded = true;
      node.el.classList.remove("is-pending");
      loadBusy -= 1;
      continue;
    }
    const done = () => {
      node.loaded = true;
      node.el.classList.add("is-ready");
      node.el.classList.remove("is-pending");
      loadBusy -= 1;
      pumpLoad();
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    img.src = url;
  }
}

function enqueueLoad(node, urgent) {
  if (!node || node.loaded || node.queued || !node.thumb) return;
  node.queued = true;
  if (urgent) loadQ.unshift(node);
  else loadQ.push(node);
  pumpLoad();
}

function attachVideo(node) {
  const clip = node.el.querySelector("video");
  if (!clip || clip.getAttribute("src") || !clip.dataset.src) return;
  videosOpen = true;
  clip.preload = "metadata";
  clip.src = clip.dataset.src;
  clip.addEventListener("loadeddata", () => {
    markFrame(node, clip);
    showFrame(clip);
  }, { once: true });
  clip.addEventListener("error", () => {
    node.el.classList.remove("is-pending");
  }, { once: true });
  showFrame(clip);
}

function revealWall(wall, visible) {
  const col = wall.px / Math.max(1, wall.step);
  const start = Math.max(0, Math.floor(col) - 1);
  const end = Math.min(wall.colsTotal, Math.ceil(col + visible + 1));
  if (wall.seen === start && loadBusy) return;
  wall.seen = start;
  wall.nodes.forEach((node, i) => {
    const c = i % wall.colsTotal;
    if (c < start || c >= end) return;
    if (node.isVideo) attachVideo(node);
    else enqueueLoad(node, c < start + visible);
  });
}

function tickWall(wall, now) {
  const dt = wall.lastTick ? Math.min(0.033, (now - wall.lastTick) / 1000) : 0.016;
  wall.lastTick = now;
  const frames = dt * 60;
  wall.px += wall.vel;
  wall.vel *= WALL_DAMP ** frames;
  if (wall.px <= 0 && wall.vel < 0) {
    wall.px = 0;
    wall.vel = 0;
  }
  if (wall.px >= wall.maxPx && wall.vel > 0) {
    wall.px = wall.maxPx;
    wall.vel = 0;
  }
  if (Math.abs(wall.vel) < WALL_REST) wall.vel = 0;
  wall.px = clamp(wall.px, 0, wall.maxPx);
}

function leadStrip() {
  if (runtime.phase !== "is-station") return null;
  const key = stopAt(cam.progress).key;
  return STRIPS[key] ? key : null;
}

function openStrip() {
  if (runtime.phase !== "is-station" || document.body.classList.contains("is-peek")) return null;
  const group = leadStrip();
  if (!group || holoVisibility(group, cam.progress) < 0.5) return null;
  return walls[group];
}

let stripArm = 0;

function stripArmed() {
  if (!stripArm) return false;
  if (performance.now() - stripArm < 640) return true;
  stripArm = 0;
  return false;
}

function wallEdge(wall, dir) {
  if (!wall || !dir) return "";
  const atStart = wall.px <= 0.8 && wall.vel >= -0.2 && dir < 0;
  const atEnd = wall.px >= wall.maxPx - 0.8 && wall.vel <= 0.2 && dir > 0;
  if (!atStart && !atEnd) return "";
  wall.held = false;
  wall.vel = 0;
  stripArm = performance.now();
  return dir > 0 ? "next" : "prev";
}

export function spinWorks(dy) {
  if (stripArmed()) return true;
  const wall = openStrip();
  if (!dy || !wall) return false;
  const edge = wallEdge(wall, dy);
  if (edge) return edge;
  wall.held = true;
  wall.lastInput = performance.now();
  wall.vel = clamp(wall.vel + dy * 0.45, -WALL_VEL_MAX, WALL_VEL_MAX);
  cam.vel = 0;
  return true;
}

export function dragWorks(px) {
  if (stripArmed()) return true;
  const wall = openStrip();
  if (!px || !wall) return false;
  const edge = wallEdge(wall, px);
  if (edge) return edge;
  wall.held = true;
  wall.lastInput = performance.now();
  wall.px = clamp(wall.px + px, 0, wall.maxPx);
  wall.vel = clamp(px, -WALL_VEL_MAX, WALL_VEL_MAX);
  cam.vel = 0;
  return true;
}

function layoutStrip(group, nodes, vis, navW, areaW, areaH) {
  const spec = STRIPS[group];
  const wall = walls[group];
  const { clip, strip } = stripFrame(group);
  if (!nodes.length) {
    clip.style.opacity = "0";
    return;
  }
  wall.nodes = nodes;
  const open = vis >= 0.5;
  if (open && !wall.open) {
    wall.px = 0;
    wall.vel = 0;
    wall.held = false;
  }
  wall.open = open;
  const padL = navW + 36;
  const viewW = Math.max(280, innerWidth - padL - 40);
  const viewH = Math.max(220, areaH - 8);
  const gap = Math.max(6, Math.min(12, Math.round(viewW * 0.007)));
  let cellW = (viewW - gap * (spec.visible - 1)) / spec.visible;
  let cellH = cellW / spec.aspect;
  const maxH = (viewH - 28 - gap * (spec.rows - 1)) / spec.rows;
  if (cellH > maxH) {
    cellH = maxH;
    cellW = cellH * spec.aspect;
  }
  cellW = Math.max(44, cellW);
  cellH = cellW / spec.aspect;
  const colsTotal = Math.max(spec.visible, Math.ceil(nodes.length / spec.rows));
  const stepX = cellW + gap;
  const stepY = cellH + gap;
  wall.step = stepX;
  wall.colsTotal = colsTotal;
  wall.maxPx = Math.max(0, (colsTotal - spec.visible) * stepX);
  const boxW = Math.round(spec.visible * cellW + (spec.visible - 1) * gap);
  const boxH = Math.round(spec.rows * cellH + (spec.rows - 1) * gap);
  const cx = padL + viewW / 2;
  const cy = innerHeight * 0.52;
  const boxKey = `${Math.round(cx)}:${Math.round(cy)}:${boxW}:${boxH}`;
  if (wall.boxKey !== boxKey) {
    wall.boxKey = boxKey;
    clip.style.left = `${Math.round(cx - boxW / 2)}px`;
    clip.style.top = `${Math.round(cy - boxH / 2)}px`;
    clip.style.width = `${boxW}px`;
    clip.style.height = `${boxH}px`;
  }

  if (vis < 0.08) {
    wall.held = false;
    if (wall.visKey !== 0) {
      wall.visKey = 0;
      clip.style.opacity = "0";
      clip.style.pointerEvents = "none";
      clip.style.visibility = "hidden";
      clip.style.zIndex = "0";
      clip.setAttribute("aria-hidden", "true");
      nodes.forEach((node) => {
        node.el.style.pointerEvents = "none";
        const clipEl = node.el.querySelector("video");
        if (clipEl) clipEl.pause();
      });
    }
    return;
  }

  tickWall(wall, performance.now());
  if (vis < 0.5) wall.held = false;
  if (wall.held) cam.vel = 0;

  const on = vis > 0.28;
  if (wall.visKey !== vis) {
    wall.visKey = vis;
    clip.style.opacity = String(vis);
    clip.style.pointerEvents = "none";
    clip.style.visibility = "visible";
    clip.style.zIndex = "8";
    clip.setAttribute("aria-hidden", on ? "false" : "true");
    nodes.forEach((node) => {
      node.el.style.pointerEvents = on ? "auto" : "none";
    });
  }

  const cellWpx = `${Math.round(cellW)}px`;
  const cellHpx = `${Math.round(cellH)}px`;
  const layoutKey = `${cellWpx}:${cellHpx}:${nodes.length}`;
  if (wall.layoutKey !== layoutKey) {
    wall.layoutKey = layoutKey;
    wall.seen = -1;
    nodes.forEach((node, i) => {
      const row = Math.floor(i / colsTotal);
      const col = i % colsTotal;
      node.el.classList.remove("is-flow", "is-center");
      node.el.classList.add("is-wall");
      node.el.style.setProperty("--plate", cellWpx);
      node.el.style.setProperty("--plate-h", cellHpx);
      node.el.style.width = cellWpx;
      node.el.style.height = cellHpx;
      node.el.style.left = `${Math.round(col * stepX)}px`;
      node.el.style.top = `${Math.round(row * stepY)}px`;
      node.el.style.transform = "none";
      node.el.style.opacity = "1";
      node.el.style.pointerEvents = on ? "auto" : "none";
      node.el.style.zIndex = "8";
      if (node.el.parentElement !== strip) strip.appendChild(node.el);
    });
    strip.style.width = `${Math.round(colsTotal * cellW + (colsTotal - 1) * gap)}px`;
    strip.style.height = `${boxH}px`;
  }

  const tx = -wall.px;
  if (wall.tx !== tx) {
    wall.tx = tx;
    strip.style.transform = `translate3d(${tx}px,0,0)`;
    revealWall(wall, spec.visible);
  } else if (wall.seen < 0) {
    revealWall(wall, spec.visible);
  }
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
  node.el.style.height = `${ph}px`;
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
  const cols = compact ? 2.2 : 4.15;
  const rows = compact ? 4.35 : 2.35;
  const cell = Math.min(boardW / cols, boardH / rows);
  const base = cell * (compact ? 0.76 : 0.72);
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
    node.el.style.setProperty("--soft-label", `${clamp(size * 0.1, 11, 40)}px`);
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
        nid: n,
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
    const t = tms * 0.001;
    const nid = b.nid || 0;
    b.vx += (hashNoise(nid * 11.3 + 2.4, t * 0.9) - 0.5) * 0.008 * dt;
    b.vy += (hashNoise(nid * 7.91 + 5.1, t * 0.82) - 0.5) * 0.008 * dt;
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

export function startMedia() {
  videosOpen = true;
  const avatar = document.querySelector(".cv-avatar");
  if (avatar?.dataset.src && !avatar.getAttribute("src")) {
    let photo = avatar.closest(".cv-photo");
    if (!photo) {
      photo = document.createElement("span");
      photo.className = "cv-photo";
      avatar.replaceWith(photo);
      photo.appendChild(avatar);
    }
    avatar.src = thumbURL("images/TouXiang.png") || avatar.dataset.src;
  }
}

export { buildFields, layoutFields };
