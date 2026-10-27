import { clamp } from "util";

export const PATH_MAX = 24;
export const WHEEL_SCALE = 0.00008;
export const TOUCH_SCALE = 0.05;
export const KEY_IMPULSE = 0.28;
export const VEL_MAX = 0.38;
export const NAV_STOPS = [
  { key: "gate", at: 0, label: "00 本站入口", short: "00 入口" },
  { key: "resume", at: 4.5, label: "CV 个人简历", short: "CV 简历" },
  { key: "software", at: 8, label: "SW 常用软件", short: "SW 软件" },
  { key: "works", at: 12, until: 14.2, label: "WK 原画作品", short: "WK 原画" },
  { key: "blender", at: 14.9, until: 17.0, label: "BL Blender效果", short: "BL Blender" },
  { key: "unity", at: 17.7, until: 19.8, label: "UN Unity效果", short: "UN UNITY" },
  { key: "tools", at: 20.5, until: 22.6, label: "TL 工具研发", short: "TL 工具" },
  { key: "contact", at: 23.2, label: "CT 联系方式", short: "CT 联系" },
];
export const SPACE = 48;

export const px = [
  [0, -18], [4, -12.34], [6, -7], [8, -2.5], [10, -2.5], [11, -1.6], [13, 0], [15, 0],
  [17, 4.5], [18.97, -15], [19, 0], [22.5, 4.5], [23.5, 9.5], [23.53, 2.8], [24, 2.8],
];
export const py = [
  [0, 0], [8, 0], [10, 0.1], [11, 1], [13, 1], [15, 1.75], [17, 1], [18.97, 14],
  [19, -3.6], [22.5, 4.7], [23.5, 15.5], [23.53, 0.5], [24, 1.2],
];
export const pz = [
  [0, 0], [7.5, 0], [10, -3.5], [11, 0], [13, 3], [15, 5], [17, 15], [18.97, 40],
  [19, -6], [22.5, 3.2], [23.5, 3.85], [23.53, -2.8], [24, -2.8],
];
export const rxk = [
  [0, 0],
  [5.15, 0], [5.6, 11], [6.45, 14], [7.2, 0],
  [7.5, 0],
  [9.0, 6], [9.6, 16], [10.6, 14], [11.2, -8],
  [13, 5], [17, 5], [18.97, 45], [19, 0],
  [22.37, 17], [23.5, 31], [23.53, 0], [24, 0],
];
export const ryk = [
  [0, -90],
  [5.15, -90], [5.6, -78], [6.45, -74], [7.2, -90],
  [7.5, -90], [8.17, -30],
  [9.0, -11], [9.5, 20], [10.2, 48], [10.8, 108], [11.2, 122],
  [13, 180], [15.5, 180],
  [18.97, 135], [19, 250], [23.03, -112], [23.5, -112], [23.53, -45], [24, -45],
];

export const beaconWorld = {
  resume: [-1.2, 2.2, 10.5],
  software: [-4, 0.8, 3],
  works: [2.2, 1.8, 6.4],
  blender: [4.2, 1.4, 9.5],
  unity: [6.4, 1.2, 13],
  tools: [-7.5, 3.2, 18],
  contact: [8.2, 3.6, 8.5],
};

export function stopByKey(key) {
  return NAV_STOPS.find((item) => item.key === key);
}

export function stopWindow(stop) {
  const start = stop.at;
  const end = stop.until != null ? stop.until : stop.at;
  return { start, end, mid: (start + end) / 2 };
}

export function stopAt(t) {
  let inside = null;
  for (const stop of NAV_STOPS) {
    const { start, end } = stopWindow(stop);
    if (t >= start - 0.08 && t <= end + 0.08) inside = stop;
  }
  if (inside) return inside;
  let best = NAV_STOPS[0];
  let bestD = Infinity;
  for (const stop of NAV_STOPS) {
    const { mid } = stopWindow(stop);
    const d = Math.abs(t - mid);
    if (d < bestD) {
      bestD = d;
      best = stop;
    }
  }
  return best;
}

export function holoVisibility(id, t) {
  const stop = NAV_STOPS.find((item) => item.key === id);
  if (!stop) return 0;
  const fade = 0.62;
  const { start, end } = stopWindow(stop);
  if (t >= start && t <= end) return 1;
  const edge = t < start ? start : end;
  return clamp(1 - Math.abs(t - edge) / fade, 0, 1);
}
