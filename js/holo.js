import { cam, runtime } from "./state.js";
import { beaconWorld, cards, fields, holoVisibility } from "./data.js?v=clips3";
import { project } from "./camera.js";
import { clamp } from "./util.js";
import { layoutFields } from "./fields.js?v=vfast";

const beacons = [...document.querySelectorAll(".beacon")];
const station = document.getElementById("station");

function layoutBeacons() {
  const atGate = runtime.phase !== "is-station";
  beacons.forEach((el) => {
    if (atGate) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    const pos = beaconWorld[el.dataset.id];
    if (!pos) return;
    const p = project(pos[0], pos[1], pos[2]);
    if (!p || p.depth < 20 || p.depth > 1400) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }
    const visible = Math.max(0, 1 - Math.abs(p.depth - 280) / 900);
    const holoOn = holoVisibility(el.dataset.id, cam.progress) > 0.18;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.style.opacity = holoOn ? "0" : String(visible * 0.95);
    el.style.pointerEvents = !holoOn && visible > 0.22 ? "auto" : "none";
    const scale = clamp(p.s * 0.045, 0.45, 1.35);
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
  });
  layoutHolos();
  layoutFields();
}

function slamOf(vis) {
  const s = vis * vis;
  return {
    scale: 0.76 + s * 0.24,
    blur: (1 - s) * 14,
    yaw: (1 - s) * 16,
    lift: (1 - s) * 36,
  };
}

function layoutHolos() {
  document.querySelectorAll(".holo").forEach((el) => {
    const id = el.dataset.id;
    const vis = holoVisibility(id, cam.progress);
    if (vis < 0.1) {
      el.style.opacity = "0";
      el.style.filter = "none";
      el.style.pointerEvents = "none";
      return;
    }
    const slam = slamOf(vis);
    const resumeWide = innerWidth >= 1100 && innerWidth > innerHeight;
    if (id === "resume" && resumeWide) {
      const navW = 210;
      el.style.left = `${navW + (innerWidth - navW) / 2}px`;
      el.style.top = "50%";
      el.style.bottom = "auto";
      el.style.transform = `translate(-50%, calc(-50% + ${slam.lift}px)) scale(${slam.scale}) rotateY(${slam.yaw}deg)`;
    } else if (id === "resume") {
      el.style.left = "50%";
      el.style.top = "48%";
      el.style.bottom = "auto";
      el.style.transform = `translate(-50%, -50%) scale(${slam.scale})`;
    } else if (innerWidth < 720) {
      el.style.left = "12px";
      el.style.top = "auto";
      el.style.bottom = "92px";
      el.style.transform = `scale(${slam.scale})`;
    } else {
      const pos = beaconWorld[id];
      const p = pos ? project(pos[0], pos[1], pos[2]) : null;
      if (!p) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        return;
      }
      el.style.bottom = "auto";
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      const scale = clamp(p.s * 0.042, 0.7, 1) * slam.scale;
      el.style.transform = `translate(22px, -52%) scale(${scale}) rotateY(${slam.yaw}deg)`;
    }
    el.style.filter = slam.blur < 0.4 ? "none" : `blur(${slam.blur.toFixed(1)}px)`;
    el.style.opacity = String(Math.pow(vis, 0.65));
    el.style.pointerEvents = vis > 0.42 ? "auto" : "none";
    el.style.zIndex = String(4 + Math.round(vis * 6));
  });
  syncScrollTracks();
}

function syncScrollTracks() {
  document.querySelectorAll(".float-scroll").forEach((pane) => {
    const wrap = pane.parentElement;
    const fill = wrap.querySelector(".float-fill");
    const thumb = wrap.querySelector(".float-thumb");
    if (!fill) return;
    const max = pane.scrollHeight - pane.clientHeight;
    const ratio = max <= 0 ? 0 : pane.scrollTop / max;
    wrap.classList.toggle("is-scrollable", max > 8);
    fill.style.height = `${ratio * 100}%`;
    if (thumb) thumb.style.top = `${ratio * 100}%`;
  });
}

function bindScrollTracks() {
  document.querySelectorAll(".float-wrap").forEach((wrap) => {
    const pane = wrap.querySelector(".float-scroll");
    const rail = wrap.querySelector(".float-rail");
    if (!pane) return;
    pane.addEventListener("scroll", syncScrollTracks, { passive: true });
    if (!rail) return;
    rail.addEventListener("pointerdown", (event) => {
      const rect = rail.getBoundingClientRect();
      const ratio = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      pane.scrollTop = ratio * (pane.scrollHeight - pane.clientHeight);
    });
  });
  syncScrollTracks();
}

function buildHolos() {
  Object.entries(cards).forEach(([id, card]) => {
    if (fields[id] || !(card.html || card.left)) return;
    const el = document.createElement("article");
    el.className = `holo${id === "resume" ? " holo-resume" : ""}`;
    el.dataset.id = id;
    if (id === "resume") {
      el.innerHTML = `<div class="cv-orbit"><div class="cv-col cv-left"><p class="holo-code">${card.code}</p><h2>${card.title}</h2><p class="holo-meta">${card.meta}</p>${card.left}</div><img class="cv-avatar" data-src="images/TouXiang.png" alt="郑新义"><div class="cv-col cv-right">${card.right}</div></div>`;
    } else {
      const scroll = `<div class="float-scroll">${card.html}</div><div class="float-rail" aria-hidden="true"><span class="float-fill"></span><i class="float-thumb"></i></div>`;
      el.innerHTML = `<p class="holo-code">${card.code}</p><h2>${card.title}</h2><p class="holo-meta">${card.meta}</p><div class="float-wrap">${scroll}</div>`;
    }
    station.appendChild(el);
  });
  bindScrollTracks();
}

export { layoutBeacons, buildHolos };
