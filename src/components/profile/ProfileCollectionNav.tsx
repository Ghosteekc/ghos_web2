import { useNavigate } from "react-router-dom";
import { Layers, Sparkles, Search } from "lucide-react";
import { NavRowButton } from "@/components/ui";

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
    <div className="space-y-2">
      {ITEMS.map((item) => (
        <NavRowButton
          key={item.to}
          icon={item.icon}
          label={item.label}
          hint={item.hint}
          onClick={() => navigate(item.to)}
        />
      ))}
    </div>
  );
}
