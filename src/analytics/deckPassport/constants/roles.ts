import type { CardRole } from "@/services/deckBuilder/types";

export interface RoleCheckItem {
  id: string;
  label: string;
  roles: CardRole[];
  /** Extra card names that satisfy the check */
  cards?: string[];
}

export const ROLE_BALANCE_CHECKS: RoleCheckItem[] = [
  { id: "win_condition", label: "Главная угроза", roles: ["win_condition"] },
  { id: "big_spell", label: "Большое заклинание", roles: ["big_spell"] },
  { id: "small_spell", label: "Малое заклинание", roles: ["small_spell"] },
  { id: "mini_tank", label: "Мини-танк", roles: ["mini_tank"] },
  { id: "tank", label: "Танк", roles: ["tank"] },
  { id: "anti_air", label: "Анти-воздух", roles: ["air_defense"] },
  { id: "splash", label: "Сплэш", roles: ["splash"] },
  { id: "dps", label: "Высокий DPS", roles: ["dps", "anti_tank"] },
  { id: "building", label: "Защитное здание", roles: ["building"] },
];
