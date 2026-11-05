import { recommendationViewForStatus } from "../src/components/analytics/recommendations/recommendationView.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const noDeck = recommendationViewForStatus("no_current_deck");
assert(!noDeck.showCurrentDeck && !noDeck.showMetaPriorities, "no-deck state must be explicit");

const noCollection = recommendationViewForStatus("no_collection");
assert(noCollection.showCurrentDeck && !noCollection.showMetaPriorities, "no-collection state must retain deck names");

const metaUnavailable = recommendationViewForStatus("meta_unavailable");
assert(metaUnavailable.showCurrentDeck && !metaUnavailable.showMetaPriorities, "missing meta must retain current deck facts");

const noMatches = recommendationViewForStatus("no_meta_matches");
assert(noMatches.showCurrentDeck && !noMatches.showMetaPriorities, "no-match state must retain current deck facts");

const ready = recommendationViewForStatus("ok");
assert(ready.showCurrentDeck && ready.showMetaPriorities && ready.showMetaFreshness, "ready state must show priorities and deck facts");

console.log("recommendationView.selftest OK");
