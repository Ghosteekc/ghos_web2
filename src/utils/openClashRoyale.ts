/** Deep-link / store fallback to open Clash Royale from the Mini App. */

const CR_APP_SCHEME = "clashroyale://";
const CR_LAUNCH_HTTPS = "https://link.clashroyale.com/";

export function openClashRoyale(openLink?: (url: string) => void): void {
  try {
    // Prefer HTTPS launch link — Telegram openLink handles it reliably;
    // on device it hands off to the installed Clash Royale app.
    if (openLink) {
      openLink(CR_LAUNCH_HTTPS);
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    window.location.href = CR_APP_SCHEME;
  } catch {
    window.open(CR_LAUNCH_HTTPS, "_blank", "noopener,noreferrer");
  }
}
