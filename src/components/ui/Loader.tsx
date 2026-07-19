import { useEffect, useState } from "react";

const DEFAULT_LOADING_ITEMS = [
  "колод",
  "матчапов",
  "боёв",
  "статистики",
  "соперников",
  "рекомендаций",
  "карт",
] as const;

interface LoaderProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  /** Что загружается — слова по очереди под «Загрузка» */
  items?: string[];
  /** Интервал смены подписи, мс */
  intervalMs?: number;
}

const Loader = ({
  compact = false,
  showLabel = true,
  className = "",
  items = [...DEFAULT_LOADING_ITEMS],
  intervalMs = 900,
}: LoaderProps) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!showLabel || items.length <= 1) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 120);
    }, intervalMs);

    return () => {
      clearInterval(tick);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [showLabel, items, intervalMs]);

  const current = items[index] ?? items[0];

  return (
    <div
      className={`flex flex-col items-center justify-center ${compact ? "py-2" : "py-12"} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={showLabel ? `Загрузка ${current}` : "Загрузка"}
    >
      <img
        src="/pekka-butterfly.gif"
        alt=""
        aria-hidden
        className={`object-contain ${compact ? "w-10 h-10" : "w-36 h-36"}`}
      />
      {showLabel && (
        <div className={`text-center ${compact ? "mt-2" : "mt-4"}`}>
          <p className={`text-cr-muted ${compact ? "text-xs" : "text-sm"}`}>Загрузка</p>
          <p
            className={`text-cr-gold/90 font-medium transition-all duration-150 ease-in-out ${
              compact ? "mt-0.5 text-[11px] min-h-[1rem]" : "mt-1 text-xs min-h-[1.125rem]"
            } ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-40 translate-y-0 scale-[0.98]"}`}
          >
            {current}
          </p>
        </div>
      )}
    </div>
  );
};

export { Loader, DEFAULT_LOADING_ITEMS };
export default Loader;
