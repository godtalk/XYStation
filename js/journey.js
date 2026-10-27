import { cam, runtime } from "./state.js";
import {
  PATH_MAX,
  NAV_STOPS,
  VEL_MAX,
  stopAt,
  stopByKey,
} from "./data.js?v=mp4case";
import { poseAt } from "./camera.js";
import { layoutBeacons } from "./holo.js?v=mp4case";
import { clamp } from "./util.js";

const body = document.body;
const title = document.querySelector(".fly-title");
const gateUi = [...document.querySelectorAll(".gate-ui")];

const SNAP_IDLE = 280;
const SNAP_DIST = 0.45;
const COAST_DAMP = 0.9;
const REST_VEL = 0.00045;
const WHEEL_BOOST = 1;

let ride = null;
let lastTick = 0;
let lastInput = 0;

function easeInOut(u) {
  return u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2;
}

function durationFor(dist) {
  return clamp(480 + dist * 70, 500, 900);
}

function setRide(to, durScale = 1) {
  to = clamp(to, 0, PATH_MAX);
  if (Math.abs(to - cam.progress) < 0.012) {
    cam.progress = to;
    cam.vel = 0;
    cam.target = to;
    ride = null;
    return;
  }
  ride = {
    from: cam.progress,
    to,
    start: performance.now(),
    dur: durationFor(Math.abs(to - cam.progress)) * durScale,
  };
}

export function setPhase(name) {
  if (runtime.phase === name) return;
  const prev = runtime.phase;
  runtime.phase = name;
  body.classList.remove("is-boot", "is-gate", "is-station");
  body.classList.add(name);
  document.getElementById("gate").setAttribute("aria-hidden", name === "is-boot");
  document.getElementById("station").setAttribute("aria-hidden", name === "is-boot");
  if (name === "is-gate" && prev !== "is-gate" && title) {
    title.classList.remove("is-pop");
  }
}

export function applyProgress(t) {
  const p = t / PATH_MAX;
  const fly = clamp(p / 0.09, 0, 1);
  gateUi.forEach((el) => {
    const fade = clamp(1 - p / 0.045, 0, 1);
    el.style.opacity = String(fade);
    el.style.pointerEvents = fade < 0.2 ? "none" : "auto";
  });
  const grain = document.querySelector(".grain");
  if (grain) grain.style.opacity = String(0.12 + Math.min(0.28, cam.vz * 0.09));
  poseAt(t);
  layoutBeacons();
  syncRail(t);
  if (!runtime.ready) return;
  if (runtime.phase === "is-station") {
    if (t < 2.35) setPhase("is-gate");
  } else if (t >= 3.1) {
    setPhase("is-station");
  }
}

function busy() {
  return !runtime.ready || body.classList.contains("is-peek");
}

function snapTarget(t) {
  let best = null;
  let bestD = Infinity;
  for (const stop of NAV_STOPS) {
    if (stop.key === "gate") continue;
    if (stop.until != null) {
      if (t >= stop.at && t <= stop.until) return null;
      const pt = t < stop.at ? stop.at : stop.until;
      const d = Math.abs(t - pt);
      if (d < bestD) {
        bestD = d;
        best = pt;
      }
    } else {
      const d = Math.abs(t - stop.at);
      if (d < bestD) {
        bestD = d;
        best = stop.at;
      }
    }
  }
  if (best == null || bestD < 0.02 || bestD > SNAP_DIST) return null;
  return best;
}

export function jumpTo(key) {
  const stop = stopByKey(key);
  if (busy() || !stop) return;
  lastInput = performance.now();
  cam.vel = 0;
  setRide(stop.at);
}

export function flick(impulse) {
  if (busy() || !impulse) return;
  lastInput = performance.now();
  ride = null;
  cam.vel = clamp(cam.vel + impulse * WHEEL_BOOST, -VEL_MAX, VEL_MAX);
}

export function drag(delta) {
  if (busy() || !delta) return;
  lastInput = performance.now();
  ride = null;
  cam.progress = clamp(cam.progress + delta, 0, PATH_MAX);
  cam.vel = clamp(delta, -VEL_MAX, VEL_MAX);
  cam.target = cam.progress;
}

export function tickMotion(now) {
  const t = now || performance.now();
  const dt = lastTick ? Math.min(0.033, (t - lastTick) / 1000) : 0.016;
  lastTick = t;
  const prev = cam.progress;
  const frames = dt * 60;

  if (ride) {
    const u = clamp((t - ride.start) / Math.max(ride.dur, 1), 0, 1);
    const next = clamp(ride.from + (ride.to - ride.from) * easeInOut(u), 0, PATH_MAX);
    cam.progress = next;
    cam.vel = next - prev;
    if (u >= 1) {
      cam.progress = clamp(ride.to, 0, PATH_MAX);
      cam.vel = 0;
      ride = null;
    }
  } else {
    cam.progress = clamp(cam.progress + cam.vel, 0, PATH_MAX);
    cam.vel *= COAST_DAMP ** frames;
    if (cam.progress <= 0 && cam.vel < 0) cam.vel = 0;
    if (cam.progress >= PATH_MAX && cam.vel > 0) cam.vel = 0;
    if (Math.abs(cam.vel) < REST_VEL) cam.vel = 0;
    if (!cam.vel && t - lastInput > SNAP_IDLE) {
      const at = snapTarget(cam.progress);
      if (at != null) setRide(at, 0.85);
    }
  }

  cam.target = ride ? ride.to : cam.progress;
  const vzNow = Math.abs(cam.progress - prev) * PATH_MAX;
  cam.vz += (vzNow - cam.vz) * 0.22;
}

function setActiveNav(key) {
  const idx = NAV_STOPS.findIndex((item) => item.key === key);
  document.querySelectorAll(".rail-item").forEach((btn) => {
    const btnKey = btn.dataset.go === "gate" ? "gate" : btn.dataset.id;
    const btnIdx = NAV_STOPS.findIndex((item) => item.key === btnKey);
    const on = btnKey === key;
    btn.classList.toggle("is-on", on);
    btn.classList.toggle("is-passed", btnIdx >= 0 && idx >= 0 && btnIdx < idx);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });
}

function syncRail(t) {
  const now = document.getElementById("rail-now");
  const current = stopAt(t);
  const long = now.querySelector(".rail-long");
  const short = now.querySelector(".rail-short");
  if (long && short) {
    long.textContent = current.label;
    short.textContent = current.short;
  } else {
    now.textContent = current.label;
  }
  NAV_STOPS.forEach((stop, index) => {
    const next = NAV_STOPS[index + 1];
    if (!next) return;
    const span = next.at - stop.at;
    const fill = span <= 0 ? 0 : clamp((t - stop.at) / span, 0, 1);
    const seg = document.querySelector(`.rail-seg[data-from="${stop.key}"]`);
    if (seg) seg.style.setProperty("--seg", `${fill * 100}%`);
  });
  setActiveNav(current.key);
}

export function bindNav() {
  setActiveNav(null);
}
