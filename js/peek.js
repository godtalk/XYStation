const body = document.body;
const PEEK_EASE = "0.48s cubic-bezier(0.22, 1, 0.36, 1)";
let peekFrom = null;
let peekBusy = false;
let peekSeq = 0;

function peekEls() {
  return {
    peek: document.getElementById("peek"),
    frame: document.querySelector(".peek-frame"),
    img: document.getElementById("peek-img"),
    cap: document.getElementById("peek-cap"),
  };
}

function originRect(el) {
  const thumb = el?.querySelector("img");
  if (!thumb) return null;
  const r = thumb.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return r;
}

function peekTarget(img) {
  const nw = img.naturalWidth || 1600;
  const nh = img.naturalHeight || 1000;
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

function resetPeekFrame(frame, img) {
  frame.style.transition = "none";
  frame.style.left = "0px";
  frame.style.top = "0px";
  frame.style.width = "0px";
  frame.style.height = "0px";
  frame.style.transform = "none";
  img.src = "";
}

export function openPeek(src, caption, originEl) {
  if (body.classList.contains("is-peek")) return;
  const from = originRect(originEl);
  if (!from) return;
  const { peek, frame, img, cap } = peekEls();
  const seq = ++peekSeq;
  peekBusy = true;
  peekFrom = originEl;
  document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
  originEl.classList.add("is-zooming");
  cap.textContent = caption || "";
  cap.style.opacity = "0";
  img.alt = caption || "作品";
  img.src = src;
  body.classList.add("is-peek");
  const run = () => {
    if (seq !== peekSeq) return;
    placePeekFrame(frame, from, false);
    peek.hidden = false;
    peek.classList.add("is-open", "is-on");
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
  if (img.complete && img.naturalWidth) run();
  else img.addEventListener("load", run, { once: true });
}

export function closePeek() {
  if (!body.classList.contains("is-peek")) return;
  const { peek, frame, img, cap } = peekEls();
  const seq = ++peekSeq;
  const back = originRect(peekFrom);
  peekBusy = true;
  cap.style.opacity = "0";
  peek.classList.remove("is-on");
  const finish = () => {
    if (seq !== peekSeq) return;
    peek.classList.remove("is-open", "is-on");
    peek.hidden = true;
    body.classList.remove("is-peek");
    document.querySelectorAll(".dot-work.is-zooming").forEach((el) => el.classList.remove("is-zooming"));
    peekFrom = null;
    peekBusy = false;
    resetPeekFrame(frame, img);
  };
  if (back) {
    placePeekFrame(frame, back, true);
    window.setTimeout(finish, 500);
  } else {
    window.setTimeout(finish, 80);
  }
}
