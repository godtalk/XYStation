export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
