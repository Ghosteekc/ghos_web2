export type PopularityTrend = "up" | "down" | "stable";

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function linearSlope(values: number[]) {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let index = 0; index < n; index += 1) {
    sumX += index;
    sumY += values[index];
    sumXY += index * values[index];
    sumXX += index * index;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Trend matches the right edge of the popularity sparkline:
 * first compare the last day vs the previous day, then the 7-day slope.
 */
export function derivePopularityTrend(values: number[]): PopularityTrend {
  if (values.length < 2) return "stable";

  const tailLen = Math.min(7, values.length);
  const tail = values.slice(-tailLen);
  const tailSum = tail.reduce((sum, value) => sum + value, 0);
  if (tailSum <= 0) return "stable";

  const last = tail[tail.length - 1];
  const prev = tail[tail.length - 2];
  const segmentThreshold = Math.max(1, prev * 0.15);

  if (prev > 0) {
    const segmentChange = last - prev;
    if (segmentChange <= -segmentThreshold) return "down";
    if (segmentChange >= segmentThreshold) return "up";
  }

  const slope = linearSlope(tail);
  const slopeThreshold = Math.max(0.35, mean(tail) * 0.12);
  if (slope >= slopeThreshold) return "up";
  if (slope <= -slopeThreshold) return "down";
  return "stable";
}
