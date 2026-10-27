import { cam } from "state";
import { THEMES } from "themes";
import { clamp, hash01, isCoarse, screenFit } from "util";

const ash = document.getElementById("ash");
const ashGl = ash.getContext("webgl", {
  alpha: true,
  premultipliedAlpha: false,
  antialias: false,
  depth: false,
});

const vortex = {
  segments: 0,
  count: 0,
  program: null,
  buffer: null,
  seedBuffer: null,
  origin: null,
  resolution: null,
  radius: null,
  time: null,
  vis: null,
  dpr: null,
};

// Flow field: CC BY-NC-SA 4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/
const VORTEX_VERT = `
precision mediump float;
attribute vec2 aUv;
attribute float aSeed;
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform float uRadius;
uniform float uTime;
uniform float uVis;
uniform float uDpr;
uniform float uScale;
uniform float uConeInner;
uniform float uConeOuter;
uniform float uSizeInner;
uniform float uSizeOuter;
uniform float uSizePow;
uniform float uPointMul;
uniform float uUseScale;
uniform float uPointMin;
uniform float uPointMax;
uniform float uReachAlpha;
varying float vAlpha;

vec2 flowStep(vec2 U, float i, float t, float ox) {
  return cos(cos(U * i + t) + cos(U.yx * i) + (ox + t) * i * i) / i / 9.0;
}

void main() {
  float beams = 15.0;
  float id = floor(aUv.y * beams);
  float across = clamp(fract(aUv.y * beams) + (fract(aSeed * 4.17) - 0.5) * 0.28, 0.0, 1.0);
  float along = fract(aUv.x + aSeed - uTime * 0.006);
  float heading = (id + 0.5) * 6.283185 / beams;
  float travel = mix(-2.21, 2.21, along);
  float fromCenter = clamp(abs(travel) / 2.21, 0.0, 1.0);
  float cone = mix(uConeInner, uConeOuter, fromCenter);
  float thick = (across - 0.5) * cone;
  vec2 dir = vec2(cos(heading), sin(heading));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 home = dir * travel + nrm * thick;
  vec2 u = home * 2.8;
  vec2 vel = vec2(0.0);
  float ox = 0.1 + id * 0.17;
  for (int k = 0; k < 8; k++) {
    float i = float(k) + 1.0;
    float t = uTime * 0.025 / i;
    vel += flowStep(u, i, t, ox) + flowStep(u.yx, i, t, ox);
    vec4 cs = cos(i + length(u) * 0.3 / i - t * 0.5 + vec4(0.0, 11.0, 33.0, 0.0));
    u = u * mat2(cs.x, cs.y, cs.z, cs.w);
    ox += cos(u.x + i + ox * 9.0 + t) / 4.0 / i;
  }
  vec2 flow = home + vel * 1.05;
  float rad = length(flow);
  float ang = atan(flow.y, flow.x);
  float falloff = exp(-rad * rad * 5.5);
  ang -= falloff * 5.0;
  vec2 p = vec2(cos(ang), sin(ang)) * rad * 1.2;
  float spin = -uTime * 0.1;
  float sc = cos(spin);
  float ss = sin(spin);
  p = vec2(sc * p.x - ss * p.y, ss * p.x + sc * p.y);
  float w = clamp(length(vel) * 6.0, 0.0, 1.6);
  float reach = smoothstep(0.0, 2.05, rad);
  float core = mix(0.7, 1.0, smoothstep(0.5, 0.05, abs(across - 0.5)));
  float ends = smoothstep(0.0, 0.07, along) * smoothstep(1.0, 0.93, along);
  vAlpha = core * ends * uVis * (0.21 + 0.44 * w) * (0.48 + 0.45 * aSeed) * mix(uReachAlpha, 1.0, reach);
  float sizeTaper = mix(uSizeInner, uSizeOuter, pow(reach, uSizePow));
  float grow = mix(1.0, uScale, uUseScale);
  gl_PointSize = clamp((1.25 + w * 2.2) * sizeTaper * uDpr * uPointMul * grow, uPointMin, uPointMax);
  vec2 screen = p * uRadius + uOrigin;
  gl_Position = vec4(
    screen.x / uResolution.x * 2.0,
    -screen.y / uResolution.y * 2.0,
    0.0,
    1.0
  );
}
`;

const VORTEX_FRAG = `
precision mediump float;
varying float vAlpha;
uniform vec3 uColor;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float soft = smoothstep(1.0, 0.15, d);
  gl_FragColor = vec4(uColor, vAlpha * soft);
}
`;

