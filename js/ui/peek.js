import { isCoarse } from "util";

const body = document.body;
const PEEK_EASE = "0.48s cubic-bezier(0.22, 1, 0.36, 1)";
let peekFrom = null;
let peekBusy = false;
let peekSeq = 0;
let borrowed = null;

function peekEls() {
  return {
    peek: document.getElementById("peek"),
    frame: document.querySelector(".peek-frame"),
    img: document.getElementById("peek-img"),
    video: document.getElementById("peek-video"),
    wait: document.getElementById("peek-wait"),
    cap: document.getElementById("peek-cap"),
  };
}

function originThumb(el) {
  return el?.querySelector(".flow-mask, video, img, .peek-hole") || null;
}

function originRect(el) {
  const thumb = originThumb(el);
  if (!thumb) return null;
  const r = thumb.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return r;
}

function mediaSize(el) {
  if (el.tagName === "VIDEO") {
    return {
      w: el.videoWidth || 1600,
      h: el.videoHeight || 1000,
    };
  }
  return {
    w: el.naturalWidth || 1600,
    h: el.naturalHeight || 1000,
  };
}

function frameFor(w, h) {
  const phone = innerWidth < 720;
  const maxW = Math.max(1, innerWidth * (phone ? 0.92 : 0.9));
  const maxH = Math.max(1, innerHeight * (phone ? 0.68 : 0.82));
  const s = Math.min(maxW / Math.max(w, 1), maxH / Math.max(h, 1));
  const width = w * s;
  const height = h * s;
  return {
    left: (innerWidth - width) / 2,
    top: (innerHeight - height) / 2,
    width,
    height,
  };
}

function peekTarget(el) {
  const { w, h } = mediaSize(el);
  return frameFor(w, h);
}

function sameURL(a, b) {
  try {
    return new URL(a, location.href).href === new URL(b, location.href).href;
  } catch {
    return a === b;
  }
}

function placePeekFrame(frame, rect, animate) {
  frame.style.transition = animate
    ? `left ${PEEK_EASE}, top ${PEEK_EASE}, width ${PEEK_EASE}, height ${PEEK_EASE}`
    : "none";
  frame.style.left = `${rect.left}px`;
  frame.style.top = `${rect.top}px`;
  frame.style.width = `${rect.width}px`;
  frame.style.height = `${rect.height}px`;
  frame.style.transform = "none";
}

function setWait(text) {
  const wait = document.getElementById("peek-wait");
  if (!wait) return;
  if (!text) {
    wait.hidden = true;
    wait.textContent = "";
    return;
  }
  wait.hidden = false;
  wait.textContent = text;
}

function bindPeekClip(clip) {
  clip.hidden = false;
  clip.muted = false;
  clip.loop = false;
  clip.controls = true;
  clip.style.width = "100%";
  clip.style.height = "100%";
  clip.style.maxWidth = "none";
  clip.style.maxHeight = "none";
  clip.style.minWidth = "0";
  clip.style.minHeight = "0";
}

function holdPlate(originEl, from) {
  let hole = originEl.querySelector(".peek-hole");
  if (!hole) {
    hole = document.createElement("span");
    hole.className = "peek-hole";
    originEl.insertBefore(hole, originEl.firstChild);
  }
  hole.style.width = `${Math.round(from.width)}px`;
  hole.style.height = `${Math.round(from.height)}px`;
  return hole;
}

function restoreClip() {
  if (!borrowed || !peekFrom) return;
  borrowed.pause();
  borrowed.controls = false;
  borrowed.muted = true;
  borrowed.loop = true;
  try {
    borrowed.currentTime = 0;
  } catch {
    /* ignore */
  }
  const hole = peekFrom.querySelector(".peek-hole");
  if (hole) hole.replaceWith(borrowed);
  else peekFrom.insertBefore(borrowed, peekFrom.firstChild);
  borrowed = null;
}

