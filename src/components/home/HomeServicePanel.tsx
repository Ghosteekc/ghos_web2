import {
  BarChart3,
  GitCompare,
  History,
  Search,
  Star,
  Link2,
  Sparkles,
} from "lucide-react";
import { Card, NavRowButton } from "@/components/ui";
import { Profile } from "@/types";
import { formatPlayerTag } from "@/utils";

const quickLinks = [
  { to: "/analytics", icon: BarChart3, label: "Аналитика", hint: "Графики, соперники, улучшения" },
  { to: "/decks", icon: GitCompare, label: "Колоды", hint: "Мета, сравнение, рандом" },
  { to: "/battles", icon: History, label: "История", hint: "Разбор последних боёв" },
  { to: "/profile/search", icon: Search, label: "Поиск", hint: "Игрок по тегу" },
  { to: "/decks?tab=favorites", icon: Star, label: "Избранное", hint: "Сохранённые колоды" },
] as const;

interface HomeServicePanelProps {
  profile: Profile;
  onNavigate: (path: string) => void;
}

export function HomeServicePanel({ profile, onNavigate }: HomeServicePanelProps) {
  const tagLinked = Boolean(profile.player_tag);

  return (
    <div className="space-y-4">
      {!tagLinked && (
        <Card className="border-cr-gold/30 bg-cr-gold/5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cr-gold shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cr-text">Настройка сервиса</p>
              <p className="mt-2 text-xs text-cr-muted">
                Привяжите аккаунт в боте: <span className="text-cr-gold font-mono">/link #ТЕГ</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="!p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-cr-blue/10">
            <Link2 className="w-5 h-5 text-cr-blue" />
          </div>
          <p className="text-xs text-cr-muted uppercase tracking-wide">Аккаунт CR</p>
        </div>
        <p className="text-lg font-bold text-cr-text truncate">
          {tagLinked ? formatPlayerTag(profile.player_tag!) : "Не привязан"}
        </p>
        <p className="text-xs text-cr-muted mt-1 truncate">
          {tagLinked
            ? profile.clan_name
              ? `Клан: ${profile.clan_name}`
              : "Тег привязан к боту"
            : "Команда /link в Telegram-боте"}
        </p>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-cr-text mb-3 px-1">Разделы приложения</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickLinks.map((item) => (
            <NavRowButton
              key={item.to}
              icon={item.icon}
              label={item.label}
              hint={item.hint}
              onClick={() => onNavigate(item.to)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { HomeServicePanel as default };
