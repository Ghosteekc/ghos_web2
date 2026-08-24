/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
  };
  version?: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  /** Bot API 8.0+ */
  isFullscreen?: boolean;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  /** Bot API 7.7+ — disable swipe-down to close/minimize the Mini App. */
  isVerticalSwipesEnabled?: boolean;
  enableVerticalSwipes?: () => void;
  disableVerticalSwipes?: () => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  /** Bot API 6.1+ — Telegram Stars / payments invoice. */
  openInvoice?: (
    url: string,
    callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void,
  ) => void;
  themeParams: Record<string, string>;
  colorScheme: "light" | "dark";
  platform?: "ios" | "android" | "macos" | "tdesktop" | "weba" | "webk" | "unigram" | "unknown";
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  onEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
  offEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export {};