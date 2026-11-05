import type { MetaUpgradeRecommendationsData } from "../../../types/index.ts";

export function recommendationViewForStatus(status: MetaUpgradeRecommendationsData["status"]) {
  return {
    showMetaPriorities: status === "ok",
    showCurrentDeck: status !== "no_current_deck",
    showMetaFreshness: status === "ok",
  };
}
