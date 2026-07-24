import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils";

export interface NavRowButtonProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  emoji?: string;
  hint?: string;
  active?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-pressed"?: boolean;
}

export function NavRowButton({
  label,
  onClick,
  icon: Icon,
  emoji,
  hint,
  active = false,
  className,
  type = "button",
  disabled,
  "aria-pressed": ariaPressed,
}: NavRowButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={ariaPressed ?? active}
      className={cn(
        "pixel-btn pixel-btn--nav",
        active && "pixel-btn--active",
        className,
      )}
    >
      <span className="pixel-btn-icon-slot" aria-hidden>
        {emoji ? (
          <span className="pixel-btn-emoji">{emoji}</span>
        ) : Icon ? (
          <Icon className="pixel-btn-icon" strokeWidth={2.25} />
        ) : null}
      </span>
      <span className="pixel-btn-text">
        <span className="pixel-btn-label">{label}</span>
        {hint ? <span className="pixel-btn-hint">{hint}</span> : null}
      </span>
      <ChevronRight className="pixel-btn-chevron" aria-hidden />
    </button>
  );
}
