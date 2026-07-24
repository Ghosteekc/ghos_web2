import { NavRowButton } from "./NavRowButton";

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
      {items.map((item) => (
        <NavRowButton
          key={item.id}
          label={item.label}
          emoji={item.emoji}
          active={activeId === item.id}
          onClick={() => onSelect(item.id)}
          className="pixel-btn--grid-cell"
        />
      ))}
    </div>
  );
}
