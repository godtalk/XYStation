import { cam, runtime } from "./state.js";
import {
  PATH_MAX,
  HOLD_TICKS,
  HOLD_KEYS,
  NAV_STOPS,
  stopAt,
  stopByKey,
} from "./data.js?v=rail-work";
import { poseAt } from "./camera.js";
import { layoutBeacons } from "./holo.js?v=contact-name";
import { clamp } from "./util.js";

const body = document.body;
const title = document.querySelector(".fly-title");
const gateUi = [...document.querySelectorAll(".gate-ui")];

const holdState = {
  resume: { count: 0, armed: true },
  software: { count: 0, armed: true },
  works: { count: 0, armed: true },
  tools: { count: 0, armed: true },
};

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
  if (cam.target >= 4 || t >= 3.1) setPhase("is-station");
  else setPhase("is-gate");
}

function parkAt(stop) {
  cam.target = stop.at;
  if (cam.progress > stop.at) cam.progress = stop.at;
  if (cam.vel > 0) cam.vel = 0;
}

function armHoldsForJump(key) {
  const dest = stopByKey(key);
  HOLD_KEYS.forEach((holdKey) => {
    const stop = stopByKey(holdKey);
    const hold = holdState[holdKey];
    if (!stop || !hold) return;
    hold.count = 0;
    hold.armed = !dest || dest.at <= stop.at;
  });
}

export function jumpTo(key) {
  const stop = stopByKey(key);
  if (!runtime.ready || !stop) return;
  armHoldsForJump(key);
  cam.target = stop.at;
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

export function nudge(delta) {
  if (!runtime.ready || body.classList.contains("is-peek")) return;
  const from = cam.target;
  const to = clamp(from + delta, 0, PATH_MAX);

  if (delta > 0) {
    for (const key of HOLD_KEYS) {
      const stop = stopByKey(key);
      const hold = holdState[key];
      if (!stop || !hold) continue;
      if (from < stop.at && to >= stop.at) {
        hold.count = 0;
        hold.armed = true;
        parkAt(stop);
        return;
      }
    }
  } else {
    HOLD_KEYS.forEach((key) => {
      const stop = stopByKey(key);
      const hold = holdState[key];
      if (!stop || !hold) return;
      hold.count = 0;
      if (to <= stop.at) hold.armed = true;
    });
  }

  cam.target = to;
}

export function holdStationWheel(delta) {
  if (delta <= 0) return false;
  for (const key of HOLD_KEYS) {
    const stop = stopByKey(key);
    const hold = holdState[key];
    if (!stop || !hold || !hold.armed || cam.target < stop.at - 0.05) continue;
    if (cam.target > stop.at + 0.2) continue;
    hold.count += 1;
    if (hold.count < HOLD_TICKS) {
      parkAt(stop);
      return true;
    }
    hold.armed = false;
    hold.count = 0;
    return false;
  }
  return false;
}

export function bindNav() {
  setActiveNav(null);
}
