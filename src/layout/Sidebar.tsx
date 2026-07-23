import { NavLink, useLocation } from "react-router-dom";
import { Trophy } from "lucide-react";
import { cn } from "@/utils";
import { MAIN_NAV_ITEMS, getActiveNavId } from "./navigation";

export function Sidebar() {
  const { pathname } = useLocation();
  const activeId = getActiveNavId(pathname);

  return (
    <nav className="sidebar-nav" aria-label="Навигация">
      <div className="flex items-center gap-3 px-4 py-4 shrink-0 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-cr-gold to-yellow-600 flex items-center justify-center shadow-glow">
          <Trophy className="w-6 h-6 text-cr-bg" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-cr text-cr-text tracking-tight truncate">Ghosteek</h1>
          <p className="text-xs text-cr-muted -mt-1 truncate">CR Assistant</p>
        </div>
      </div>

      <div className="flex-1 px-3 pb-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/"}
              className={cn("sidebar-item group", isActive && "active")}
            >
              <item.icon
                className={cn(
                  "sidebar-icon",
                  isActive ? "text-cr-gold" : "text-cr-muted"
                )}
              />
              <span className="text-sm font-medium tracking-wide truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
