import { lossAnalysisEmptyMessage } from "../src/utils/lossAnalysisState.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(
  lossAnalysisEmptyMessage("no_battles", "Боёв пока нет. Сыграйте бой.", false) === "Боёв пока нет. Сыграйте бой.",
  "no_battles must tell the player to play and sync a battle",
);
assert(
  lossAnalysisEmptyMessage("no_losses", "В истории нет подтверждённых поражений.", false) === "В истории нет подтверждённых поражений.",
  "no_losses must not be rendered as an empty history",
);
assert(
  lossAnalysisEmptyMessage("insufficient", "Не удалось определить — не хватает данных.", false) === "Не удалось определить — не хватает данных.",
  "insufficient data must remain distinct from no battles",
);
assert(
  lossAnalysisEmptyMessage("error", "Не удалось определить — попробуйте позже.", false) === "Не удалось определить — попробуйте позже.",
  "temporary failure must not be rendered as no battles",
);
assert(
  lossAnalysisEmptyMessage("ok", null, true) === null,
  "a successful report must remain visible",
);

console.log("lossAnalysisState.selftest OK");
