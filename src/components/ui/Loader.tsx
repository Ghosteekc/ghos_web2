import { useEffect, useState } from "react";
import { cn } from "@/utils";

const DEFAULT_LOADING_ITEMS = [
  "колод",
  "матчапов",
  "боёв",
  "статистики",
  "соперников",
  "рекомендаций",
  "карт",
] as const;

export type LoaderVariant = "page" | "section";

interface LoaderProps {
  /** page — крупный робот; section — компактная загрузка вкладок/блоков */
  variant?: LoaderVariant;
  compact?: boolean;
  /** Ещё компактнее: только точки, для инпутов и мелких слотов */
  inline?: boolean;
  showLabel?: boolean;
  className?: string;
  /** Что загружается — слова по очереди под «Загрузка» (только page) */
  items?: readonly string[];
  /** Интервал смены подписи, мс */
  intervalMs?: number;
  /** Короткая подпись для section-лоадера */
  label?: string;
}

type LoadingRobotSize = "page" | "section" | "compact" | "inline";

function LoadingRobot({ size }: { size: LoadingRobotSize }) {
  return (
    <div className={`loading-robot loading-robot--${size}`} aria-hidden>
      <span className="loading-robot__glow" />
      <img
        src="/ghosteek-robot.png"
        alt=""
        className="loading-robot__image"
        draggable={false}
      />
    </div>
  );
}

function SectionLoader({
  showLabel = true,
  className = "",
  label = "Загрузка",
  compact = false,
  inline = false,
}: Pick<LoaderProps, "showLabel" | "className" | "label" | "compact" | "inline">) {
  return (
    <div
      className={cn(
        "section-loader",
        compact && "section-loader--compact",
        inline && "section-loader--inline",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={showLabel ? label : "Загрузка"}
    >
      <LoadingRobot size={inline ? "inline" : compact ? "compact" : "section"} />
      {showLabel && !inline ? <p className="section-loader__label">{label}</p> : null}
    </div>
  );
}

const Loader = ({
  variant = "page",
  compact = false,
  inline = false,
  showLabel = true,
  className = "",
  items = DEFAULT_LOADING_ITEMS,
  intervalMs = 1200,
  label = "Загрузка",
}: LoaderProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (variant !== "page" || !showLabel || items.length <= 1) return;

    const tick = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(tick);
  }, [variant, showLabel, items, intervalMs]);

  if (variant === "section" || compact || inline) {
    return (
      <SectionLoader
        showLabel={showLabel}
        className={className}
        label={label}
        compact={compact || inline}
        inline={inline}
      />
    );
  }

  const current = items[index] ?? items[0];

  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={showLabel ? `Загрузка ${current}` : "Загрузка"}
    >
      <div className="page-loader__hero">
        <LoadingRobot size="page" />
      </div>
      {showLabel && (
        <div className="text-center mt-5">
          <p className="text-cr-muted loader-title text-base">Загрузка</p>
          <div className="relative overflow-hidden mt-1 min-h-[1.35rem]">
            <p
              key={current}
              className="text-cr-gold/90 font-medium origin-center loader-item loader-item-enter text-sm"
            >
              {current}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { Loader, SectionLoader, LoadingRobot, DEFAULT_LOADING_ITEMS };
export default Loader;
