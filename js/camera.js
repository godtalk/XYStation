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

export function poseAt(t) {
  const deg = Math.PI / 180;
  cam.x = sample(px, t) * SPACE;
  cam.y = sample(py, t) * SPACE;
  cam.z = sample(pz, t) * SPACE;
  cam.rx = sample(rxk, t) * deg;
  cam.ry = sample(ryk, t) * deg;
}

export function project(wx, wy, wz, lookScale = 1) {
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
  const lx = -cam.lookY * 0.32 * lookScale;
  const ly = -cam.lookX * 0.22 * lookScale;
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
