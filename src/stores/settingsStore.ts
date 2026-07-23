import { api } from "@/api/client";
import { applyTheme, loadStoredTheme, type AppTheme } from "@/hooks/useTheme";
import type { Settings } from "@/types";
import { setHapticEnabled } from "@/utils/hapticManager";

const STORAGE_KEY = "ghosteek-settings-v1";

type Listener = () => void;

function defaultSettings(): Settings {
  return {
    theme: loadStoredTheme(),
    language: "ru",
    notifications: true,
    telegram_notifications: true,
    haptic_enabled: true,
  };
}

function readStoredSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const base = defaultSettings();
    return {
      theme:
        parsed.theme === "dark" || parsed.theme === "light" || parsed.theme === "auto"
          ? parsed.theme
          : base.theme,
      language: parsed.language === "en" ? "en" : "ru",
      notifications: parsed.notifications ?? base.notifications,
      telegram_notifications: parsed.telegram_notifications ?? base.telegram_notifications,
      haptic_enabled: parsed.haptic_enabled ?? base.haptic_enabled,
    };
  } catch {
    return null;
  }
}

function writeStoredSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private mode */
  }
}

function applySettingsSideEffects(settings: Settings) {
  applyTheme(settings.theme as AppTheme);
  setHapticEnabled(settings.haptic_enabled);
}

let current: Settings = readStoredSettings() ?? defaultSettings();
let loadedFromServer = false;
let loadPromise: Promise<Settings> | null = null;
let saveChain: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setCurrent(next: Settings) {
  current = next;
  writeStoredSettings(next);
  applySettingsSideEffects(next);
  notify();
}

export function getSettingsSnapshot(): Settings {
  return current;
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSettingsLoadedFromServer(): boolean {
  return loadedFromServer;
}

/** Load settings once per app session; keeps in-memory state across route changes. */
export async function ensureSettingsLoaded(force = false): Promise<Settings> {
  if (loadedFromServer && !force) {
    return current;
  }
  if (loadPromise && !force) {
    return loadPromise;
  }

  loadPromise = api
    .getSettings()
    .then((server) => {
      const theme = (server.theme as AppTheme) || current.theme;
      const merged: Settings = { ...server, theme };
      loadedFromServer = true;
      setCurrent(merged);
      return merged;
    })
    .catch(() => {
      loadedFromServer = true;
      applySettingsSideEffects(current);
      return current;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

/** Optimistic patch with sequential server sync and rollback on failure. */
export function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const previous = current;
  const optimistic = { ...current, ...patch };
  setCurrent(optimistic);

  const task = saveChain.then(async () => {
    try {
      const saved = await api.updateSettings(patch);
      const theme = (saved.theme as AppTheme) || optimistic.theme;
      const merged: Settings = { ...saved, theme };
      setCurrent(merged);
      return merged;
    } catch (error) {
      setCurrent(previous);
      throw error;
    }
  });

  saveChain = task.then(
    () => undefined,
    () => undefined,
  );

  return task;
}

export function invalidateSettingsCache() {
  loadedFromServer = false;
}
