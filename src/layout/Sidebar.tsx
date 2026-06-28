import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  User,
  BarChart3,
  GitCompare,
  History,
  TrendingUp,
  Search,
  Star,
  Settings,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/profile", icon: User, label: "Профиль" },
  { to: "/analytics", icon: BarChart3, label: "Аналитика" },
  { to: "/decks", icon: GitCompare, label: "Колоды" },
  { to: "/battles", icon: History, label: "История" },
  { to: "/stats", icon: TrendingUp, label: "Статистика" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/favorites", icon: Star, label: "Любимые" },
  { to: "/settings", icon: Settings, label: "Настройки" },
];

export function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 h-full w-64 z-50 glass-panel border-r border-cr-border flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cr-gold to-yellow-600 flex items-center justify-center shadow-glow">
            <Trophy className="w-6 h-6 text-cr-bg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-cr-text tracking-tight">Ghosteek</h1>
            <p className="text-xs text-cr-muted -mt-1">CR Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5 text-cr-muted" />
        </button>
      </div>

      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "sidebar-item group",
                isActive && "active"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-cr-gold" : "text-cr-muted group-hover:text-cr-text"
                  )}
                />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}