// 改 JS 后只把 index.html importmap 里的 ?v= 往上加一号。
import { cam, runtime } from "state";
import { KEY_IMPULSE, WHEEL_SCALE } from "path";
import { resizeView, spawnDust, tickDust, drawWorld } from "dust";
import { resizeVortex, drawVortex } from "vortex";
import { resizePoints, drawPoints, loadPointModel, mountPointClouds } from "pointmodel";
import { POINT_CLOUDS } from "pointclouds";
import { bindTheme } from "theme";
import { buildHolos, layoutBeacons } from "holo";
import { buildFields, spinWorks, dragWorks, startMedia } from "fields";
import { applyProgress, setPhase, flick, drag, jumpTo, leaveStrip, tickMotion, bindNav } from "journey";
import { closePeek } from "peek";

const body = document.body;
const pct = document.getElementById("pct");
const clock = document.getElementById("clock");
const title = document.querySelector(".fly-title");

function resize() {
  resizeView();
  resizeVortex();
  resizePoints();
}

let bootStart = 0;

async function boot() {
  runtime.boot = 0;
  if (document.fonts?.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 1800)),
      ]);
    } catch {
      /* keep going */
    }
  }
  bootStart = performance.now();
}

function tickBoot(now) {
  if (runtime.ready || !bootStart) return;
  const t = Math.min(1, (now - bootStart) / 2200);
  const eased = 1 - (1 - t) ** 3;
  runtime.boot = eased;
  pct.textContent = `${Math.round(eased * 100)}%`;
  if (t < 1) return;
  runtime.boot = 1;
  runtime.ready = true;
  setPhase("is-gate");
  startMedia();
}

function tickClock() {
  clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function loop(now) {
  const t = now || performance.now();
  tickBoot(t);
  cam.lookX += (cam.mx - cam.lookX) * 0.05;
  cam.lookY += (cam.my - cam.lookY) * 0.05;
  tickMotion(t);
  tickDust(t);
  applyProgress(cam.progress);
  drawWorld();
  drawPoints(t);
  drawVortex(t);
  requestAnimationFrame(loop);
}

function wheelInScrollableText(event) {
  const el = event.target instanceof Element ? event.target : event.target?.parentElement;
  const pane = el?.closest(".float-scroll, .holo-resume");
  if (!pane) return false;
  return pane.scrollHeight - pane.clientHeight > 8;
}

resize();
loadPointModel("OBJ/%E7%82%AE%E8%BD%A62.obj?v=2");
mountPointClouds(POINT_CLOUDS);
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

let resizeTimer = 0;
window.addEventListener("resize", () => {
  resize();
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => spawnDust(), 180);
});

window.addEventListener("mousemove", (event) => {
  cam.mx = (event.clientX / innerWidth - 0.5) * -2.4;
  cam.my = (event.clientY / innerHeight - 0.5) * -2.4;
  document.documentElement.style.setProperty("--mx", `${(event.clientX / innerWidth) * 100}%`);
  document.documentElement.style.setProperty("--my", `${(event.clientY / innerHeight) * 100}%`);
});

document.getElementById("enter").addEventListener("click", () => jumpTo("resume"));
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
bindTheme();

window.addEventListener(
  "wheel",
  (event) => {
    if (wheelInScrollableText(event) || body.classList.contains("is-peek")) return;
    event.preventDefault();
    const line = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const dy = event.deltaY * line;
    const spun = spinWorks(dy);
    if (spun === "next") leaveStrip(1);
    else if (spun === "prev") leaveStrip(-1);
    if (spun) return;
    const atGate = runtime.phase !== "is-station" || cam.progress < 0.35;
    if (atGate) flick(Math.abs(dy) * WHEEL_SCALE);
    else flick(dy * WHEEL_SCALE);
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
    // 手机竖滑：一屏高换成约 2.4 的路程（不到一站）；横向墙按屏宽/屏高跟上，方向仍用原来的 dy
    const dy = runtime.lastTouchY - y;
    runtime.lastTouchY = y;
    const span = Math.max(innerHeight, 1);
    const across = Math.min(1, innerWidth / span);
    const dragged = dragWorks(dy * across);
    if (dragged === "next") leaveStrip(1);
    else if (dragged === "prev") leaveStrip(-1);
    if (dragged) return;
    drag((-dy / span) * 2.4);
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePeek();
    return;
  }
  if (body.classList.contains("is-peek")) return;
  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "Enter") flick(KEY_IMPULSE);
  if (event.key === "ArrowUp" || event.key === "PageUp") flick(-KEY_IMPULSE);
});
