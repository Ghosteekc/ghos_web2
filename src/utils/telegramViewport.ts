/** Telegram Mini App chrome: expand + fullscreen (no top Telegram sheet). */

const APP_HEADER_COLOR = "#00051a";
const APP_BG_COLOR = "#00051a";

function getTelegramChromeTop(webApp: NonNullable<typeof window.Telegram>["WebApp"]) {
  if (webApp.isFullscreen) return 0;
  if (webApp.platform === "ios") return 56;
  if (webApp.platform === "android") return 48;
  return 44;
}

export function applyTelegramSafeArea() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const root = document.documentElement;
  const device = webApp.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const content = webApp.contentSafeAreaInset;

  root.style.setProperty("--tg-device-safe-top", `${device.top}px`);
  root.style.setProperty("--tg-device-safe-bottom", `${device.bottom}px`);
  root.style.setProperty("--tg-device-safe-left", `${device.left}px`);
  root.style.setProperty("--tg-device-safe-right", `${device.right}px`);

  const chromeTop = getTelegramChromeTop(webApp);
  let contentTop = content?.top ?? 0;
  const contentBottom = content?.bottom ?? device.bottom;
  const contentLeft = content?.left ?? device.left;
  const contentRight = content?.right ?? device.right;

  if (webApp.isFullscreen) {
    // Fullscreen: trust Telegram insets only (no fake header gap).
    contentTop = Math.max(contentTop, device.top);
  } else {
    contentTop = Math.max(contentTop, device.top + chromeTop);
  }

  root.style.setProperty("--tg-content-safe-top", `${contentTop}px`);
  root.style.setProperty("--tg-content-safe-bottom", `${contentBottom}px`);
  root.style.setProperty("--tg-content-safe-left", `${contentLeft}px`);
  root.style.setProperty("--tg-content-safe-right", `${contentRight}px`);
  root.dataset.tgFullscreen = webApp.isFullscreen ? "1" : "0";
}

function requestFullscreenSafe(webApp: NonNullable<typeof window.Telegram>["WebApp"]) {
  if (typeof webApp.requestFullscreen !== "function") return;
  if (webApp.isFullscreen) return;
  if (typeof webApp.isVersionAtLeast === "function" && !webApp.isVersionAtLeast("8.0")) {
    return;
  }
  try {
    webApp.requestFullscreen();
  } catch {
    /* older clients */
  }
}

/** Call as early as possible after telegram-web-app.js. */
export function bootstrapTelegramViewport() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  try {
    webApp.ready();
  } catch {
    /* ignore */
  }
  try {
    webApp.expand();
  } catch {
    /* ignore */
  }
  try {
    webApp.disableVerticalSwipes?.();
  } catch {
    /* ignore */
  }
  try {
    webApp.setHeaderColor?.(APP_HEADER_COLOR);
  } catch {
    /* ignore */
  }
  try {
    webApp.setBackgroundColor?.(APP_BG_COLOR);
  } catch {
    /* ignore */
  }
  try {
    webApp.setBottomBarColor?.(APP_BG_COLOR);
  } catch {
    /* ignore */
  }

  requestFullscreenSafe(webApp);
  applyTelegramSafeArea();
}

export function bindTelegramViewportListeners(): () => void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return () => undefined;

  const onFullscreen = () => applyTelegramSafeArea();
  const onActivated = () => {
    requestFullscreenSafe(webApp);
    applyTelegramSafeArea();
  };
  const onFullscreenFailed = () => {
    // Stay expanded; safe-area still applies in sheet mode.
    applyTelegramSafeArea();
  };

  webApp.onEvent?.("safeAreaChanged", applyTelegramSafeArea);
  webApp.onEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
  webApp.onEvent?.("fullscreenChanged", onFullscreen);
  webApp.onEvent?.("fullscreenFailed", onFullscreenFailed);
  webApp.onEvent?.("activated", onActivated);
  webApp.onEvent?.("viewportChanged", applyTelegramSafeArea);

  // Retry once shortly after mount — some clients ignore the first call.
  const retry = window.setTimeout(() => requestFullscreenSafe(webApp), 250);

  return () => {
    window.clearTimeout(retry);
    webApp.offEvent?.("safeAreaChanged", applyTelegramSafeArea);
    webApp.offEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    webApp.offEvent?.("fullscreenChanged", onFullscreen);
    webApp.offEvent?.("fullscreenFailed", onFullscreenFailed);
    webApp.offEvent?.("activated", onActivated);
    webApp.offEvent?.("viewportChanged", applyTelegramSafeArea);
  };
}
