import { cam } from "./state.js";
import { SPACE, px, py, pz, rxk, ryk } from "./data.js";

export function sample(keys, t) {
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

let view = null;

export function poseAt(t) {
  const deg = Math.PI / 180;
  cam.x = sample(px, t) * SPACE;
  cam.y = sample(py, t) * SPACE;
  cam.z = sample(pz, t) * SPACE;
  cam.rx = sample(rxk, t) * deg;
  cam.ry = sample(ryk, t) * deg;
}

export function beginView() {
  view = {
    cy: Math.cos(-cam.ry),
    sy: Math.sin(-cam.ry),
    cx: Math.cos(-cam.rx),
    sx: Math.sin(-cam.rx),
    camx: cam.x,
    camy: cam.y,
    camz: cam.z,
    focal: Math.min(innerWidth, innerHeight) * 0.92,
    hw: innerWidth / 2,
    hh: innerHeight * 0.48,
  };
}

export function project(wx, wy, wz, lookScale = 1) {
  const v = view;
  let x = wx * SPACE - (v ? v.camx : cam.x);
  let y = wy * SPACE - (v ? v.camy : cam.y);
  let z = wz * SPACE - (v ? v.camz : cam.z);
  const cy = v ? v.cy : Math.cos(-cam.ry);
  const sy = v ? v.sy : Math.sin(-cam.ry);
  const x1 = x * cy - z * sy;
  let z1 = x * sy + z * cy;
  const cx = v ? v.cx : Math.cos(-cam.rx);
  const sx = v ? v.sx : Math.sin(-cam.rx);
  const y1 = y * cx - z1 * sx;
  const z2 = y * sx + z1 * cx;
  let x2 = x1;
  let y2 = y1;
  let z4 = z2;
  if (lookScale) {
    const lx = -cam.lookY * 0.32 * lookScale;
    const ly = -cam.lookX * 0.22 * lookScale;
    const clx = Math.cos(-lx);
    const slx = Math.sin(-lx);
    y2 = y1 * clx - z2 * slx;
    const z3 = y1 * slx + z2 * clx;
    const cly = Math.cos(-ly);
    const sly = Math.sin(-ly);
    x2 = x1 * cly - z3 * sly;
    z4 = x1 * sly + z3 * cly;
  }
  if (z4 < 12) return null;
  const focal = v ? v.focal : Math.min(innerWidth, innerHeight) * 0.92;
  const hw = v ? v.hw : innerWidth / 2;
  const hh = v ? v.hh : innerHeight * 0.48;
  return {
    x: hw + (x2 * focal) / z4,
    y: hh + (y2 * focal) / z4,
    s: focal / z4,
    depth: z4,
  };
}