function resetPeekFrame(frame, img, video) {
  frame.style.transition = "none";
  frame.style.left = "0px";
  frame.style.top = "0px";
  frame.style.width = "0px";
  frame.style.height = "0px";
  frame.style.transform = "none";
  frame.classList.remove("has-video", "is-zoom", "is-panning");
  img.style.transform = "";
  img.src = "";
  img.hidden = false;
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.hidden = true;
  setWait("");
}

function mediaReady(el, isVideo) {
  if (!isVideo) return el.complete && el.naturalWidth;
  return el.readyState >= 2 && el.videoWidth;
}

function bufferPct(clip) {
  const duration = clip.duration;
  if (duration && Number.isFinite(duration) && clip.buffered.length) {
    let end = 0;
    for (let i = 0; i < clip.buffered.length; i += 1) end = Math.max(end, clip.buffered.end(i));
    return Math.min(100, Math.round((end / duration) * 100));
  }
  return clip.readyState >= 4 ? 100 : 0;
}

function playWhenReady(clip, seq) {
  let paint = () => {};
  const stop = () => {
    clip.removeEventListener("progress", paint);
    clip.removeEventListener("loadedmetadata", paint);
    clip.removeEventListener("canplay", paint);
  };
  const go = () => {
    if (seq !== peekSeq) return;
    stop();
    setWait("");
    clip.play().catch(() => {});
  };
  paint = () => {
    if (seq !== peekSeq) {
      stop();
      return;
    }
    if (clip.error) {
      stop();
      setWait("片子没能打开");
      return;
    }
    if (clip.readyState >= 3) {
      go();
      return;
    }
    setWait(`${bufferPct(clip)}%`);
  };
  if (clip.error) {
    setWait("片子没能打开");
    return;
  }
  if (clip.readyState >= 3) {
    go();
    return;
  }
  paint();
  clip.addEventListener("progress", paint);
  clip.addEventListener("loadedmetadata", paint);
  clip.addEventListener("canplay", paint);
  clip.addEventListener(
    "error",
    () => {
      if (seq !== peekSeq) return;
      stop();
      setWait("片子没能打开");
    },
    { once: true }
  );
}

let peekList = [];
let peekIndex = -1;
let peekClosing = false;
let lastWheel = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let panDrag = null;

function imagePeek() {
  if (!body.classList.contains("is-peek") || peekClosing) return false;
  const frame = document.querySelector(".peek-frame");
  const img = document.getElementById("peek-img");
  return Boolean(frame && img && !frame.classList.contains("has-video") && !img.hidden);
}

function applyZoom() {
  const { frame, img } = peekEls();
  if (!frame || !img) return;
  const on = zoom > 1.001 && !frame.classList.contains("has-video");
  frame.classList.toggle("is-zoom", on && body.classList.contains("is-peek") && !peekClosing);
  frame.classList.toggle("is-panning", Boolean(on && panDrag));
  img.style.transform = on ? `translate(${panX}px, ${panY}px) scale(${zoom})` : "";
}

function clampPan() {
  const frame = document.querySelector(".peek-frame");
  if (!frame || zoom <= 1) {
    panX = 0;
    panY = 0;
    return;
  }
  const rect = frame.getBoundingClientRect();
  const maxX = (rect.width * (zoom - 1)) / 2;
  const maxY = (rect.height * (zoom - 1)) / 2;
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}

function resetZoom() {
  zoom = 1;
  panX = 0;
  panY = 0;
  panDrag = null;
  applyZoom();
}

function zoomAt(clientX, clientY, next) {
  const frame = document.querySelector(".peek-frame");
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  const qx = inside ? clientX - rect.left - rect.width / 2 : 0;
  const qy = inside ? clientY - rect.top - rect.height / 2 : 0;
  const z = Math.min(4, Math.max(1, next));
  if (z <= 1) {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyZoom();
    return;
  }
  const k = z / zoom;
  panX = qx * (1 - k) + panX * k;
  panY = qy * (1 - k) + panY * k;
  zoom = z;
  clampPan();
  applyZoom();
}

