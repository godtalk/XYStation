import { project } from "./camera.js";

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const dust = [];
const motes = [];

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

export function spawnDust() {
  dust.length = 0;
  motes.length = 0;
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
}

export function tickDust(now) {
  const t = now / 1000;
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
}

function drawFieldLinks() {}

export function drawWorld() {
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
