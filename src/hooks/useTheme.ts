export type AppTheme = "dark" | "light" | "auto";

const STORAGE_KEY = "ghosteek-theme";
const THEME_FADE_MS = 420;

type ApplyThemeOptions = {
  /** Crossfade root when resolved theme changes. Default true. */
  animate?: boolean;
};

export function resolveTheme(theme: AppTheme): "dark" | "light" {
  if (theme === "auto") {
    const tgScheme = window.Telegram?.WebApp?.colorScheme;
    if (tgScheme === "light" || tgScheme === "dark") return tgScheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function forceMotionEnabled(): boolean {
  return document.documentElement.dataset.forceMotion === "1";
}

function setThemeAttributes(resolved: "dark" | "light", stored: AppTheme) {
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(STORAGE_KEY, stored);
  syncTelegramChrome(resolved);
}

function syncTelegramChrome(resolved: "dark" | "light") {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  const color = resolved === "light" ? "#eef2fb" : "#00051a";
  try {
    webApp.setHeaderColor?.(color);
  } catch {
    /* ignore */
  }
  try {
    webApp.setBackgroundColor?.(color);
  } catch {
    /* ignore */
  }
  try {
    webApp.setBottomBarColor?.(color);
  } catch {
    /* ignore */
  }
}

/** Universal soft dissolve — works in Telegram / iOS / Android WebViews. */
function crossfadeWithVeil(run: () => void) {
  const existing = document.querySelector(".theme-crossfade-veil");
  existing?.remove();

  const veil = document.createElement("div");
  veil.className = "theme-crossfade-veil";
  veil.setAttribute("aria-hidden", "true");
  const fromBg = getComputedStyle(document.documentElement).backgroundColor;
  veil.style.backgroundColor = fromBg && fromBg !== "rgba(0, 0, 0, 0)" ? fromBg : "#00051a";
  document.documentElement.appendChild(veil);

  // Paint veil at full opacity, then swap theme underneath and fade out.
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(() => {
      veil.classList.add("theme-crossfade-veil--out");
      const cleanup = () => {
        veil.removeEventListener("transitionend", cleanup);
        veil.remove();
      };
      veil.addEventListener("transitionend", cleanup);
      window.setTimeout(cleanup, THEME_FADE_MS + 80);
    });
  });
}

export function applyTheme(theme: AppTheme, options: ApplyThemeOptions = {}) {
  const { animate = true } = options;
  const resolved = resolveTheme(theme);
  const previous = document.documentElement.dataset.theme;
  const run = () => setThemeAttributes(resolved, theme);

  const honorReduce = prefersReducedMotion() && !forceMotionEnabled();
  const shouldAnimate = animate && previous != null && previous !== resolved && !honorReduce;

  if (!shouldAnimate) {
    run();
    return;
  }

  // Desktop Chrome / supporting browsers: native View Transition.
  if (typeof document.startViewTransition === "function") {
    try {
      document.startViewTransition(run);
      return;
    } catch {
      /* fall through to veil */
    }
  }

  // Mobile / Telegram: soft veil crossfade.
  crossfadeWithVeil(run);
}

export function loadStoredTheme(): AppTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  return "dark";
}

export function initTheme() {
  applyTheme(loadStoredTheme(), { animate: false });
}
