export type LossAnalysisStatus = "ok" | "no_battles" | "no_losses" | "insufficient" | "error";

/**
 * Returns the user-facing empty state only when the API explicitly reports
 * that analysis has no report to show. Old API payloads keep the legacy UI.
 */
export function lossAnalysisEmptyMessage(
  status: LossAnalysisStatus | undefined,
  message: string | null | undefined,
  hasReportContent: boolean,
): string | null {
  if (!status || status === "ok" || hasReportContent) return null;
  return message || "Не удалось определить";
}
