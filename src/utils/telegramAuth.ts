/** Telegram Mini App initData — wait until auth is ready before API calls. */

const AUTH_READY_EVENT = "ghosteek:tg-auth-ready";

export function isTelegramMiniApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.Telegram?.WebApp);
}

export function getTelegramInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

function callWebAppReady(): void {
  try {
    window.Telegram?.WebApp?.ready();
  } catch {
    /* older clients */
  }
}

/** Notify hooks / API client that initData is available (or may have refreshed). */
export function notifyTelegramAuthReady(): void {
  const data = getTelegramInitData();
  if (!data) return;
  window.dispatchEvent(new CustomEvent(AUTH_READY_EVENT, { detail: data }));
}

export type WaitForInitDataOptions = {
  maxWaitMs?: number;
  /** Call WebApp.ready() — helps after returning from bot chat / background. */
  forceReady?: boolean;
};

/**
 * Resolves when initData is non-empty, or after timeout (may still be empty).
 * In a normal browser (no Telegram) resolves immediately with "".
 */
export async function waitForTelegramInitData(
  opts: WaitForInitDataOptions = {},
): Promise<string> {
  const maxWaitMs = opts.maxWaitMs ?? 10_000;
  let data = getTelegramInitData();
  if (data) return data;
  if (!isTelegramMiniApp()) return "";

  if (opts.forceReady) callWebAppReady();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(getTelegramInitData());
    };

    const onAuthReady = () => {
      if (getTelegramInitData()) finish();
    };

    const onActivated = () => {
      callWebAppReady();
      onAuthReady();
    };

    const webApp = window.Telegram!.WebApp;
    webApp.onEvent?.("activated", onActivated);
    webApp.onEvent?.("viewportChanged", onAuthReady);
    window.addEventListener(AUTH_READY_EVENT, onAuthReady);

    const deadline = Date.now() + maxWaitMs;
    const poll = window.setInterval(() => {
      if (getTelegramInitData()) {
        finish();
        return;
      }
      if (Date.now() >= deadline) finish();
    }, 50);

    function cleanup() {
      window.clearInterval(poll);
      window.removeEventListener(AUTH_READY_EVENT, onAuthReady);
      webApp.offEvent?.("activated", onActivated);
      webApp.offEvent?.("viewportChanged", onAuthReady);
    }
  });
}

export function onTelegramAuthReady(handler: () => void): () => void {
  window.addEventListener(AUTH_READY_EVENT, handler);
  return () => window.removeEventListener(AUTH_READY_EVENT, handler);
}

/** Subscribe once at startup — re-notify when Telegram refreshes initData. */
export function bindTelegramAuthListeners(): () => void {
  if (!isTelegramMiniApp()) return () => undefined;

  const webApp = window.Telegram!.WebApp;
  const bump = () => notifyTelegramAuthReady();

  if (getTelegramInitData()) bump();

  const onActivated = () => {
    callWebAppReady();
    bump();
  };

  webApp.onEvent?.("activated", onActivated);
  webApp.onEvent?.("viewportChanged", bump);

  return () => {
    webApp.offEvent?.("activated", onActivated);
    webApp.offEvent?.("viewportChanged", bump);
  };
}
