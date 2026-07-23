import { ChevronRight } from "lucide-react";

export interface FeatureNavItem {
  id: string;
  label: string;
  emoji: string;
}

interface FeatureNavGridProps {
  items: FeatureNavItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function FeatureNavGrid({ items, activeId, onSelect }: FeatureNavGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`feature-nav-btn${isActive ? " feature-nav-btn--active" : ""}`}
            aria-pressed={isActive}
          >
            <span className="feature-nav-btn-icon" aria-hidden>
              {item.emoji}
            </span>
            <span className="feature-nav-btn-label">{item.label}</span>
            <ChevronRight className="feature-nav-btn-chevron" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
