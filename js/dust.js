import { beginView, project } from "./camera.js?v=night1";
import { cam, runtime } from "./state.js";
import { SPACE } from "./data.js";
import { clamp, screenFit } from "./util.js";

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const dust = [];
const motes = [];
const ash = [];
const TITLE_PARALLAX_X = 14;
const TITLE_PARALLAX_Y = 9;
let titleDot = 1.2;

function fitCanvas(el, context) {
  el.width = innerWidth * devicePixelRatio;
  el.height = innerHeight * devicePixelRatio;
  el.style.width = `${innerWidth}px`;
  el.style.height = `${innerHeight}px`;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

export function resizeView() {
  fitCanvas(canvas, ctx);
}

function sampleWord(text) {
  const fontPx = 420;
  const tracking = `${Math.round(fontPx * 0.1)}px`;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = `800 ${fontPx}px Syne, "Noto Sans SC", sans-serif`;
  probe.letterSpacing = tracking;
  const m = probe.measureText(text);
  const textW = Math.ceil(Math.max(
    m.width,
    Math.abs(m.actualBoundingBoxLeft || 0) + Math.abs(m.actualBoundingBoxRight || 0),
  ));
  const padX = Math.ceil(fontPx * 0.55);
  const padY = Math.ceil(fontPx * 0.45);
  const w = Math.max(64, textW + padX * 2);
  const h = Math.ceil(fontPx * 1.35) + padY;
  const c = document.createElement("canvas");
  const g = c.getContext("2d");
  c.width = w;
  c.height = h;
  g.fillStyle = "#fff";
  g.font = `800 ${fontPx}px Syne, "Noto Sans SC", sans-serif`;
  g.letterSpacing = tracking;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2);
  const img = g.getImageData(0, 0, w, h).data;
  const src = new Uint8Array(w * h);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (img[(y * w + x) * 4 + 3] < 80) continue;
      src[y * w + x] = 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) return [];
  const open = Math.round(fontPx * 0.032);
  const ink = erodeInk(src, w, h, minX, minY, maxX, maxY, open);
  const bw = maxX - minX;
  const bh = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && ink[y * w + x] === 1;
  const focal = Math.min(innerWidth, innerHeight) * 0.92;
  const depth = 18.18 * SPACE;
  const maxW = innerWidth * 0.62;
  const spanZ = (maxW * depth) / (SPACE * focal);
  const gap = clamp(maxW / 520, 1.55, 2.6);
  const step = Math.round(clamp((gap * bw) / maxW, 3, 11));
  const screenStep = (step / Math.max(bw, 1)) * maxW;
  titleDot = clamp(screenStep * 0.3, 0.32, 1.45);
  const spanY = spanZ * (bh / bw);
  const edgeStride = Math.max(2, Math.round(step * 0.45));
  const pts = [];
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!on(x, y)) continue;
      const edge = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1);
      if (edge) {
        if ((x + y) % edgeStride) continue;
      } else if (x % step || y % step) continue;
      const u = (x - cx) / bw;
      const v = (y - cy) / bh;
      pts.push({
        tx: 0.18,
        ty: v * spanY,
        tz: -u * spanZ,
        edge,
      });
    }
  }
  return pts;
}

function erodeInk(src, w, h, minX, minY, maxX, maxY, radius) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let ok = 1;
      for (let k = -radius; k <= radius; k += 1) {
        const xx = x + k;
        if (xx < 0 || xx >= w || !src[y * w + xx]) {
          ok = 0;
          break;
        }
      }
      tmp[y * w + x] = ok;
    }
  }
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let ok = 1;
      for (let k = -radius; k <= radius; k += 1) {
        const yy = y + k;
        if (yy < 0 || yy >= h || !tmp[yy * w + x]) {
          ok = 0;
          break;
        }
      }
      out[y * w + x] = ok;
    }
  }
  return out;
}

