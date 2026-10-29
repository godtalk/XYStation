import { cam, runtime } from "state";
import { clamp, NOISE_SEED } from "util";

const canvas = document.getElementById("cloud");
const gl = canvas?.getContext("webgl", {
  alpha: true,
  premultipliedAlpha: false,
  antialias: false,
  depth: true,
});

const DEPTH_VERT = `
attribute vec3 aPos;
uniform float uYaw;
uniform vec2 uLook;
uniform float uAspect;
void main() {
  float c = cos(uYaw);
  float s = sin(uYaw);
  vec3 p = vec3(aPos.x * c + aPos.z * s, -aPos.y, -aPos.x * s + aPos.z * c);
  gl_Position = vec4(p.x * 0.29 / uAspect + uLook.x, p.y * 0.29 + 0.4 + uLook.y, -p.z * 0.85, 1.0);
}
`;

const DEPTH_FRAG = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.0);
}
`;

const VERT = `
attribute vec3 aPos;
attribute float aSeed;
uniform float uYaw;
uniform float uTime;
uniform vec2 uLook;
uniform float uSize;
uniform float uAspect;
uniform float uScatter;
uniform float uFit;
uniform vec2 uShift;
uniform vec2 uDrift;
void main() {
  float c = cos(uYaw);
  float s = sin(uYaw);
  vec3 p = vec3(aPos.x * c + aPos.z * s, -aPos.y, -aPos.x * s + aPos.z * c);
  float wob = sin(uTime * 1.7 + aSeed * 6.28318);
  float wob2 = cos(uTime * 1.25 + aSeed * 11.3);
  p += vec3(wob, wob2, sin(aSeed * 4.2 + uTime * 1.4)) * 0.0032;
  float ang = aSeed * 6.28318;
  float ang2 = fract(aSeed * 13.37) * 6.28318;
  float reach = 0.12 + fract(aSeed * 7.91) * 0.55;
  vec2 fly = vec2(cos(ang), sin(ang2)) * reach * uScatter;
  float driftLen = length(uDrift);
  float spread = uScatter;
  if (driftLen > 0.001) {
    vec2 dir = uDrift / driftLen;
    float along = 0.72 + fract(aSeed * 9.17) * 0.7;
    float side = (fract(aSeed * 3.17) - 0.5) * 0.34;
    fly = (dir * along + vec2(-dir.y, dir.x) * side) * driftLen;
    spread = min(driftLen, 1.0);
  }
  float fit = max(uFit, 0.08);
  gl_Position = vec4(p.x * 0.29 * fit / uAspect + uLook.x + fly.x + uShift.x, p.y * 0.29 * fit + 0.4 + uLook.y + fly.y + uShift.y, 0.0, 1.0);
  gl_PointSize = uSize * clamp(max(fit, 0.42), 0.42, 2.1) * mix(1.0, 0.62, spread);
}
`;

const FRAG = `
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  if (dot(d, d) > 0.2) discard;
  gl_FragColor = vec4(uColor, uAlpha);
}
`;

const cloud = {
  program: null,
  depthProgram: null,
  buffer: null,
  shell: null,
  count: 0,
  shellCount: 0,
  aPos: -1,
  aN1: -1,
  aN2: -1,
  aSeed: -1,
  yaw: null,
  time: null,
  look: null,
  aspect: null,
  scatter: null,
  size: null,
  color: null,
  alpha: null,
  fit: null,
  shift: null,
  depthYaw: null,
  depthLook: null,
  depthAspect: null,
  depthPos: -1,
};

let tintKey = "";
let tint = [0.87, 0.9, 0.93];

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function init() {
  if (!gl || cloud.program) return;
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  cloud.program = program;
  cloud.buffer = gl.createBuffer();
  cloud.aPos = gl.getAttribLocation(program, "aPos");
  cloud.aN1 = gl.getAttribLocation(program, "aN1");
  cloud.aN2 = gl.getAttribLocation(program, "aN2");
  cloud.aSeed = gl.getAttribLocation(program, "aSeed");
  cloud.yaw = gl.getUniformLocation(program, "uYaw");
  cloud.time = gl.getUniformLocation(program, "uTime");
  cloud.look = gl.getUniformLocation(program, "uLook");
  cloud.aspect = gl.getUniformLocation(program, "uAspect");
  cloud.scatter = gl.getUniformLocation(program, "uScatter");
  cloud.size = gl.getUniformLocation(program, "uSize");
  cloud.color = gl.getUniformLocation(program, "uColor");
  cloud.alpha = gl.getUniformLocation(program, "uAlpha");
  cloud.fit = gl.getUniformLocation(program, "uFit");
  cloud.shift = gl.getUniformLocation(program, "uShift");
  cloud.drift = gl.getUniformLocation(program, "uDrift");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const dvs = compile(gl.VERTEX_SHADER, DEPTH_VERT);
  const dfs = compile(gl.FRAGMENT_SHADER, DEPTH_FRAG);
  if (!dvs || !dfs) return;
  const depth = gl.createProgram();
  gl.attachShader(depth, dvs);
  gl.attachShader(depth, dfs);
  gl.linkProgram(depth);
  if (!gl.getProgramParameter(depth, gl.LINK_STATUS)) return;
  cloud.depthProgram = depth;
  cloud.shell = gl.createBuffer();
  cloud.depthPos = gl.getAttribLocation(depth, "aPos");
  cloud.depthYaw = gl.getUniformLocation(depth, "uYaw");
  cloud.depthLook = gl.getUniformLocation(depth, "uLook");
  cloud.depthAspect = gl.getUniformLocation(depth, "uAspect");
}

function parseColor(input) {
  const c = (input || "").trim();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
    const v = Number.parseInt(h, 16);
    if (!Number.isFinite(v)) return tint;
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  }
  const m = c.match(/[\d.]+/g);
  if (!m || m.length < 3) return tint;
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
}

function syncTint() {
  const key = document.documentElement.dataset.theme || "dark";
  if (key === tintKey) return;
  tintKey = key;
  const dust = getComputedStyle(document.documentElement).getPropertyValue("--dust");
  tint = parseColor(dust);
}

function sampleCloud(text) {
  const xyz = [];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const faces = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) {
      const part = line.trim().split(/\s+/);
      const x = Number(part[1]);
      const y = Number(part[2]);
      const z = Number(part[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      xyz.push(x, y, z);
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
      continue;
    }
    if (!line.startsWith("f ")) continue;
    const ids = [];
    for (const token of line.trim().split(/\s+/).slice(1)) {
      const n = Number(token.split("/")[0]);
      if (!Number.isFinite(n) || n === 0) continue;
      ids.push(n < 0 ? xyz.length / 3 + n : n - 1);
    }
    for (let k = 1; k < ids.length - 1; k += 1) faces.push(ids[0], ids[k], ids[k + 1]);
  }
  const count = xyz.length / 3;
  if (!count || !faces.length) return null;
  const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
  const inv = 1.15 / span;
  const cx = (min[0] + max[0]) * 0.5;
  const cy = (min[1] + max[1]) * 0.5;
  const cz = (min[2] + max[2]) * 0.5;
  for (let i = 0; i < xyz.length; i += 3) {
    xyz[i] = (xyz[i] - cx) * inv;
    xyz[i + 1] = (xyz[i + 1] - cy) * inv;
    xyz[i + 2] = (xyz[i + 2] - cz) * inv;
  }
  const weld = new Map();
  const remap = new Array(count);
  const welded = [];
  for (let i = 0; i < count; i += 1) {
    const key = `${Math.round(xyz[i * 3] * 8000)},${Math.round(xyz[i * 3 + 1] * 8000)},${Math.round(xyz[i * 3 + 2] * 8000)}`;
    let id = weld.get(key);
    if (id === undefined) {
      id = welded.length / 3;
      weld.set(key, id);
      welded.push(xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]);
    }
    remap[i] = id;
  }
  const tris = [];
  for (let i = 0; i < faces.length; i += 3) {
    const a = remap[faces[i]];
    const b = remap[faces[i + 1]];
    const c = remap[faces[i + 2]];
    if (a === b || b === c || c === a) continue;
    tris.push(a, b, c);
  }
  const xyzW = welded;
  const areas = [];
  let areaSum = 0;
  const normals = [];
  const edgeFaces = new Map();
  const link = (ia, ib, face) => {
    if (ia === ib) return;
    const i = ia < ib ? ia : ib;
    const j = ia < ib ? ib : ia;
    const key = `${i},${j}`;
    let list = edgeFaces.get(key);
    if (!list) {
      list = [];
      edgeFaces.set(key, list);
    }
    if (list.length < 2) list.push(face);
  };
  for (let i = 0; i < tris.length; i += 3) {
    const a = tris[i] * 3;
    const b = tris[i + 1] * 3;
    const c = tris[i + 2] * 3;
    const abx = xyzW[b] - xyzW[a];
    const aby = xyzW[b + 1] - xyzW[a + 1];
    const abz = xyzW[b + 2] - xyzW[a + 2];
    const acx = xyzW[c] - xyzW[a];
    const acy = xyzW[c + 1] - xyzW[a + 1];
    const acz = xyzW[c + 2] - xyzW[a + 2];
    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    normals.push(nx / nl, ny / nl, nz / nl);
    const area = 0.5 * nl;
    areas.push(area);
    areaSum += area;
    const face = i / 3;
    link(tris[i], tris[i + 1], face);
    link(tris[i + 1], tris[i + 2], face);
    link(tris[i + 2], tris[i], face);
  }
  const pts = [];
  let salt = (Math.abs(Math.floor(NOISE_SEED * 16807)) % 2147483646) + 1;
  const rnd = () => {
    salt = (salt * 16807) % 2147483647;
    return (salt - 1) / 2147483646;
  };
  const step = 0.0048;
  edgeFaces.forEach((list, key) => {
    let keep = list.length < 2;
    if (!keep) {
      const f0 = list[0] * 3;
      const f1 = list[1] * 3;
      const dot = normals[f0] * normals[f1] + normals[f0 + 1] * normals[f1 + 1] + normals[f0 + 2] * normals[f1 + 2];
      keep = dot < 0.9;
    }
    if (!keep) return;
    const [ia, ib] = key.split(",").map(Number);
    const a = ia * 3;
    const b = ib * 3;
    const len = Math.hypot(xyzW[a] - xyzW[b], xyzW[a + 1] - xyzW[b + 1], xyzW[a + 2] - xyzW[b + 2]);
    if (len < step * 0.55) return;
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k += 1) {
      const t = (k + 0.5) / n;
      pts.push(
        xyzW[a] + (xyzW[b] - xyzW[a]) * t,
        xyzW[a + 1] + (xyzW[b + 1] - xyzW[a + 1]) * t,
        xyzW[a + 2] + (xyzW[b + 2] - xyzW[a + 2]) * t,
        rnd(),
      );
    }
  });
  const FILL_N = 9000;
  if (areaSum > 0) {
    for (let i = 0; i < areas.length; i += 1) {
      const n = Math.round((areas[i] / areaSum) * FILL_N);
      if (!n) continue;
      const a = tris[i * 3] * 3;
      const b = tris[i * 3 + 1] * 3;
      const c = tris[i * 3 + 2] * 3;
      for (let k = 0; k < n; k += 1) {
        let u = rnd();
        let v = rnd();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        const w = 1 - u - v;
        pts.push(
          xyzW[a] * w + xyzW[b] * u + xyzW[c] * v,
          xyzW[a + 1] * w + xyzW[b + 1] * u + xyzW[c + 1] * v,
          xyzW[a + 2] * w + xyzW[b + 2] * u + xyzW[c + 2] * v,
          rnd(),
        );
      }
    }
  }
  const mesh = new Float32Array(tris.length * 3);
  for (let i = 0; i < tris.length; i += 1) {
    const v = tris[i] * 3;
    mesh[i * 3] = xyzW[v];
    mesh[i * 3 + 1] = xyzW[v + 1];
    mesh[i * 3 + 2] = xyzW[v + 2];
  }
  return { pts: new Float32Array(pts), mesh };
}

function decimate(pts, keep) {
  const n = Math.floor(pts.length / 4);
  const want = Math.max(1, Math.round(n * keep));
  const out = new Float32Array(want * 4);
  for (let i = 0; i < want; i += 1) {
    const src = Math.min(n - 1, Math.floor((i * n) / want)) * 4;
    out[i * 4] = pts[src];
    out[i * 4 + 1] = pts[src + 1];
    out[i * 4 + 2] = pts[src + 2];
    out[i * 4 + 3] = pts[src + 3];
  }
  return out;
}

const riders = [];

export function mountPointClouds(list) {
  riders.length = 0;
  (list || []).forEach((item) => riders.push(item));
}

function windowVis(at, until) {
  const t = cam.progress;
  if (t < at || t > until) return 0;
  const span = Math.max(0.001, until - at);
  const edge = Math.min(0.28, span * 0.32);
  const into = Math.min(t - at, until - t);
  if (into >= edge) return 1;
  const u = into / edge;
  return u * u * (3 - 2 * u);
}

export function loadPointModel(url) {
  if (!gl) return Promise.resolve();
  init();
  if (!cloud.program) return Promise.resolve();
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("obj");
      return res.text();
    })
    .then((text) => {
      const built = sampleCloud(text);
      if (!built?.pts.length) return;
      cloud.count = built.pts.length / 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, cloud.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, built.pts, gl.STATIC_DRAW);
      const thin = decimate(built.pts, 0.62);
      cloud.thinCount = thin.length / 4;
      if (!cloud.thin) cloud.thin = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cloud.thin);
      gl.bufferData(gl.ARRAY_BUFFER, thin, gl.STATIC_DRAW);
      modelReadyAt = performance.now();
      if (cloud.shell && built.mesh.length) {
        cloud.shellCount = built.mesh.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, cloud.shell);
        gl.bufferData(gl.ARRAY_BUFFER, built.mesh, gl.STATIC_DRAW);
      }
    })
    .catch(() => {});
}

export function resizePoints() {
  if (!canvas) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
}

let pointsAsleep = false;

function bindCloud(buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(cloud.aPos);
  gl.vertexAttribPointer(cloud.aPos, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(cloud.aSeed);
  gl.vertexAttribPointer(cloud.aSeed, 1, gl.FLOAT, false, 16, 12);
}

function drawBatch(buffer, count, yaw, scatter, alpha, fit, shiftX, shiftY, now, driftX = 0, driftY = 0) {
  if (!buffer || !count || alpha < 0.02) return;
  bindCloud(buffer);
  gl.uniform1f(cloud.yaw, yaw);
  gl.uniform1f(cloud.time, (now || 0) / 1000);
  gl.uniform1f(cloud.scatter, scatter);
  gl.uniform1f(cloud.alpha, alpha);
  gl.uniform1f(cloud.fit, fit);
  gl.uniform2f(cloud.shift, shiftX, shiftY);
  gl.uniform2f(cloud.drift, driftX, driftY);
  gl.drawArrays(gl.POINTS, 0, count);
}

let modelReadyAt = 0;

function tankHold(now) {
  const bootForm = runtime.ready
    ? 1 - clamp((cam.progress - 0.06) / 2.05, 0, 1)
    : clamp(runtime.boot, 0, 1);
  const bootHold = bootForm * bootForm * (3 - 2 * bootForm);
  if (!modelReadyAt) return 0;
  const arrived = clamp(((now || 0) - modelReadyAt) / 1400, 0, 1);
  const arriveHold = arrived * arrived * (3 - 2 * arrived);
  return Math.min(bootHold, arriveHold);
}

export function drawPoints(now) {
  if (!gl || !cloud.program || !cloud.count) return;
  const hold = tankHold(now);
  const scatter = 1 - hold;
  const fade = clamp((cam.progress - 1.6) / 2.4, 0, 1);
  const vis = 1 - fade * fade * (3 - 2 * fade);
  let riderOn = false;
  for (let i = 0; i < riders.length; i += 1) {
    if (windowVis(riders[i].at, riders[i].until) > 0.02) riderOn = true;
  }
  if (vis < 0.02 && !riderOn) {
    if (!pointsAsleep) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      canvas.classList.add("is-off");
      pointsAsleep = true;
    }
    return;
  }
  if (pointsAsleep) {
    canvas.classList.remove("is-off");
    pointsAsleep = false;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  syncTint();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const lookX = cam.lookX * 0.045;
  const lookY = cam.lookY * -0.03;
  const aspect = canvas.height > 0 ? canvas.width / canvas.height : 1;
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(cloud.program);
  gl.uniform2f(cloud.look, lookX, lookY);
  gl.uniform1f(cloud.aspect, aspect);
  gl.uniform1f(cloud.size, Math.max(1.26, 1.68 * dpr));
  gl.uniform3f(cloud.color, tint[0], tint[1], tint[2]);
  if (vis >= 0.02) {
    drawBatch(
      cloud.buffer,
      cloud.count,
      tankYaw(now),
      scatter,
      0.7 * (1 - scatter * 0.55) * vis,
      1,
      0,
      0,
      now,
    );
  }
  const thin = cloud.thin || cloud.buffer;
  const thinCount = cloud.thinCount || Math.round(cloud.count * 0.62);
  for (let i = 0; i < riders.length; i += 1) {
    const item = riders[i];
    const v = windowVis(item.at, item.until);
    if (v < 0.02) continue;
    const shift = item.shift || [0, 0];
    drawBatch(
      thin,
      thinCount,
      (item.yaw || 0) + (now || 0) / 1000 * 0.12,
      0,
      0.5 * v,
      item.fit || 0.68,
      shift[0],
      shift[1],
      now,
    );
  }
}

let spin = 0.85;
let spinClock = 0;
let spinVel = 0;
let dragging = false;
let dragX = 0;
let dragPointer = -1;

function tankBox() {
  const aspect = innerHeight > 0 ? innerWidth / innerHeight : 1;
  const lookX = cam.lookX * 0.045;
  const lookY = cam.lookY * -0.03;
  return {
    x: innerWidth * (0.5 + lookX * 0.5),
    y: innerHeight * (1 - (0.4 + lookY)) * 0.5,
    hw: (0.72 * 0.29 / aspect) * innerWidth * 0.5 + 28,
    hh: 0.72 * 0.29 * innerHeight * 0.5 + 24,
  };
}

function overTank(x, y) {
  if (!runtime.ready || cam.progress > 0.9 || !cloud.count) return false;
  const box = tankBox();
  return Math.abs(x - box.x) <= box.hw && Math.abs(y - box.y) <= box.hh;
}

function interactiveTarget(event) {
  const el = event.target instanceof Element ? event.target : null;
  return !!el?.closest("button, a, input, textarea, .rail, .peek");
}

function tankYaw(now) {
  const t = (now || 0) / 1000;
  if (!dragging) {
    const dt = spinClock ? Math.min(0.05, t - spinClock) : 0;
    spin += dt * 0.12 + spinVel;
    spinVel *= 0.94 ** (dt * 60);
    if (Math.abs(spinVel) < 0.00004) spinVel = 0;
  }
  spinClock = t;
  return spin;
}

if (canvas) {
  window.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || interactiveTarget(event) || !overTank(event.clientX, event.clientY)) return;
    dragging = true;
    dragPointer = event.pointerId;
    dragX = event.clientX;
    spinVel = 0;
    document.documentElement.style.cursor = "grabbing";
  });
  window.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragPointer) {
      if (!dragging && overTank(event.clientX, event.clientY) && !interactiveTarget(event)) {
        document.documentElement.style.cursor = "grab";
      } else if (!dragging && document.documentElement.style.cursor.startsWith("grab")) {
        document.documentElement.style.cursor = "";
      }
      return;
    }
    const dx = event.clientX - dragX;
    dragX = event.clientX;
    const step = -dx * 0.01;
    spin += step;
    spinVel = step;
  });
  const endDrag = (event) => {
    if (!dragging || event.pointerId !== dragPointer) return;
    dragging = false;
    dragPointer = -1;
    spinClock = performance.now() / 1000;
    document.documentElement.style.cursor = overTank(event.clientX, event.clientY) ? "grab" : "";
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  window.addEventListener(
    "touchmove",
    (event) => {
      if (!dragging) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    { capture: true, passive: false },
  );
}
