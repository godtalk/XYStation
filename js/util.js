export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function screenFit() {
  const w = innerWidth;
  const h = innerHeight;
  const density = clamp(Math.sqrt((w * h) / (1920 * 1080)), 0.48, 2.2);
  const wide = clamp(w / Math.max(h, 1) / (16 / 9), 0.7, 2.15);
  return {
    w,
    h,
    density,
    wide,
    short: Math.min(w, h),
    long: Math.max(w, h),
  };
}

export function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export function isVideoSrc(src) {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(src || "");
}

export const MEDIA_VER = "fs1";

export function mediaURL(path) {
  if (!path) return "";
  const encoded = encodeURI(path);
  return encoded.includes("?") ? `${encoded}&v=${MEDIA_VER}` : `${encoded}?v=${MEDIA_VER}`;
}
