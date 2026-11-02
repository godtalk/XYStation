const KEY = "xystation-bgm";
const LEVEL = 0.42;
const DUCK = 0.06;
const SRC = `MP3/${encodeURIComponent("MaFia - 大军压境(压迫感BGM).mp3")}`;

const audio = new Audio(SRC);
audio.loop = true;
audio.preload = "auto";
audio.volume = LEVEL;

const button = document.getElementById("bgm");
let enabled = true;
let ducked = false;
let started = false;

try {
  enabled = localStorage.getItem(KEY) !== "off";
} catch {
  /* keep the default */
}

function paint() {
  if (!button) return;
  button.classList.toggle("is-on", enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute("aria-label", enabled ? "关闭背景音乐" : "打开背景音乐");
}

function level() {
  if (!enabled) return 0;
  return ducked ? DUCK : LEVEL;
}

export function duckBgm(on) {
  ducked = Boolean(on);
  if (!enabled) return;
  audio.volume = level();
}

function remember() {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* ignore */
  }
}

function start() {
  if (!enabled) return;
  audio.volume = level();
  const pending = audio.play();
  if (!pending) {
    started = true;
    paint();
    return;
  }
  pending.then(() => {
    started = true;
    paint();
  }).catch(() => {});
}

function stop() {
  audio.pause();
  paint();
}

function toggle() {
  enabled = !enabled;
  remember();
  if (enabled) start();
  else stop();
  paint();
}

function arm(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("#bgm")) return;
  if (!enabled || started) return;
  start();
}

button?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggle();
});

window.addEventListener("pointerdown", arm, true);
window.addEventListener("keydown", arm, true);
window.addEventListener("wheel", arm, { capture: true, passive: true });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!audio.paused) audio.pause();
    return;
  }
  if (enabled && started) start();
});

audio.addEventListener("play", paint);
audio.addEventListener("pause", paint);
paint();
