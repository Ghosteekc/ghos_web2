import { NavLink } from "react-router-dom";
import {
  User,
  BarChart3,
  GitCompare,
  History,
  Search,
  Star,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  { to: "/", icon: User, label: "Профиль" },
  { to: "/battles", icon: History, label: "Бои" },
  { to: "/decks", icon: GitCompare, label: "Колоды" },
  { to: "/analytics", icon: BarChart3, label: "Аналитика" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/favorites", icon: Star, label: "Избранное" },
  { to: "/settings", icon: Settings, label: "Настройки" },
];

export function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <nav
      className={cn("sidebar-nav", isOpen && "open")}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-cr-gold to-yellow-600 flex items-center justify-center shadow-glow">
            <Trophy className="w-6 h-6 text-cr-bg" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-cr text-cr-text tracking-tight truncate">Ghosteek</h1>
            <p className="text-xs text-cr-muted -mt-1 truncate">CR Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 shrink-0"
          aria-label="Закрыть меню"
        >
          <X className="w-5 h-5 text-cr-muted" />
        </button>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              cn("sidebar-item group", isActive && "active")
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "sidebar-icon",
                    isActive ? "text-cr-gold" : "text-cr-muted group-hover:text-cr-text"
                  )}
                />
                <span className="text-sm font-medium tracking-wide truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
