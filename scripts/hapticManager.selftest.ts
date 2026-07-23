/**
 * Runtime checks for hapticManager.
 * Run: npx tsx scripts/hapticManager.selftest.ts
 */
import {
  hapticManager,
  isHapticEnabled,
  setHapticEnabled,
  triggerHaptic,
} from "../src/utils/hapticManager";

let impactCalls = 0;
let notificationCalls = 0;

(window as unknown as { Telegram?: unknown }).Telegram = {
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
};

function resetCounts() {
  impactCalls = 0;
  notificationCalls = 0;
}

setHapticEnabled(true);
resetCounts();
triggerHaptic("lightTap");
if (impactCalls !== 1) throw new Error("lightTap should call impactOccurred once");

resetCounts();
setHapticEnabled(false);
triggerHaptic("lightTap");
if (impactCalls !== 0) throw new Error("disabled haptic must not call impactOccurred");

delete (window as unknown as { Telegram?: unknown }).Telegram;
resetCounts();
setHapticEnabled(true);
triggerHaptic("success");
if (notificationCalls !== 0) throw new Error("missing Telegram API must skip silently");

(window as unknown as { Telegram?: unknown }).Telegram = {
  WebApp: {
    HapticFeedback: {
      impactOccurred: () => {
        impactCalls += 1;
      },
      selectionChanged: () => {},
      notificationOccurred: () => {},
    },
  },
};
resetCounts();
hapticManager.important();
if (impactCalls < 1) throw new Error("important should trigger at least one impact");

if (!isHapticEnabled()) throw new Error("haptic should remain enabled");

console.log("hapticManager.selftest OK");