function themeName() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function themeLook() {
  return THEMES[themeName()] || THEMES.dark;
}

function themeRgb() {
  const raw = (themeLook().dust || "#ffffff").replace("#", "");
  if (raw.length === 6) {
    return [
      parseInt(raw.slice(0, 2), 16) / 255,
      parseInt(raw.slice(2, 4), 16) / 255,
      parseInt(raw.slice(4, 6), 16) / 255,
    ];
  }
  return [1, 1, 1];
}

function compileShader(type, source) {
  const shader = ashGl.createShader(type);
  ashGl.shaderSource(shader, source);
  ashGl.compileShader(shader);
  if (!ashGl.getShaderParameter(shader, ashGl.COMPILE_STATUS)) {
    ashGl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initVortex() {
  if (!ashGl) return;
  if (vortex.program && vortex.shaderRev === 7) return;
  if (vortex.program) {
    ashGl.deleteProgram(vortex.program);
    vortex.program = null;
  }
  const vert = compileShader(ashGl.VERTEX_SHADER, VORTEX_VERT);
  const frag = compileShader(ashGl.FRAGMENT_SHADER, VORTEX_FRAG);
  if (!vert || !frag) return;
  const program = ashGl.createProgram();
  ashGl.attachShader(program, vert);
  ashGl.attachShader(program, frag);
  ashGl.linkProgram(program);
  if (!ashGl.getProgramParameter(program, ashGl.LINK_STATUS)) return;
  vortex.program = program;
  vortex.buffer = ashGl.createBuffer();
  vortex.seedBuffer = ashGl.createBuffer();
  vortex.origin = ashGl.getUniformLocation(program, "uOrigin");
  vortex.resolution = ashGl.getUniformLocation(program, "uResolution");
  vortex.radius = ashGl.getUniformLocation(program, "uRadius");
  vortex.time = ashGl.getUniformLocation(program, "uTime");
  vortex.vis = ashGl.getUniformLocation(program, "uVis");
  vortex.dpr = ashGl.getUniformLocation(program, "uDpr");
  vortex.scale = ashGl.getUniformLocation(program, "uScale");
  vortex.color = ashGl.getUniformLocation(program, "uColor");
  vortex.coneInner = ashGl.getUniformLocation(program, "uConeInner");
  vortex.coneOuter = ashGl.getUniformLocation(program, "uConeOuter");
  vortex.sizeInner = ashGl.getUniformLocation(program, "uSizeInner");
  vortex.sizeOuter = ashGl.getUniformLocation(program, "uSizeOuter");
  vortex.sizePow = ashGl.getUniformLocation(program, "uSizePow");
  vortex.pointMul = ashGl.getUniformLocation(program, "uPointMul");
  vortex.useScale = ashGl.getUniformLocation(program, "uUseScale");
  vortex.pointMin = ashGl.getUniformLocation(program, "uPointMin");
  vortex.pointMax = ashGl.getUniformLocation(program, "uPointMax");
  vortex.reachAlpha = ashGl.getUniformLocation(program, "uReachAlpha");
  vortex.shaderRev = 7;
  vortex.aUv = ashGl.getAttribLocation(program, "aUv");
  vortex.aSeed = ashGl.getAttribLocation(program, "aSeed");
  ashGl.enable(ashGl.BLEND);
  ashGl.blendFunc(ashGl.SRC_ALPHA, ashGl.ONE_MINUS_SRC_ALPHA);
  ashGl.disable(ashGl.DEPTH_TEST);
}

function buildVortex() {
  if (!ashGl) return;
  initVortex();
  if (!vortex.program) return;
  const look = themeLook().vortex;
  const { density, short } = screenFit();
  const name = themeName();
  let segments;
  if (look.lockCount) {
    segments = Math.round(clamp(260 * clamp(density, 0.8, 1.05), look.segmentsMin, look.segmentsMax));
  } else {
    const span = short * 0.92;
    segments = Math.round(clamp((span / 1.55) * density, look.segmentsMin, look.segmentsMax));
  }
  if (isCoarse()) segments = Math.min(180, Math.round(segments * 0.65));
  if (vortex.segments === segments && vortex.lookKey === name) return;
  vortex.lookKey = name;
  vortex.segments = segments;
  const count = segments * segments;
  vortex.count = count;
  const uv = new Float32Array(count * 2);
  const seed = new Float32Array(count);
  let i = 0;
  for (let y = 0; y < segments; y += 1) {
    for (let x = 0; x < segments; x += 1) {
      const jx = (hash01(i * 2.17) - 0.5) * 0.35;
      const jy = (hash01(i * 3.91 + 8.2) - 0.5) * 0.2;
      uv[i * 2] = (x + 0.5 + jx) / segments;
      uv[i * 2 + 1] = (y + 0.5 + jy) / segments;
      seed[i] = hash01(i * 1.37 + 2.4);
      i += 1;
    }
  }
  ashGl.bindBuffer(ashGl.ARRAY_BUFFER, vortex.buffer);
  ashGl.bufferData(ashGl.ARRAY_BUFFER, uv, ashGl.STATIC_DRAW);
  ashGl.bindBuffer(ashGl.ARRAY_BUFFER, vortex.seedBuffer);
  ashGl.bufferData(ashGl.ARRAY_BUFFER, seed, ashGl.STATIC_DRAW);
}

export function resizeVortex() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ash.width = Math.round(innerWidth * dpr);
  ash.height = Math.round(innerHeight * dpr);
  ash.style.width = `${innerWidth}px`;
  ash.style.height = `${innerHeight}px`;
  if (ashGl) ashGl.viewport(0, 0, ash.width, ash.height);
  buildVortex();
}

let vortexAsleep = false;

export function drawVortex(now) {
  if (!ashGl || !vortex.program || !vortex.count) return;
  const fade = clamp((cam.progress - 0.2) / 3.4, 0, 1);
  const vis = 1 - fade * fade * (3 - 2 * fade);
  if (vis < 0.02) {
    if (!vortexAsleep) {
      ashGl.viewport(0, 0, ash.width, ash.height);
      ashGl.clearColor(0, 0, 0, 0);
      ashGl.clear(ashGl.COLOR_BUFFER_BIT);
      ash.classList.add("is-off");
      vortexAsleep = true;
    }
    return;
  }
  if (vortexAsleep) {
    ash.classList.remove("is-off");
    vortexAsleep = false;
  }
  ashGl.viewport(0, 0, ash.width, ash.height);
  ashGl.clearColor(0, 0, 0, 0);
  ashGl.clear(ashGl.COLOR_BUFFER_BIT);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ashGl.useProgram(vortex.program);
  ashGl.bindBuffer(ashGl.ARRAY_BUFFER, vortex.buffer);
  ashGl.enableVertexAttribArray(vortex.aUv);
  ashGl.vertexAttribPointer(vortex.aUv, 2, ashGl.FLOAT, false, 0, 0);
  ashGl.bindBuffer(ashGl.ARRAY_BUFFER, vortex.seedBuffer);
  ashGl.enableVertexAttribArray(vortex.aSeed);
  ashGl.vertexAttribPointer(vortex.aSeed, 1, ashGl.FLOAT, false, 0, 0);
  ashGl.uniform2f(vortex.resolution, ash.width, ash.height);
  ashGl.uniform2f(
    vortex.origin,
    cam.lookX * 36 * dpr,
    (innerHeight * -0.02 + cam.lookY * 24) * dpr,
  );
  const fit = screenFit();
  const radius = fit.short * 0.66 + (fit.long - fit.short) * 0.05;
  ashGl.uniform1f(vortex.radius, radius * dpr);
  ashGl.uniform1f(vortex.time, (now || 0) / 1000);
  ashGl.uniform1f(vortex.vis, vis);
  ashGl.uniform1f(vortex.dpr, dpr);
  ashGl.uniform1f(vortex.scale, clamp(fit.short / 1080, 0.72, 1.85));
  const look = themeLook().vortex;
  ashGl.uniform1f(vortex.coneInner, look.coneInner);
  ashGl.uniform1f(vortex.coneOuter, look.coneOuter);
  ashGl.uniform1f(vortex.sizeInner, look.sizeInner);
  ashGl.uniform1f(vortex.sizeOuter, look.sizeOuter);
  ashGl.uniform1f(vortex.sizePow, look.sizePow);
  ashGl.uniform1f(vortex.pointMul, look.pointMul);
  ashGl.uniform1f(vortex.useScale, look.useScale);
  ashGl.uniform1f(vortex.pointMin, look.pointMin);
  ashGl.uniform1f(vortex.pointMax, look.pointMax);
  ashGl.uniform1f(vortex.reachAlpha, look.reachAlpha);
  const rgb = themeRgb();
  ashGl.uniform3f(vortex.color, rgb[0], rgb[1], rgb[2]);
  ashGl.drawArrays(ashGl.POINTS, 0, vortex.count);
}

export function refreshVortex() {
  vortex.lookKey = "";
  buildVortex();
}
