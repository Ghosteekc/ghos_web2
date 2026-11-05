import assert from "node:assert/strict";
import test from "node:test";

import { getCardCollectionAvailability } from "../src/components/recommendations/collectionAvailability.ts";

test("a card present in the collection reports its level", () => {
  assert.deepEqual(
    getCardCollectionAvailability("Hog Rider", [
      { name: "Hog Rider", owned: true, level: 14 },
    ]),
    { status: "owned", level: 14 },
  );
});

test("an explicit unowned card is distinct from unavailable collection data", () => {
  assert.deepEqual(
    getCardCollectionAvailability("Hog Rider", [
      { name: "Hog Rider", owned: false, level: null },
    ]),
    { status: "missing" },
  );
  assert.deepEqual(getCardCollectionAvailability("Hog Rider", null), {
    status: "unknown",
  });
});

test("a partial response never turns an omitted card into an unowned card", () => {
  assert.deepEqual(
    getCardCollectionAvailability("Hog Rider", [
      { name: "Fireball", owned: true, level: 14 },
    ]),
    { status: "unknown" },
  );
  assert.deepEqual(
    getCardCollectionAvailability("Hog Rider", [
      { name: "Hog Rider", level: 14 },
    ]),
    { status: "unknown" },
  );
});

test("an owned card with an absent level remains owned with an unknown level", () => {
  assert.deepEqual(
    getCardCollectionAvailability("Hog Rider", [
      { name: "Hog Rider", owned: true, level: null },
    ]),
    { status: "owned", level: null },
  );
});
