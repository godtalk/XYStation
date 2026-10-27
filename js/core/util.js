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

export const NOISE_SEED = 7341.8821;

export function hash01(n) {
  const s = Math.sin(n * 127.1 + NOISE_SEED) * 43758.5453;
  return s - Math.floor(s);
}

export function hashNoise(id, t) {
  const a = Math.floor(t);
  const f = t - a;
  const u = f * f * (3 - 2 * f);
  return hash01(id + a * 19.17) * (1 - u) + hash01(id + (a + 1) * 19.17) * u;
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

export function isCoarse() {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrow = window.matchMedia?.("(max-width: 720px)")?.matches;
  return Boolean(coarse || narrow || (navigator.maxTouchPoints > 0 && innerWidth < 900));
}

export function thumbURL(path) {
  if (!path) return "";
  const cut = path.replace(/^images\//, "").replace(/\.[^.]+$/i, ".jpg");
  return mediaURL(`images/thumbs/${cut}`);
}
