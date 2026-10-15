import { cam, runtime } from "./state.js";
import { PATH_MAX, WHEEL_STEP, TOUCH_SCALE, KEY_STEP, ENTER_STEP } from "./data.js";
import { clamp } from "./util.js";
import { resizeView, spawnDust, tickDust, drawWorld } from "./dust.js?v=s-open";
import { resizeVortex, drawVortex } from "./vortex.js";
import { buildHolos, layoutBeacons } from "./holo.js?v=contact-name";
import { buildFields } from "./fields.js?v=icon-fit";
import { applyProgress, setPhase, nudge, jumpTo, holdStationWheel, bindNav } from "./journey.js?v=rail-work";
import { closePeek } from "./peek.js";

const body = document.body;
const pct = document.getElementById("pct");
const clock = document.getElementById("clock");
const title = document.querySelector(".fly-title");

function resize() {
  resizeView();
  resizeVortex();
}

async function boot() {
  runtime.boot = 0;
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* keep going */
    }
  }
  spawnDust();
  const start = performance.now();
  const duration = 2200;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    runtime.boot = eased;
    pct.textContent = `${Math.round(eased * 100)}%`;
    if (t < 1) {
      requestAnimationFrame(step);
      return;
    }
    runtime.boot = 1;
    runtime.ready = true;
    setPhase("is-gate");
  };
  requestAnimationFrame(step);
}

function tickClock() {
  clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function loop(now) {
  cam.lookX += (cam.mx - cam.lookX) * 0.05;
  cam.lookY += (cam.my - cam.lookY) * 0.05;
  const prev = cam.progress;
  cam.vel += (cam.target - cam.progress) * 0.09;
  cam.vel *= 0.78;
  cam.progress += cam.vel;
  cam.progress = clamp(cam.progress, 0, PATH_MAX);
  cam.vz = Math.abs(cam.progress - prev) * PATH_MAX;
  tickDust(now || performance.now());
  applyProgress(cam.progress);
  drawWorld();
  drawVortex(now);
  requestAnimationFrame(loop);
}

function wheelInScrollableText(event) {
  const el = event.target instanceof Element ? event.target : event.target?.parentElement;
  const pane = el?.closest(".float-scroll, .holo-resume");
  if (!pane) return false;
  return pane.scrollHeight - pane.clientHeight > 8;
}

resize();
spawnDust();
buildHolos();
buildFields();
layoutBeacons();
tickClock();
setInterval(tickClock, 1000);
boot();
loop();
if (document.fonts?.ready) {
  document.fonts.ready.then(() => spawnDust()).catch(() => {});
}

window.addEventListener("resize", () => {
  resize();
  spawnDust();
});

window.addEventListener("mousemove", (event) => {
  cam.mx = (event.clientX / innerWidth - 0.5) * -2.4;
  cam.my = (event.clientY / innerHeight - 0.5) * -2.4;
  document.documentElement.style.setProperty("--mx", `${(event.clientX / innerWidth) * 100}%`);
  document.documentElement.style.setProperty("--my", `${(event.clientY / innerHeight) * 100}%`);
});

document.getElementById("enter").addEventListener("click", () => nudge(ENTER_STEP));
document.querySelectorAll(".beacon[data-id]").forEach((el) => {
  el.addEventListener("click", () => jumpTo(el.dataset.id));
});
document.querySelectorAll(".rail-item[data-id]").forEach((el) => {
  el.addEventListener("click", () => jumpTo(el.dataset.id));
});
document.querySelectorAll("[data-go='gate']").forEach((el) => {
  el.addEventListener("click", () => jumpTo("gate"));
});
document.querySelector(".peek-mask").addEventListener("click", closePeek);
bindNav();

window.addEventListener(
  "wheel",
  (event) => {
    if (wheelInScrollableText(event) || body.classList.contains("is-peek")) return;
    event.preventDefault();
    const step = event.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
    if (holdStationWheel(step)) return;
    nudge(step);
  },
  { passive: false },
);

window.addEventListener(
  "touchstart",
  (event) => {
    runtime.lastTouchY = event.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    if (event.target.closest(".holo") || body.classList.contains("is-peek")) return;
    event.preventDefault();
    const y = event.touches[0].clientY;
    nudge((runtime.lastTouchY - y) * TOUCH_SCALE);
    runtime.lastTouchY = y;
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePeek();
    return;
  }
  if (body.classList.contains("is-peek")) return;
  if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Enter") nudge(KEY_STEP);
  if (event.key === "ArrowDown" || event.key === "PageDown") nudge(-KEY_STEP);
});
