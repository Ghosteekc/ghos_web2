import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Trophy,
  Crown,
  Shield,
  Globe,
  Bell,
  BellOff,
  Palette,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Smartphone,
} from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { api } from "@/api/client";
import { Settings } from "@/types";
import { useTelegram } from "@/hooks";

export function SettingsPage() {
  const { tg } = useTelegram();
  const [settings, setSettings] = useState<Settings>({
    theme: "dark",
    language: "ru",
    notifications: true,
    telegram_notifications: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const update = async (patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    try {
      await api.updateSettings(patch);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cr-text tracking-tight">Настройки</h1>

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Внешний вид</h3>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-cr-blue" />
                  <div>
                    <p className="text-sm font-medium text-cr-text">Тема</p>
                    <p className="text-xs text-cr-muted">Выбор цветовой схемы</p>
                  </div>
                </div>
                <div className="flex bg-cr-bg rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => update({ theme: "dark" })}
                    className={
                      "p-2 rounded-md transition-all " +
                      (settings.theme === "dark" ? "bg-cr-gold text-cr-bg" : "text-cr-muted hover:text-cr-text")
                    }
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => update({ theme: "light" })}
                    className={
                      "p-2 rounded-md transition-all " +
                      (settings.theme === "light" ? "bg-cr-gold text-cr-bg" : "text-cr-muted hover:text-cr-text")
                    }
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => update({ theme: "auto" })}
                    className={
                      "p-2 rounded-md transition-all " +
                      (settings.theme === "auto" ? "bg-cr-gold text-cr-bg" : "text-cr-muted hover:text-cr-text")
                    }
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Обо мне</h3>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[3px]">
                <div className="w-full h-full rounded-full bg-cr-surface flex items-center justify-center">
                  <User className="w-7 h-7 text-cr-muted" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cr-muted">Telegram ID</p>
                <p className="text-cr-text font-mono">{tg?.initDataUnsafe?.user?.id ?? "—"}</p>
                <p className="text-sm font-medium text-cr-muted mt-2">Username</p>
                <p className="text-cr-text">@{tg?.initDataUnsafe?.user?.username ?? "—"}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl bg-cr-loss/10 hover:bg-cr-loss/20 transition-colors"
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
                  <p className="text-sm font-medium text-cr-text">Уведомления</p>
                  <p className="text-xs text-cr-muted">Внутри приложения</p>
                </div>
              </div>
              <Toggle
                checked={settings.notifications}
                onChange={(c) => update({ notifications: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BellOff className="w-5 h-5 text-cr-blue" />
                <div>
                  <p className="text-sm font-medium text-cr-text">Telegram</p>
                  <p className="text-xs text-cr-muted">Уведомления в чате</p>
                </div>
              </div>
              <Toggle
                checked={settings.telegram_notifications}
                onChange={(c) => update({ telegram_notifications: c })}
              />
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-cr-muted mb-3 uppercase tracking-wider">Данные</h3>
          <Card className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <Trash2 className="w-5 h-5 text-cr-loss mr-3" />
              Очистить кеш
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Trophy className="w-5 h-5 text-cr-gold mr-3" />
              Эмблема арены
            </Button>
          </Card>
        </section>
      </div>

      <p className="text-center text-xs text-cr-muted pt-4">
        Ghosteek CR Assistant v1.0
      </p>
    </div>
  );
}

export { SettingsPage as default };

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          "relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 " +
          (checked ? "bg-cr-gold" : "bg-cr-border")
        }
      >
        <motion.span
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    );
  }