import { useCallback, useEffect, useState } from "react";
import {
  Palette,
  LogOut,
  Trash2,
  Eraser,
  Bell,
  RefreshCw,
  Vibrate,
  Unlink2,
} from "lucide-react";
import { Card, Loader, PageHeader } from "@/components/ui";
import { HapticSegment } from "@/components/settings/HapticSegment";
import { ThemeSegment } from "@/components/settings/ThemeSegment";
import { api } from "@/api/client";
import { cacheInvalidate, lsClearAll } from "@/api/cache";
import { useTelegram, usePageRefresh, useSettings } from "@/hooks";
import { applyTheme } from "@/hooks/useTheme";
import { ensureSettingsLoaded } from "@/stores/settingsStore";
import { Profile } from "@/types";
import { haptic } from "@/utils/hapticManager";
import { translate } from "@/i18n";
import { formatLastSyncLabel, getLastSyncAt, LAST_SYNC_EVENT } from "@/utils/lastSync";
import { formatPlayerTag } from "@/utils";

export function SettingsPage() {
  const { tg, showAlert, showConfirm } = useTelegram();
  const { settings, loading: settingsLoading, update } = useSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(() =>
    formatLastSyncLabel(getLastSyncAt()),
  );

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

  useEffect(() => {
    const refreshLastSync = () => {
      setLastSyncLabel(formatLastSyncLabel(getLastSyncAt()));
    };
    refreshLastSync();
    window.addEventListener(LAST_SYNC_EVENT, refreshLastSync);
    window.addEventListener("app:sync", refreshLastSync);
    return () => {
      window.removeEventListener(LAST_SYNC_EVENT, refreshLastSync);
      window.removeEventListener("app:sync", refreshLastSync);
    };
  }, []);

  const updateSetting = async (
    patch: Parameters<typeof update>[0],
    options?: { skipHaptic?: boolean },
  ) => {
    try {
      await update(patch);
    } catch (e) {
      console.error(e);
      if (!options?.skipHaptic) {
        haptic.error();
      }
    }
  };

  const handleClearCache = async () => {
    const ok = await showConfirm?.(
      "Сбросить временный кеш приложения?\n\nИстория боёв на сервере не удаляется. Данные в интерфейсе обновятся при следующем открытии разделов или синхронизации.",
    );
    if (!ok) return;

    setClearing(true);
    try {
      await api.clearCache();
      haptic.success();
      await showAlert?.(
        "Кеш приложения сброшен. Чтобы обновить списки, откройте разделы заново или нажмите «Синхронизировать».",
      );
    } catch (e) {
      haptic.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось сбросить кеш");
    } finally {
      setClearing(false);
    }
  };

  const handleClearBattleHistory = async () => {
    if (!profile?.player_tag) {
      void showAlert?.("Сначала привяжите аккаунт Clash Royale в боте: /link #ТЕГ");
      return;
    }

    const tagLabel = profile.player_tag.replace(/^#/, "");
    const ok = await showConfirm?.(
      "Внимание: все ваши бои будут удалены из проекта!\n\n"
        + `Аккаунт #${tagLabel} — удаляются только его сохранённые матчи.\n\n`
        + "Отменить действие нельзя.\n"
        + "Новые бои будут продолжать появляться после синхронизации с Clash Royale.\n\n"
        + "Удалить историю боёв?",
    );
    if (!ok) return;

    haptic.confirm();
    setClearingHistory(true);
    try {
      const res = await api.clearBattleHistory();
      haptic.success();
      await showAlert?.(
        res.deleted_count > 0
          ? `История боёв очищена. Удалено записей: ${res.deleted_count}. Новые бои появятся после синхронизации с Clash Royale.`
          : "Сохранённая история уже пуста. Нажмите «Синхронизировать», чтобы загрузить бои из Clash Royale.",
      );
    } catch (e) {
      haptic.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось очистить историю боёв");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!profile?.player_tag) {
      void showAlert?.(
        "Аккаунт Clash Royale уже не привязан.\n\n"
          + "Чтобы снова войти в профиль, зарегистрируйтесь в боте: /link #ВАШТЕГ",
      );
      return;
    }

    const tagLabel = formatPlayerTag(profile.player_tag);
    const ok = await showConfirm?.(
      "Выйти и отвязать аккаунт?\n\n"
        + `Аккаунт Clash Royale ${tagLabel} будет отвязан от текущего аккаунта Telegram.\n\n`
        + "Выход произойдёт и в боте, и в Mini App.\n"
        + "Чтобы снова пользоваться профилем, зарегистрируйтесь в боте под своим тегом: /link #ТЕГ\n\n"
        + "Отвязать аккаунт?",
    );
    if (!ok) return;

    haptic.confirm();
    setUnlinking(true);
    try {
      await api.unlinkAccount();
      cacheInvalidate();
      lsClearAll();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              player_tag: null,
              player_name: null,
              trophies: null,
              arena_name: null,
              favorite_card: null,
              favorite_card_icon: null,
              avatar_url: null,
              winrate: null,
              skill_rating: null,
            }
          : prev,
      );
      window.dispatchEvent(new Event("app:sync"));
      haptic.success();
      await showAlert?.(
        `Аккаунт Clash Royale ${tagLabel} отвязан от этого Telegram.\n\n`
          + "Вы вышли из профиля. Чтобы вернуться — /link #ВАШТЕГ в боте.",
      );
    } catch (e) {
      haptic.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось отвязать аккаунт");
    } finally {
      setUnlinking(false);
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
      haptic.double();
      await showAlert?.(
        res.battles_loaded > 0
          ? `Данные обновлены: ${res.battles_loaded} боёв в журнале, статистика и списки актуализированы.`
          : "Синхронизация завершена. Списки боёв и статистика обновлены.",
      );
    } catch (e) {
      haptic.error();
      await showAlert?.(e instanceof Error ? e.message : "Не удалось синхронизировать данные");
    } finally {
      setSyncing(false);
    }
  };

  if (settingsLoading || profileLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Настройки" />
        <Loader variant="section" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" />

      <div className="space-y-4">
        <section>
          <h3 className="section-title mb-3">Внешний вид</h3>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Palette className="w-5 h-5 text-cr-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-cr-text">Тема</p>
                    <p className="text-sm text-cr-muted">Тёмная, светлая или как на устройстве</p>
                  </div>
                </div>
                <ThemeSegment
                  value={settings.theme}
                  onChange={(theme) => void updateSetting({ theme })}
                />
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h3 className="section-title mb-3">Интерфейс</h3>
          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Vibrate className="w-5 h-5 text-cr-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-cr-text">
                      {translate("settings.haptic.title", settings.language)}
                    </p>
                    <p className="text-sm text-cr-muted">
                      {settings.haptic_enabled
                        ? translate("settings.haptic.enabled", settings.language)
                        : translate("settings.haptic.disabled", settings.language)}
                      {" · "}
                      {settings.haptic_enabled
                        ? translate("settings.haptic.subtitleOn", settings.language)
                        : translate("settings.haptic.subtitleOff", settings.language)}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={settings.haptic_enabled}
                  noHaptic
                  onChange={(c) => {
                    void updateSetting({ haptic_enabled: c }, { skipHaptic: true });
                    if (c) {
                      haptic.toggle();
                    }
                  }}
                />
              </div>
              <HapticSegment
                value={settings.haptic_intensity ?? "standard"}
                disabled={!settings.haptic_enabled}
                onChange={(intensity) => void updateSetting({ haptic_intensity: intensity })}
              />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="section-title mb-3">Обо мне</h3>
          <Card className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                {profile?.player_tag ? (
                  <>
                    <p className="text-base font-semibold text-cr-muted">Игрок</p>
                    <p className="text-cr-text font-semibold truncate">
                      {profile.player_name?.trim() || "Без имени"}
                    </p>
                    <p className="text-sm text-cr-accent mt-1 font-mono">
                      {formatPlayerTag(profile.player_tag)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-semibold text-cr-muted">Аккаунт CR</p>
                    <p className="text-cr-text font-semibold">Не привязан</p>
                    <p className="text-sm text-cr-muted mt-1">Привяжите тег в боте: /link #ТЕГ</p>
                  </>
                )}
              </div>
              <button
                type="button"
                className="ui-tap flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cr-loss/10 transition-colors shrink-0"
                aria-label="Закрыть приложение"
                onClick={() => tg?.close?.()}
              >
                <LogOut className="w-5 h-5 text-cr-loss shrink-0" />
                <span className="text-sm font-semibold text-cr-loss leading-tight text-left">
                  Закрыть
                  <br />
                  приложение
                </span>
              </button>
            </div>
            <button
              type="button"
              className="settings-data-btn w-full settings-data-btn--danger"
              onClick={() => void handleUnlinkAccount()}
              disabled={unlinking}
            >
              <span className="pixel-btn-icon-slot" aria-hidden>
                <Unlink2 className="w-5 h-5 text-cr-muted" />
              </span>
              <span>
                {unlinking
                  ? "Отвязка…"
                  : profile?.player_tag
                    ? "Выйти и отвязать аккаунт CR"
                    : "Аккаунт уже отвязан"}
              </span>
            </button>
            <p className="text-xs text-cr-muted leading-snug px-0.5">
              Аккаунт Clash Royale будет отвязан от текущего Telegram. Выход сработает и в боте.
              Чтобы снова зайти в профиль — /link #ТЕГ в боте.
            </p>
          </Card>
        </section>

        <section>
          <h3 className="section-title mb-3">Уведомления</h3>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-cr-gold" />
                <div>
                  <p className="text-base font-semibold text-cr-text">Telegram</p>
                  <p className="text-sm text-cr-muted">Еженедельная сводка в чате бота</p>
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
          <h3 className="section-title mb-3">Данные</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="settings-data-btn h-full"
              onClick={() => void handleClearCache()}
              disabled={clearing}
            >
              <span className="pixel-btn-icon-slot" aria-hidden>
                <Eraser className="w-5 h-5 text-cr-gold" />
              </span>
              <span>{clearing ? "Сброс…" : "Сбросить кеш"}</span>
            </button>
            <button
              type="button"
              className="settings-data-btn h-full"
              onClick={() => void handleSyncData()}
              disabled={syncing}
            >
              <span className="pixel-btn-icon-slot" aria-hidden>
                <RefreshCw className={"w-5 h-5 text-cr-blue " + (syncing ? "animate-spin" : "")} />
              </span>
              <span>{syncing ? "Синхронизация…" : "Синхронизировать"}</span>
            </button>
          </div>
          <button
            type="button"
            className="settings-data-btn w-full mt-2"
            onClick={() => void handleClearBattleHistory()}
            disabled={clearingHistory}
          >
            <span className="pixel-btn-icon-slot" aria-hidden>
              <Trash2 className="w-5 h-5 text-cr-loss" />
            </span>
            <span>{clearingHistory ? "Удаление…" : "Удалить историю боёв"}</span>
          </button>
          {lastSyncLabel ? (
            <p className="text-center text-base font-semibold text-cr-win mt-3">{lastSyncLabel}</p>
          ) : null}
        </section>
      </div>

      <p className="app-footer-version text-center text-sm pt-4 font-medium">
        Ghosteek CR Assistant v1.0
      </p>
    </div>
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