function neighbors(originEl) {
  const strip = originEl?.closest(".works-strip");
  const list = strip
    ? [...strip.querySelectorAll(".dot-work")].filter((el) => el.dataset.peekSrc)
    : [];
  return list.length ? list : [originEl];
}

function syncArrows() {
  const prev = document.querySelector(".peek-prev");
  const next = document.querySelector(".peek-next");
  if (!prev || !next) return;
  const live = body.classList.contains("is-peek") && !peekClosing && peekList.length > 1;
  prev.hidden = !live || peekIndex <= 0;
  next.hidden = !live || peekIndex < 0 || peekIndex >= peekList.length - 1;
}

function markOrigin(originEl) {
  document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
  originEl.classList.add("is-zooming");
  peekFrom = originEl;
}

function mountMedia(src, caption, originEl, isVideo, seq, flyFrom) {
  resetZoom();
  const { frame, img, video, cap } = peekEls();
  cap.textContent = caption || "";
  cap.style.opacity = flyFrom ? "0" : "1";
  frame.classList.toggle("has-video", isVideo);
  img.hidden = isVideo;
  video.hidden = true;
  if (isVideo) {
    img.src = "";
    let clip = originEl.querySelector("video") || video;
    if (clip.dataset.src && !clip.getAttribute("src")) {
      clip.preload = "auto";
      clip.src = clip.dataset.src;
    }
    if (clip === video) {
      video.hidden = false;
      video.preload = "auto";
      video.src = src;
      video.load();
    } else {
      const from = originRect(originEl);
      if (from) holdPlate(originEl, from);
      borrowed = clip;
      frame.insertBefore(clip, cap);
    }
    bindPeekClip(clip);
    const fit = () => {
      if (seq !== peekSeq) return;
      placePeekFrame(frame, peekTarget(clip), !flyFrom);
    };
    if (flyFrom) placePeekFrame(frame, flyFrom, false);
    if (clip.videoWidth) fit();
    else clip.addEventListener("loadedmetadata", fit, { once: true });
    requestAnimationFrame(fit);
    playWhenReady(clip, seq);
    peekBusy = false;
    return;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();
  img.alt = caption || "作品";
  const shown = originEl?.querySelector("img");
  const preview = shown?.currentSrc || "";
  const ready = Boolean(preview && shown.complete && shown.naturalWidth);
  const aspectW = ready ? shown.naturalWidth : flyFrom?.width || 3;
  const aspectH = ready ? shown.naturalHeight : flyFrom?.height || 2;
  const target = frameFor(aspectW, aspectH);
  const phone = isCoarse();
  img.src = ready ? preview : src;
  const show = (rect, animate) => {
    if (seq !== peekSeq) return;
    placePeekFrame(frame, rect, animate);
    cap.style.opacity = "1";
    peekBusy = false;
  };
  if (phone || !flyFrom) show(target, false);
  else {
    placePeekFrame(frame, flyFrom, false);
    requestAnimationFrame(() => requestAnimationFrame(() => show(target, true)));
  }
  if (ready && src && !sameURL(src, preview)) {
    const full = new Image();
    full.onload = () => {
      if (seq !== peekSeq) return;
      img.src = full.src;
      show(frameFor(full.naturalWidth, full.naturalHeight), false);
    };
    full.src = src;
    return;
  }
  if (ready) return;
  const placeLoaded = () => {
    if (seq !== peekSeq) return;
    setWait("");
    show(peekTarget(img), !phone);
  };
  if (mediaReady(img, false)) placeLoaded();
  else {
    img.addEventListener("load", placeLoaded, { once: true });
    img.addEventListener(
      "error",
      () => {
        if (seq !== peekSeq) return;
        setWait("图片没能打开");
      },
      { once: true },
    );
  }
}

export function openPeek(src, caption, originEl, isVideo = false) {
  if (body.classList.contains("is-peek")) return;
  const from = originRect(originEl);
  if (!from) return;
  const { peek } = peekEls();
  const seq = ++peekSeq;
  peekBusy = true;
  peekClosing = false;
  peekList = neighbors(originEl);
  peekIndex = Math.max(0, peekList.indexOf(originEl));
  markOrigin(originEl);
  body.classList.add("is-peek");
  peek.hidden = false;
  peek.classList.add("is-open", "is-on");
  syncArrows();
  mountMedia(src, caption, originEl, isVideo, seq, from);
}

export function stepPeek(dir) {
  if (!body.classList.contains("is-peek") || peekClosing) return false;
  const next = peekIndex + (dir < 0 ? -1 : 1);
  if (next < 0 || next >= peekList.length) return false;
  const originEl = peekList[next];
  const seq = ++peekSeq;
  peekIndex = next;
  peekBusy = true;
  restoreClip();
  markOrigin(originEl);
  syncArrows();
  mountMedia(
    originEl.dataset.peekSrc,
    originEl.dataset.peekName || "",
    originEl,
    originEl.dataset.peekVideo === "1",
    seq,
    null,
  );
  return true;
}

document.querySelector(".peek-prev")?.addEventListener("click", (event) => {
  event.stopPropagation();
  stepPeek(-1);
});
document.querySelector(".peek-next")?.addEventListener("click", (event) => {
  event.stopPropagation();
  stepPeek(1);
});

window.addEventListener(
  "wheel",
  (event) => {
    if (!body.classList.contains("is-peek") || peekClosing) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const line = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const dy = event.deltaY * line;
    if (!dy) return;
    if (imagePeek()) {
      zoomAt(event.clientX, event.clientY, zoom * Math.exp(-dy * 0.0022));
      return;
    }
    if (Math.abs(dy) < 12) return;
    const now = performance.now();
    if (now - lastWheel < 240) return;
    if (!stepPeek(dy > 0 ? 1 : -1)) return;
    lastWheel = now;
  },
  { passive: false },
);

window.addEventListener("pointerdown", (event) => {
  if (zoom <= 1.001 || !imagePeek() || event.button !== 0) return;
  if (event.target.closest(".peek-arrow")) return;
  const frame = document.querySelector(".peek-frame");
  if (!frame || (event.target !== frame && !frame.contains(event.target))) return;
  panDrag = { x: event.clientX, y: event.clientY, panX, panY, moved: false };
  applyZoom();
  event.preventDefault();
});

window.addEventListener("pointermove", (event) => {
  if (!panDrag) return;
  const dx = event.clientX - panDrag.x;
  const dy = event.clientY - panDrag.y;
  if (dx * dx + dy * dy > 9) panDrag.moved = true;
  panX = panDrag.panX + dx;
  panY = panDrag.panY + dy;
  clampPan();
  applyZoom();
});

window.addEventListener("pointerup", () => {
  if (!panDrag) return;
  const moved = panDrag.moved;
  panDrag = null;
  applyZoom();
  if (!moved) return;
  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.removeEventListener("click", stop, true);
  };
  window.addEventListener("click", stop, true);
});

export function closePeek() {
  if (!body.classList.contains("is-peek")) return;
  resetZoom();
  const { peek, frame, img, video, cap } = peekEls();
  const seq = ++peekSeq;
  const back = originRect(peekFrom);
  peekBusy = true;
  peekClosing = true;
  syncArrows();
  cap.style.opacity = "0";
  peek.classList.remove("is-on");
  setWait("");
  if (borrowed) borrowed.pause();
  else video.pause();
  const finish = () => {
    if (seq !== peekSeq) return;
    peek.classList.remove("is-open", "is-on");
    peek.hidden = true;
    body.classList.remove("is-peek");
    document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
    restoreClip();
    peekFrom = null;
    peekList = [];
    peekIndex = -1;
    peekBusy = false;
    peekClosing = false;
    syncArrows();
    resetPeekFrame(frame, img, video);
  };
  if (back) {
    placePeekFrame(frame, back, true);
    window.setTimeout(finish, 500);
  } else {
    window.setTimeout(finish, 80);
  }
}
