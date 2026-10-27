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

function playWhenReady(clip, seq) {
  const go = () => {
    if (seq !== peekSeq) return;
    setWait("");
    clip.play().catch(() => {});
  };
  if (clip.error) {
    setWait("片子没能打开");
    return;
  }
  if (clip.readyState >= 3) {
    go();
    return;
  }
  setWait("片子进站加载中");
  clip.addEventListener("canplay", go, { once: true });
  clip.addEventListener(
    "error",
    () => {
      if (seq !== peekSeq) return;
      setWait("片子没能打开");
    },
    { once: true }
  );
}

export function openPeek(src, caption, originEl, isVideo = false) {
  if (body.classList.contains("is-peek")) return;
  const from = originRect(originEl);
  if (!from) return;
  const { peek, frame, img, video, cap } = peekEls();
  const seq = ++peekSeq;
  peekBusy = true;
  peekFrom = originEl;
  document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
  originEl.classList.add("is-zooming");
  cap.textContent = caption || "";
  cap.style.opacity = "0";
  frame.classList.toggle("has-video", isVideo);
  img.hidden = isVideo;
  video.hidden = true;
  if (isVideo) {
    img.src = "";
    const clip = originEl.querySelector("video") || video;
    if (clip === video) {
      video.hidden = false;
      video.preload = "auto";
      video.src = src;
      video.load();
    } else {
      holdPlate(originEl, from);
      borrowed = clip;
      frame.insertBefore(clip, cap);
    }
    bindPeekClip(clip);
    body.classList.add("is-peek");
    peek.hidden = false;
    peek.classList.add("is-open", "is-on");
    placePeekFrame(frame, from, false);
    const fit = () => {
      if (seq !== peekSeq) return;
      placePeekFrame(frame, peekTarget(clip), false);
    };
    if (clip.videoWidth) fit();
    else clip.addEventListener("loadedmetadata", fit, { once: true });
    requestAnimationFrame(fit);
    playWhenReady(clip, seq);
    cap.style.opacity = "1";
    peekBusy = false;
    return;
  }
  video.pause();
  video.removeAttribute("src");
  img.alt = caption || "作品";
  img.src = src;
  const media = img;
  const run = () => {
    if (seq !== peekSeq) return;
    body.classList.add("is-peek");
    peek.hidden = false;
    peek.classList.add("is-open", "is-on");
    placePeekFrame(frame, from, false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (seq !== peekSeq) return;
        placePeekFrame(frame, peekTarget(img), true);
        window.setTimeout(() => {
          if (seq !== peekSeq) return;
          cap.style.opacity = "1";
          peekBusy = false;
        }, 480);
      });
    });
  };
  if (mediaReady(media, false)) run();
  else media.addEventListener("load", run, { once: true });
}

export function closePeek() {
  if (!body.classList.contains("is-peek")) return;
  const { peek, frame, img, video, cap } = peekEls();
  const seq = ++peekSeq;
  const back = originRect(peekFrom);
  peekBusy = true;
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
    peekBusy = false;
    resetPeekFrame(frame, img, video);
  };
  if (back) {
    placePeekFrame(frame, back, true);
    window.setTimeout(finish, 500);
  } else {
    window.setTimeout(finish, 80);
  }
}