export function spawnDust() {
  const { density, wide, h } = screenFit();
  const dustN = Math.round(clamp(220 * density * density, 110, 560));
  const moteN = Math.round(clamp(36 * density * density, 16, 88));
  const sx = 110;
  const sy = 64 * clamp(h / 1080, 0.8, 1.5);
  const sz = 120 * wide;
  const glyphs = sampleWord("XYSTATION");
  const ashN = Math.round(clamp(24000 * density * density, 13000, 24000));
  dust.length = 0;
  motes.length = 0;
  ash.length = 0;
  for (let i = 0; i < dustN; i += 1) {
    const x = (Math.random() - 0.5) * sx;
    const y = (Math.random() - 0.5) * sy;
    const z = (Math.random() - 0.4) * sz;
    dust.push({
      x, y, z, bx: x, by: y, bz: z, ph: Math.random() * Math.PI * 2, glyph: false,
    });
  }
  glyphs.forEach((g, i) => {
    const x = (Math.random() - 0.5) * sx;
    const y = (Math.random() - 0.5) * sy;
    const z = (Math.random() - 0.4) * sz;
    const boom = 1.12 + Math.random() * 0.55;
    dust.push({
      x, y, z, bx: x * boom, by: y * boom, bz: z * boom,
      gx: g.tx + (Math.random() - 0.5) * 16,
      gy: g.ty + (Math.random() - 0.5) * 10,
      gz: g.tz + (Math.random() - 0.5) * 20,
      tx: g.tx, ty: g.ty, tz: g.tz,
      ox: (Math.random() - 0.5) * 0.08,
      oy: (Math.random() - 0.5) * 0.06,
      oz: (Math.random() - 0.5) * 0.08,
      ph: Math.random() * Math.PI * 2 + i * 0.01,
      glyph: true,
      edge: g.edge,
    });
  });
  for (let i = 0; i < moteN; i += 1) {
    let x = (Math.random() - 0.5) * sx * 0.78;
    let y = (Math.random() - 0.5) * sy * 0.85;
    let z = (Math.random() - 0.3) * sz * 0.83;
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
  for (let i = 0; i < ashN; i += 1) {
    const band = Math.random();
    const near = band < 0.2;
    const mid = band < 0.55;
    const span = near ? 0.22 : mid ? 0.55 : 1;
    ash.push({
      bx: (Math.random() - 0.5) * sx * span,
      by: (Math.random() - 0.5) * sy * span,
      bz: (Math.random() - (near ? 0.15 : 0.4)) * sz * span,
      mass: near ? 0.16 + Math.random() * 0.22 : mid ? 0.07 + Math.random() * 0.1 : 0.03 + Math.random() * 0.05,
      amp: near ? 2.8 : mid ? 1.8 : 1.1,
      ph: Math.random() * Math.PI * 2,
      x: 0, y: 0, z: 0,
    });
  }
}

function titleHold() {
  if (!runtime.ready) {
    const form = clamp(runtime.boot, 0, 1);
    return form * form * (3 - 2 * form);
  }
  const form = 1 - clamp((cam.progress - 0.06) / 2.05, 0, 1);
  return form * form * (3 - 2 * form);
}

export function tickDust(now) {
  const t = now / 1000;
  const hold = titleHold();
  dust.forEach((p) => {
    const fieldX = p.bx + Math.sin(t * 0.07 + p.ph) * 1.6;
    const fieldY = p.by + Math.cos(t * 0.055 + p.ph * 1.1) * 1.2;
    const fieldZ = p.bz + Math.sin(t * 0.04 + p.ph * 0.8) * 2.1;
    if (p.glyph) {
      const jx = Math.sin(t * 1.4 + p.ph) * 0.09;
      const jy = Math.cos(t * 1.15 + p.ph * 1.2) * 0.078;
      const jz = Math.sin(t * 1.05 + p.ph * 0.7) * 0.072;
      const scatterAmp = runtime.ready ? 1 + (1 - hold) * 1.8 : 1;
      const fromX = runtime.ready ? p.bx + Math.sin(t * 0.09 + p.ph) * 2.8 * scatterAmp : p.gx + Math.sin(t * 0.45 + p.ph) * 0.9;
      const fromY = runtime.ready ? p.by + Math.cos(t * 0.075 + p.ph * 1.1) * 2.1 * scatterAmp : p.gy + Math.cos(t * 0.4 + p.ph * 1.1) * 0.7;
      const fromZ = runtime.ready ? p.bz + Math.sin(t * 0.06 + p.ph * 0.8) * 3.4 * scatterAmp : p.gz + Math.sin(t * 0.35 + p.ph * 0.8) * 1.1;
      p.x = fromX + (p.tx + p.ox + jx - fromX) * hold;
      p.y = fromY + (p.ty + p.oy + jy - fromY) * hold;
      p.z = fromZ + (p.tz + p.oz + jz - fromZ) * hold;
    } else {
      p.x = fieldX;
      p.y = fieldY;
      p.z = fieldZ;
    }
  });
  motes.forEach((m) => {
    m.x = m.bx + Math.sin(t * 0.05 + m.ph) * 1.1;
    m.y = m.by + Math.cos(t * 0.045 + m.ph) * 0.9;
    m.z = m.bz + Math.sin(t * 0.035 + m.ph * 0.7) * 1.4;
  });
}

function drawFieldLinks() {}

function dustTint() {
  const style = getComputedStyle(document.documentElement);
  return {
    fill: style.getPropertyValue("--dust").trim() || "#ffffff",
    stroke: style.getPropertyValue("--dust-stroke").trim() || "rgba(255, 255, 255, 0.42)",
    title: style.getPropertyValue("--title-dust").trim() || "#ffffff",
    titleScale: Number.parseFloat(style.getPropertyValue("--title-scale")) || 1,
  };
}

export function drawWorld() {
  beginView();
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const tint = dustTint();
  ctx.fillStyle = tint.fill;
  ctx.strokeStyle = tint.stroke;
  const hold = titleHold();
  const scatter = 1 - hold;
  const space = runtime.ready ? scatter : 0;

  motes.forEach((m) => {
    const a = project(m.x, m.y, m.z);
    if (!a) return;
    const near = clamp((a.depth - 50) / 140, 0, 1);
    ctx.globalAlpha = Math.min(0.16, 90 / a.depth) * near;
    const size = Math.max(1.4, a.s * m.r * 0.62);
    ctx.globalAlpha *= clamp(1.6 / size, 0.22, 1);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  });

  dust.forEach((p) => {
    const a = p.glyph ? project(p.x, p.y, p.z, scatter) : project(p.x, p.y, p.z);
    if (!a) return;
    if (p.glyph) {
      a.x += cam.lookX * TITLE_PARALLAX_X * (1 - scatter);
      a.y += cam.lookY * TITLE_PARALLAX_Y * (1 - scatter);
      const formed = 0.8;
      const bg = clamp(0.2 + 90 / (a.depth + 28), 0.18, 0.5);
      const fade = runtime.ready
        ? formed * (1 - scatter) + bg * scatter
        : formed * (0.22 + 0.78 * hold);
      const formedR = titleDot * (p.edge ? 0.9 : 0.55) * tint.titleScale;
      const spaceR = clamp(a.s * (p.edge ? 0.038 : 0.024), 0.5, 2.6);
      const r = runtime.ready
        ? formedR * (1 - scatter) + spaceR * scatter
        : formedR;
      const sizeFade = runtime.ready ? clamp(0.7 / Math.max(r, 0.4), 0.28, 1) : 1;
      ctx.globalAlpha = (p.edge ? fade : fade * (0.5 + 0.25 * scatter)) * sizeFade;
      ctx.fillStyle = tint.title;
      ctx.beginPath();
      ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tint.fill;
      return;
    }
    const near = clamp((a.depth - 50) / 140, 0, 1);
    ctx.globalAlpha = Math.min(0.28, 70 / a.depth) * near;
    ctx.beginPath();
    ctx.arc(a.x, a.y, Math.max(0.4, a.s * 0.01), 0, Math.PI * 2);
    ctx.fill();
  });

  if (space > 0.03) {
    const t = performance.now() / 1000;
    ash.forEach((p) => {
      const x = p.bx + Math.sin(t * 0.13 + p.ph) * p.amp;
      const y = p.by + Math.cos(t * 0.1 + p.ph * 1.15) * p.amp * 0.75;
      const z = p.bz + Math.sin(t * 0.08 + p.ph * 0.7) * p.amp * 1.15;
      const a = project(x, y, z, 0);
      if (!a) return;
      const r = clamp(a.s * p.mass, 0.45, 4.2);
      ctx.globalAlpha = space * clamp(0.1 + 55 / (a.depth + 18), 0.08, 0.48) * clamp(0.72 / r, 0.16, 1);
      const d = r * 2;
      ctx.fillRect(a.x - r, a.y - r, d, d);
    });
  }

  drawFieldLinks();
  ctx.globalAlpha = 1;
}
