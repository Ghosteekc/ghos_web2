import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Trophy,
  Palette,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Smartphone,
  Bell,
  BellOff,
  X,
} from "lucide-react";
import { Card, Loader } from "@/components/ui";
import { api } from "@/api/client";
import { Profile, Settings } from "@/types";
import { useTelegram, usePageRefresh } from "@/hooks";
import { applyTheme, loadStoredTheme, type AppTheme } from "@/hooks/useTheme";
import { hapticImpact, hapticNotify, hapticSelection } from "@/utils";

export function SettingsPage() {
  const { tg, showAlert, showConfirm } = useTelegram();
  const [settings, setSettings] = useState<Settings>({
    theme: loadStoredTheme(),
    language: "ru",
    notifications: true,
    telegram_notifications: true,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [arenaOpen, setArenaOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.getSettings(), api.getProfile()]);
      const theme = (s.theme as AppTheme) || loadStoredTheme();
      setSettings({ ...s, theme });
      applyTheme(theme);
      setProfile(p);
    } catch (e) {
      console.error(e);
      applyTheme(loadStoredTheme());
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || settings.theme !== "auto") return;
    const onThemeChanged = () => applyTheme("auto");
    webApp.onEvent?.("themeChanged", onThemeChanged);
    return () => webApp.offEvent?.("themeChanged", onThemeChanged);
  }, [settings.theme]);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (patch.theme) {
      applyTheme(patch.theme as AppTheme);
    }
    try {
      await api.updateSettings(patch);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCache = async () => {
    const ok = await showConfirm?.("Очистить кеш боёв и статистики на сервере?");
    if (!ok) return;

    setClearing(true);
    try {
      await api.clearCache();
      hapticNotify("success");
      await showAlert?.("Кеш очищен. Данные обновятся при следующей синхронизации.");
    } catch (e) {
      await showAlert?.(e instanceof Error ? e.message : "Не удалось очистить кеш");
    } finally {
      setClearing(false);
    }
  };

  const handleArenaEmblem = () => {
    if (!profile?.player_tag) {
      void showAlert?.("Сначала привяжите аккаунт Clash Royale в боте: /link #ТЕГ");
      return;
    }
    hapticImpact("medium");
    setArenaOpen(true);
  };

  if (loading) {
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
                    onClick={() => void update({ theme: "dark" })}
                  >
                    <Moon className="w-4 h-4" />
                  </ThemeButton>
                  <ThemeButton
                    active={settings.theme === "light"}
                    label="Светлая"
                    onClick={() => void update({ theme: "light" })}
                  >
                    <Sun className="w-4 h-4" />
                  </ThemeButton>
                  <ThemeButton
                    active={settings.theme === "auto"}
                    label="Системная"
                    onClick={() => void update({ theme: "auto" })}
                  >
                    <Smartphone className="w-4 h-4" />
                  </ThemeButton>
                </div>
              </div>
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
                onClick={() => {
                  hapticImpact("light");
                  tg?.close?.();
                }}
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
              <Toggle checked={settings.notifications} onChange={(c) => void update({ notifications: c })} />
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
                onChange={(c) => void update({ telegram_notifications: c })}
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
              <button type="button" className="settings-data-btn !rounded-none !border-0 h-full" onClick={handleArenaEmblem}>
                <Trophy className="w-6 h-6 text-cr-gold" />
                <span>Эмблема арены</span>
              </button>
            </Card>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-cr-muted pt-4 font-medium">
        Ghosteek CR Assistant v1.0
      </p>

      <AnimatePresence>
        {arenaOpen && (
          <ArenaModal profile={profile} onClose={() => setArenaOpen(false)} />
        )}
      </AnimatePresence>
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
      onClick={() => {
        hapticSelection();
        onClick();
      }}
      className={
        "p-2 rounded-md transition-all " +
        (active ? "bg-cr-gold text-cr-bg shadow-sm" : "text-cr-muted hover:text-cr-text")
      }
    >
      {children}
    </button>
  );
}

function ArenaModal({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const arenaName = profile?.arena_name ?? "Арена";
  const iconUrl = profile?.arena_icon;
  const trophies = profile?.trophies;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        hapticImpact("soft");
        onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-xs p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            hapticImpact("light");
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-cr-muted hover:text-cr-text hover:bg-cr-bg/60"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          {iconUrl ? (
            <img src={iconUrl} alt={arenaName} className="w-full h-full object-contain drop-shadow-glow" />
          ) : (
            <div className="w-full h-full rounded-2xl bg-cr-gold/15 border border-cr-gold/30 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-cr-gold" />
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-cr-text mb-1">{arenaName}</h3>
        {trophies != null && (
          <p className="text-sm text-cr-muted font-medium">{trophies.toLocaleString("ru-RU")} 🏆</p>
        )}
        <p className="text-xs text-cr-muted mt-3">{profile?.player_name ?? "Игрок"}</p>
      </motion.div>
    </motion.div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-checked={checked}
      onClick={() => {
        hapticSelection();
        onChange(!checked);
      }}
      className="toggle-switch"
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}

export { SettingsPage as default };
