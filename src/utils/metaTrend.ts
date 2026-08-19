const TREND_UP_PCT = 12;
const TREND_DOWN_PCT = -12;

function trendFromCounts(
  recent: number,
  previous: number,
): { trend: "up" | "down" | "stable"; percent: number | null } {
  if (previous <= 0 && recent <= 0) {
    return { trend: "stable", percent: null };
  }
  if (previous <= 0) {
    return { trend: "stable", percent: null };
  }

  const percent = Math.round(((recent - previous) / previous) * 1000) / 10;
  if (percent >= TREND_UP_PCT) {
    return { trend: "up", percent };
  }
  if (percent <= TREND_DOWN_PCT) {
    return { trend: "down", percent };
  }
  return { trend: "stable", percent };
}

export function derivePopularityTrend(values: number[]) {
  if (values.length < 4) {
    return { trend: "stable" as const, percent: null };
  }

  const window = Math.min(7, Math.max(3, Math.floor(values.length / 4)));
  if (values.length >= window * 2) {
    const recent = values.slice(-window).reduce((sum, value) => sum + value, 0);
    const previous = values.slice(-window * 2, -window).reduce((sum, value) => sum + value, 0);

    if (values.length >= 3) {
      const tail = values.slice(-3);
      if (tail[0] > tail[1] && tail[1] > tail[2] && tail[0] >= 2) {
        const tailPercent = Math.round(((tail[2] - tail[0]) / tail[0]) * 1000) / 10;
        if (tailPercent <= -15) {
          return { trend: "down" as const, percent: tailPercent };
        }
      }
    }

    return trendFromCounts(recent, previous);
  }

  const half = Math.max(1, Math.floor(values.length / 2));
  const recent = values.slice(-half).reduce((sum, value) => sum + value, 0);
  const previous = values.slice(0, half).reduce((sum, value) => sum + value, 0);
  return trendFromCounts(recent, previous);
}
