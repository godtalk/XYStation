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

function peekTarget(el) {
  const { w: nw, h: nh } = mediaSize(el);
  const maxW = innerWidth * 0.9;
  const maxH = innerHeight * 0.82;
  const s = Math.min(maxW / nw, maxH / nh);
  const w = nw * s;
  const h = nh * s;
  return {
    left: (innerWidth - w) / 2,
    top: (innerHeight - h) / 2,
    width: w,
    height: h,
  };
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
  frame.classList.remove("has-video");
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
  if (flyFrom) placePeekFrame(frame, flyFrom, false);
  img.src = src;
  const run = () => {
    if (seq !== peekSeq) return;
    const fit = () => {
      if (seq !== peekSeq) return;
      placePeekFrame(frame, peekTarget(img), true);
      cap.style.opacity = "1";
      peekBusy = false;
    };
    if (flyFrom) {
      placePeekFrame(frame, flyFrom, false);
      requestAnimationFrame(() => requestAnimationFrame(fit));
      return;
    }
    fit();
  };
  if (mediaReady(img, false)) run();
  else img.addEventListener("load", run, { once: true });
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
    if (Math.abs(dy) < 12) return;
    const now = performance.now();
    if (now - lastWheel < 240) return;
    if (!stepPeek(dy > 0 ? 1 : -1)) return;
    lastWheel = now;
  },
  { passive: false },
);

export function closePeek() {
  if (!body.classList.contains("is-peek")) return;
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
