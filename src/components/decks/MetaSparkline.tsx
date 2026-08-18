import { cn } from "@/utils";

type MetaSparklineProps = {
  values: number[];
  className?: string;
};

export function MetaSparkline({ values, className }: MetaSparklineProps) {
  if (values.length < 2 || values.every((v) => v <= 0)) {
    return (
      <p className={cn("text-xs text-cr-muted", className)}>Недостаточно истории</p>
    );
  }

  const width = 160;
  const height = 20;
  const pad = 1.5;
  const max = Math.max(...values, 1);
  const step = (width - pad * 2) / (values.length - 1);
  const points = values
    .map((value, index) => {
      const x = pad + index * step;
      const y = height - pad - (value / max) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={cn("meta-deck-sparkline", className)}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
