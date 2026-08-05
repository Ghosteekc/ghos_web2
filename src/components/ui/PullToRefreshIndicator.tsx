import { PULL_THRESHOLD } from "@/hooks/usePullToRefresh";

const SIZE = 36;
const STROKE = 3.25;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PullToRefreshIndicator({
  refreshing,
  pullDistance,
  threshold = PULL_THRESHOLD,
}: {
  refreshing: boolean;
  pullDistance: number;
  threshold?: number;
}) {
  if (pullDistance < 6 && !refreshing) return null;

  const progress = Math.min(1, Math.max(0, pullDistance / threshold));
  const armed = progress >= 1;
  const dashOffset = CIRCUMFERENCE * (1 - (refreshing ? 1 : progress));
  // Lift slightly with the pull so the gesture feels physical.
  const lift = refreshing ? 10 : Math.min(18, pullDistance * 0.22);

  return (
    <div
      className="fixed left-1/2 z-30 flex -translate-x-1/2 pointer-events-none"
      style={{
        top: `calc(var(--mobile-header-offset) - 0.35rem + ${lift}px)`,
        opacity: refreshing ? 1 : 0.35 + progress * 0.65,
        transition: refreshing ? "top 160ms ease-out, opacity 160ms ease-out" : undefined,
      }}
      aria-hidden
    >
      <div
        className={
          "relative flex items-center justify-center rounded-full bg-cr-card/90 shadow-lg " +
          (refreshing ? "ptr-spinner-spin" : "")
        }
        style={{
          width: SIZE,
          height: SIZE,
          boxShadow: armed || refreshing
            ? "0 0 0 1px rgb(var(--cr-gold) / 0.35), 0 6px 16px rgb(0 0 0 / 0.35)"
            : "0 4px 12px rgb(0 0 0 / 0.28)",
          transform: !refreshing && armed ? "scale(1.06)" : "scale(1)",
          transition: "transform 140ms ease-out, box-shadow 140ms ease-out",
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgb(var(--cr-gold) / 0.22)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgb(var(--cr-gold))"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{
              transition: refreshing
                ? undefined
                : "stroke-dashoffset 40ms linear",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
