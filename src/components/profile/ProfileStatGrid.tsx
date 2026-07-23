import type { LucideIcon } from "lucide-react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Swords,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui";
import { Profile } from "@/types";
import { formatNumber, getWinColor, getTrophyChangeColor } from "@/utils";
import { UI } from "@/constants/labels";

interface ProfileStatGridProps {
  profile: Profile;
}

interface StatItem {
  label: string;
  value: string;
  valueClass: string;
  icon: LucideIcon;
  iconClass: string;
}

export function ProfileStatGrid({ profile }: ProfileStatGridProps) {
  const dailyTrophies = profile.daily_trophy_change;
  const dailyUp = dailyTrophies != null && dailyTrophies >= 0;

  const items: StatItem[] = [
    {
      label: "Кубки за день",
      value:
        dailyTrophies != null
          ? `${dailyTrophies > 0 ? "+" : ""}${dailyTrophies}`
          : "—",
      valueClass: getTrophyChangeColor(dailyTrophies ?? 0),
      icon: dailyUp ? TrendingUp : TrendingDown,
      iconClass: dailyUp ? "text-cr-win" : "text-cr-loss",
    },
    {
      label: "Трофеи",
      value: profile.trophies != null ? formatNumber(profile.trophies) : "—",
      valueClass: "text-cr-text",
      icon: Trophy,
      iconClass: "text-cr-blue",
    },
    {
      label: UI.winrate,
      value: profile.winrate != null ? `${profile.winrate.toFixed(1)}%` : "—",
      valueClass: getWinColor(profile.winrate ?? 50),
      icon: TrendingUp,
      iconClass: "text-cr-win",
    },
    {
      label: "Победы",
      value: profile.total_wins != null ? formatNumber(profile.total_wins) : "—",
      valueClass: "text-cr-text",
      icon: Swords,
      iconClass: "text-cr-win",
    },
    {
      label: "3 короны",
      value:
        profile.three_crown_wins != null
          ? formatNumber(profile.three_crown_wins)
          : "—",
      valueClass: "text-cr-text",
      icon: Crown,
      iconClass: "text-cr-gold",
    },
    {
      label: "Коллекция",
      value:
        profile.collection_level != null
          ? formatNumber(profile.collection_level)
          : "—",
      valueClass: "text-cr-gold",
      icon: Layers,
      iconClass: "text-cr-blue",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((item, index) => (
        <Card
          key={item.label}
          delay={index * 0.04}
          className="!py-2 !px-2 text-center flex flex-col items-center justify-center gap-0.5 min-h-[3.75rem] min-w-0"
        >
          <item.icon className={`w-5 h-5 shrink-0 ${item.iconClass}`} />
          <p className={`text-lg font-bold tabular-nums leading-none ${item.valueClass}`}>
            {item.value}
          </p>
          <p className="text-[10px] text-cr-muted leading-tight px-0.5">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}

export { ProfileStatGrid as default };
