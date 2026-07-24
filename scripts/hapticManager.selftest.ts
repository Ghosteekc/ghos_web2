/**
 * Runtime checks for hapticManager.
 * Run: npx tsx scripts/hapticManager.selftest.ts
 */

const globalWindow = globalThis as typeof globalThis & { window?: Window & typeof globalThis };
globalWindow.window = globalThis as Window & typeof globalThis;

async function main() {
  const {
    haptic,
    hapticManager,
    isHapticEnabled,
    setHapticEnabled,
    triggerHaptic,
  } = await import("../src/utils/hapticManager");

  let impactCalls = 0;
  let notificationCalls = 0;

  globalWindow.window!.Telegram = {
    WebApp: {
      HapticFeedback: {
        impactOccurred: () => {
          impactCalls += 1;
        },
        selectionChanged: () => {},
        notificationOccurred: () => {
          notificationCalls += 1;
        },
      },
    },
  } as unknown as Window["Telegram"];

  function resetCounts() {
    impactCalls = 0;
    notificationCalls = 0;
  }

  setHapticEnabled(true);
  resetCounts();
  haptic.light();
  if (impactCalls !== 1) throw new Error("haptic.light should call impactOccurred once");

  resetCounts();
  setHapticEnabled(false);
  haptic.medium();
  if (impactCalls !== 0) throw new Error("disabled haptic must not call impactOccurred");

  delete globalWindow.window!.Telegram;
  resetCounts();
  setHapticEnabled(true);
  haptic.success();
  if (notificationCalls !== 0) throw new Error("missing Telegram API must skip silently");

  globalWindow.window!.Telegram = {
    WebApp: {
      HapticFeedback: {
        impactOccurred: () => {
          impactCalls += 1;
        },
        selectionChanged: () => {},
        notificationOccurred: () => {},
      },
    },
  } as unknown as Window["Telegram"];

  resetCounts();
  haptic.double();
  if (impactCalls < 1) throw new Error("double should trigger at least one impact");

  resetCounts();
  haptic.confirm();
  if (impactCalls !== 1) throw new Error("confirm should trigger medium impact once");

  resetCounts();
  triggerHaptic("selection");
  if (impactCalls !== 0) throw new Error("selection should not use impactOccurred");

  resetCounts();
  hapticManager.important();
  if (impactCalls < 1) throw new Error("important alias should still work");

  if (!isHapticEnabled()) throw new Error("haptic should remain enabled");

  console.log("hapticManager.selftest OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
