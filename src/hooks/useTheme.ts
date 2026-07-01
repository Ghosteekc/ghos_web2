export type AppTheme = "dark" | "light" | "auto";

const STORAGE_KEY = "ghosteek-theme";

export function resolveTheme(theme: AppTheme): "dark" | "light" {
  if (theme === "auto") {
    const tgScheme = window.Telegram?.WebApp?.colorScheme;
    if (tgScheme === "light" || tgScheme === "dark") return tgScheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export function applyTheme(theme: AppTheme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function loadStoredTheme(): AppTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  return "dark";
}

export function initTheme() {
  applyTheme(loadStoredTheme());
}
