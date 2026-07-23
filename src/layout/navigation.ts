import type { LucideIcon } from "lucide-react";
import { User, ChartColumn, Layers, Swords, Settings } from "lucide-react";

export type MainNavId = "profile" | "analytics" | "decks" | "battles" | "settings";

export interface MainNavItem {
  id: MainNavId;
  to: string;
  icon: LucideIcon;
  label: string;
}

export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { id: "profile", to: "/", icon: User, label: "Профиль" },
  { id: "analytics", to: "/analytics", icon: ChartColumn, label: "Аналитика" },
  { id: "decks", to: "/decks", icon: Layers, label: "Колоды" },
  { id: "battles", to: "/battles", icon: Swords, label: "Бои" },
  { id: "settings", to: "/settings", icon: Settings, label: "Настройки" },
];

const PROFILE_PREFIXES = ["/profile", "/player"];
const DECKS_PREFIXES = ["/decks", "/favorites"];

export function getActiveNavId(pathname: string): MainNavId {
  if (pathname === "/" || PROFILE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return "profile";
  }
  if (pathname.startsWith("/analytics")) return "analytics";
  if (DECKS_PREFIXES.some((p) => pathname.startsWith(p))) return "decks";
  if (pathname.startsWith("/battles")) return "battles";
  if (pathname.startsWith("/settings")) return "settings";
  return "profile";
}
