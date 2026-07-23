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
    <div className="grid grid-cols-2 gap-1.5">
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
            <span className="text-xl leading-none" aria-hidden>
              {item.emoji}
            </span>
            <span className="text-[11px] font-semibold text-cr-text leading-tight px-0.5">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
