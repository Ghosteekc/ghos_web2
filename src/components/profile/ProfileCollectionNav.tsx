import { useNavigate } from "react-router-dom";
import { ChevronRight, Layers, Sparkles, Search } from "lucide-react";
import { Card } from "@/components/ui";

const ITEMS = [
  {
    to: "/profile/search",
    label: "Поиск игроков",
    hint: "Найти игрока по тегу Clash Royale",
    icon: Search,
  },
  {
    to: "/profile/cards",
    label: "Коллекция карт",
    hint: "Все карты, уровни, эволюции и героизм",
    icon: Layers,
  },
  {
    to: "/profile/mastery",
    label: "Мастерство карт",
    hint: "Прогресс и условия прокачки",
    icon: Sparkles,
  },
] as const;

export function ProfileCollectionNav() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.to}
            className="!p-0 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => navigate(item.to)}
          >
            <div className="w-full flex items-center gap-3 px-3 py-2.5">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-cr-gold/10 border border-cr-gold/25 flex items-center justify-center">
                <Icon className="w-4 h-4 text-cr-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cr-text">{item.label}</p>
                <p className="text-xs text-cr-muted mt-0.5">{item.hint}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-cr-muted shrink-0" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
