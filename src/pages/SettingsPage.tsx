import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Smartphone,
  Bell,
  BellOff,
  RefreshCw,
  Vibrate,
} from "lucide-react";
import { Card, Loader } from "@/components/ui";
import { api } from "@/api/client";
import { useTelegram, usePageRefresh, useSettings } from "@/hooks";
import { applyTheme, type AppTheme } from "@/hooks/useTheme";
import { ensureSettingsLoaded } from "@/stores/settingsStore";
import { Profile } from "@/types";
import { hapticManager } from "@/utils/hapticManager";

export function SettingsPage() {
  const { tg, showAlert, showConfirm } = useTelegram();
  const { settings, loading: settingsLoading, update } = useSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([ensureSettingsLoaded(true), loadProfile()]);
  }, [loadProfile]);

  usePageRefresh(refresh);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || settings.theme !== "auto") return;
    const onThemeChanged = () => applyTheme("auto");
    webApp.onEvent?.("themeChanged", onThemeChanged);
    return () => webApp.offEvent?.("themeChanged", onThemeChanged);
  }, [settings.theme]);

  const updateSetting = async (
    patch: Parameters<typeof update>[0],
    options?: { skipHaptic?: boolean },
  ) => {
    try {
      await update(patch);
    } catch (e) {
      console.error(e);
      if (!options?.skipHaptic) {
        hapticManager.error();
      }
    }
  };

  const handleClearCache = async () => {
    const ok = await showConfirm?.("Очистить кеш боёв и статистики на сервере?");
    if (!ok) return;

    setClearing(true);
    try {
      await api.clearCache();
      hapticManager.success();
      await showAlert?.("Кеш очищен. Данные обновятся при следующей синхронизации.");
    } catch (e) {
      hapticManager.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось очистить кеш");
    } finally {
      setClearing(false);
    }
  };

  const handleSyncData = async () => {
    if (!profile?.player_tag) {
      void showAlert?.("Сначала привяжите аккаунт Clash Royale в боте: /link #ТЕГ");
      return;
    }

    setSyncing(true);
    try {
      const res = await api.syncData();
      window.dispatchEvent(new Event("app:sync"));
      hapticManager.important();
      await showAlert?.(
        res.battles_loaded > 0
          ? `Данные обновлены: ${res.battles_loaded} боёв в журнале, статистика и списки актуализированы.`
          : "Синхронизация завершена. Списки боёв и статистика обновлены.",
      );
    } catch (e) {
      hapticManager.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось синхронизировать данные");
    } finally {
      setSyncing(false);
    }
  };

  if (settingsLoading || profileLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Настройки</h1>

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Внешний вид</h3>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Palette className="w-5 h-5 text-cr-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cr-text">Тема</p>
                    <p className="text-xs text-cr-muted">Тёмная, светлая или как на устройстве</p>
                  </div>
                </div>
                <div className="flex bg-cr-bg rounded-lg p-1 flex-shrink-0 border border-cr-border">
                  <ThemeButton
                    active={settings.theme === "dark"}
                    label="Тёмная"
                    onClick={() => void updateSetting({ theme: "dark" })}
                  >
                    <Moon className="w-4 h-4" />
                  </ThemeButton>
                  <ThemeButton
                    active={settings.theme === "light"}
                    label="Светлая"
                    onClick={() => void updateSetting({ theme: "light" })}
                  >
                    <Sun className="w-4 h-4" />
                  </ThemeButton>
                  <ThemeButton
                    active={settings.theme === "auto"}
                    label="Системная"
                    onClick={() => void updateSetting({ theme: "auto" })}
                  >
                    <Smartphone className="w-4 h-4" />
                  </ThemeButton>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Интерфейс</h3>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Vibrate className="w-5 h-5 text-cr-blue shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cr-text">Вибрация</p>
                  <p className="text-xs text-cr-muted">Тактильная отдача при нажатиях</p>
                </div>
              </div>
              <Toggle
                checked={settings.haptic_enabled}
                noHaptic
                onChange={(c) => {
                  void updateSetting({ haptic_enabled: c }, { skipHaptic: true });
                  if (c) {
                    hapticManager.selection();
                  }
                }}
              />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Обо мне</h3>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[3px] shrink-0">
                <div className="w-full h-full rounded-full bg-cr-surface flex items-center justify-center">
                  <User className="w-7 h-7 text-cr-muted" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cr-muted">Telegram ID</p>
                <p className="text-cr-text font-mono font-semibold">{tg?.initDataUnsafe?.user?.id ?? "—"}</p>
                <p className="text-sm font-semibold text-cr-muted mt-2">Username</p>
                <p className="text-cr-text font-semibold">@{tg?.initDataUnsafe?.user?.username ?? "—"}</p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-cr-loss/10 hover:bg-cr-loss/20 transition-colors shrink-0"
                aria-label="Выход"
                onClick={() => tg?.close?.()}
              >
                <LogOut className="w-5 h-5 text-cr-loss" />
              </motion.button>
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Уведомления</h3>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-cr-gold" />
                <div>
                  <p className="text-sm font-semibold text-cr-text">Уведомления</p>
                  <p className="text-xs text-cr-muted">Внутри приложения</p>
                </div>
              </div>
              <Toggle
                checked={settings.notifications}
                onChange={(c) => void updateSetting({ notifications: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellOff className="w-5 h-5 text-cr-blue" />
                <div>
                  <p className="text-sm font-semibold text-cr-text">Telegram</p>
                  <p className="text-xs text-cr-muted">Уведомления в чате</p>
                </div>
              </div>
              <Toggle
                checked={settings.telegram_notifications}
                onChange={(c) => void updateSetting({ telegram_notifications: c })}
              />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Данные</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-0 overflow-hidden">
              <button
                type="button"
                className="settings-data-btn !rounded-none !border-0 h-full"
                onClick={() => void handleClearCache()}
                disabled={clearing}
              >
                <Trash2 className="w-6 h-6 text-cr-loss" />
                <span>{clearing ? "Очистка…" : "Очистить кеш"}</span>
              </button>
            </Card>
            <Card className="!p-0 overflow-hidden">
              <button
                type="button"
                className="settings-data-btn !rounded-none !border-0 h-full"
                onClick={() => void handleSyncData()}
                disabled={syncing}
              >
                <RefreshCw className={"w-6 h-6 text-cr-blue " + (syncing ? "animate-spin" : "")} />
                <span>{syncing ? "Синхронизация…" : "Синхронизировать"}</span>
              </button>
            </Card>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-cr-muted pt-4 font-medium">
        Ghosteek CR Assistant v1.0
      </p>
    </div>
  );
}

function ThemeButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={"segment-tab " + (active ? "segment-tab--active" : "")}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  noHaptic,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  noHaptic?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-checked={checked}
      {...(noHaptic ? { "data-no-haptic": true } : {})}
      onClick={() => onChange(!checked)}
      className="toggle-switch"
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}

export { SettingsPage as default };
