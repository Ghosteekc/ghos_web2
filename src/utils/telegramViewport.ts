/** Telegram Mini App chrome: expand + fullscreen (no top Telegram sheet). */

const APP_HEADER_COLOR = "#00051a";
const APP_BG_COLOR = "#00051a";

/** Approximate Telegram header / close controls when insets are not ready yet. */
function getTelegramChromeTop(webApp: NonNullable<typeof window.Telegram>["WebApp"]) {
  if (webApp.platform === "ios") return 56;
  if (webApp.platform === "android") return 48;
  return 44;
}

function readInset(
  inset: { top?: number; bottom?: number; left?: number; right?: number } | undefined,
  side: "top" | "bottom" | "left" | "right",
): number {
  const value = inset?.[side];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function applyTelegramSafeArea() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  const root = document.documentElement;
  const device = webApp.safeAreaInset;
  const content = webApp.contentSafeAreaInset;

  const deviceTop = readInset(device, "top");
  const deviceBottom = readInset(device, "bottom");
  const deviceLeft = readInset(device, "left");
  const deviceRight = readInset(device, "right");

  const contentTopRaw = readInset(content, "top");
  const contentBottomRaw = readInset(content, "bottom");
  const contentLeftRaw = readInset(content, "left");
  const contentRightRaw = readInset(content, "right");

  root.style.setProperty("--tg-device-safe-top", `${deviceTop}px`);
  root.style.setProperty("--tg-device-safe-bottom", `${deviceBottom}px`);
  root.style.setProperty("--tg-device-safe-left", `${deviceLeft}px`);
  root.style.setProperty("--tg-device-safe-right", `${deviceRight}px`);

  const chromeTop = getTelegramChromeTop(webApp);
  let contentTop: number;
  let contentBottom: number;
  let contentLeft: number;
  let contentRight: number;

  if (webApp.isFullscreen) {
    // Vertical: safeArea (notch) + contentSafeArea (Telegram close/menu strip).
    const telegramUiTop = contentTopRaw > 0 ? contentTopRaw : chromeTop;
    contentTop = deviceTop + telegramUiTop;
    contentBottom = deviceBottom + contentBottomRaw;

    // Horizontal: keep left/right equal so page + dock stay centered.
    // Do NOT invent a right-only fallback for the close button — that shifts
    // the whole UI left. Corner controls are covered by the top inset.
    const horizontal = Math.max(
      deviceLeft + contentLeftRaw,
      deviceRight + contentRightRaw,
    );
    contentLeft = horizontal;
    contentRight = horizontal;
  } else {
    // Sheet mode: Telegram header is outside the webview; keep prior chrome floor.
    contentTop = Math.max(contentTopRaw, deviceTop + chromeTop);
    contentBottom = Math.max(contentBottomRaw, deviceBottom);
    const horizontal = Math.max(
      contentLeftRaw,
      contentRightRaw,
      deviceLeft,
      deviceRight,
    );
    contentLeft = horizontal;
    contentRight = horizontal;
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

  const timers: number[] = [];
  const reapplySoon = () => {
    // iOS often reports correct insets only after fullscreen settles.
    for (const ms of [50, 200, 500, 1200]) {
      timers.push(window.setTimeout(() => applyTelegramSafeArea(), ms));
    }
  };

  const onFullscreen = () => {
    applyTelegramSafeArea();
    reapplySoon();
  };
  const onActivated = () => {
    try {
      webApp.ready();
    } catch {
      /* ignore */
    }
    requestFullscreenSafe(webApp);
    applyTelegramSafeArea();
    reapplySoon();
  };
  const onFullscreenFailed = () => {
    applyTelegramSafeArea();
  };

  webApp.onEvent?.("safeAreaChanged", applyTelegramSafeArea);
  webApp.onEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
  webApp.onEvent?.("fullscreenChanged", onFullscreen);
  webApp.onEvent?.("fullscreenFailed", onFullscreenFailed);
  webApp.onEvent?.("activated", onActivated);
  webApp.onEvent?.("viewportChanged", applyTelegramSafeArea);

  // Retry fullscreen once shortly after mount — some clients ignore the first call.
  timers.push(window.setTimeout(() => requestFullscreenSafe(webApp), 250));
  reapplySoon();

  return () => {
    for (const id of timers) window.clearTimeout(id);
    webApp.offEvent?.("safeAreaChanged", applyTelegramSafeArea);
    webApp.offEvent?.("contentSafeAreaChanged", applyTelegramSafeArea);
    webApp.offEvent?.("fullscreenChanged", onFullscreen);
    webApp.offEvent?.("fullscreenFailed", onFullscreenFailed);
    webApp.offEvent?.("activated", onActivated);
    webApp.offEvent?.("viewportChanged", applyTelegramSafeArea);
  };
}
