import { useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Settings,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui";

const links = [
  { to: "/search", icon: Search, label: "Поиск", hint: "Игрок по тегу" },
  { to: "/favorites", icon: Star, label: "Избранное", hint: "Сохранённые колоды" },
  { to: "/settings", icon: Settings, label: "Настройки", hint: "Синхронизация и кеш" },
] as const;

export function MorePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="page-title">Ещё</h1>
      <p className="text-xs text-cr-muted -mt-2">Поиск, избранное и настройки</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {links.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="flex items-center gap-3 p-4 rounded-xl bg-cr-card border border-cr-border hover:border-cr-gold/30 transition-colors text-left"
          >
            <div className="p-2 rounded-lg bg-cr-bg/80 shrink-0">
              <item.icon className="w-5 h-5 text-cr-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cr-text">{item.label}</p>
              <p className="text-[11px] text-cr-muted truncate">{item.hint}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-cr-muted/50 shrink-0" />
          </button>
        ))}
      </div>

      <Card className="border-cr-border/60">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-cr-gold shrink-0 mt-0.5" />
          <p className="text-xs text-cr-muted leading-relaxed">
            Основные разделы — в нижнем меню: Профиль, Бои, Колоды, Аналитика.
          </p>
        </div>
      </Card>
    </div>
  );
}

export { MorePage as default };
