import { THEMES } from "./data.js?v=glow15";
import { refreshVortex } from "./vortex.js?v=glow15";

const KEY = "xystation-theme";
const CSS_MAP = {
  paper: "--paper",
  ink: "--ink",
  muted: "--muted",
  line: "--line",
  accent: "--accent",
  glowSpot: "--glow-spot",
  glowMid: "--glow-mid",
  vignetteMid: "--vignette-mid",
  vignetteEdge: "--vignette-edge",
  vignetteIn: "--vignette-in",
  vignetteMidStop: "--vignette-mid-stop",
  holoFill: "--holo-fill",
  railFill: "--rail-fill",
  plateFill: "--plate-fill",
  onPhoto: "--on-photo",
  dust: "--dust",
  dustStroke: "--dust-stroke",
  titleDust: "--title-dust",
  titleScale: "--title-scale",
  grainOpacity: "--grain-opacity",
  blend: "--hud-blend",
};

export function themeNow() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(mode) {
  const next = mode === "light" ? "light" : "dark";
  const pack = THEMES[next] || THEMES.dark;
  const root = document.documentElement;
  root.dataset.theme = next;
  Object.entries(CSS_MAP).forEach(([key, cssVar]) => {
    if (pack[key] == null) return;
    root.style.setProperty(cssVar, pack[key]);
  });
  refreshVortex();
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore quota / private mode */
  }
  const btn = document.getElementById("theme");
  if (!btn) return;
  btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
  btn.setAttribute("aria-label", next === "dark" ? "当前暗色，切换亮色" : "当前亮色，切换暗色");
}

export function bindTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    saved = null;
  }
  applyTheme(saved === "light" ? "light" : "dark");
  document.getElementById("theme")?.addEventListener("click", () => {
    applyTheme(themeNow() === "dark" ? "light" : "dark");
  });
}
