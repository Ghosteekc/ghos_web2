import { MOTION_EASE, MOTION_MS } from "./tokens";

const easeOut = [...MOTION_EASE.out] as [number, number, number, number];
const easeStandard = [...MOTION_EASE.standard] as [number, number, number, number];

/** Framer tween presets aligned with MOTION_MS. */
export const motionTween = {
  fast: { type: "tween" as const, duration: MOTION_MS.fast / 1000, ease: easeOut },
  normal: { type: "tween" as const, duration: MOTION_MS.normal / 1000, ease: easeStandard },
  page: { type: "tween" as const, duration: MOTION_MS.page / 1000, ease: easeOut },
  slow: { type: "tween" as const, duration: MOTION_MS.slow / 1000, ease: easeOut },
};

/** Bottom nav bubble — короче и без «пружины» на дальних табах. */
export const navBubbleTween = {
  near: { type: "tween" as const, duration: MOTION_MS.normal / 1000, ease: easeOut },
  stretch: { type: "tween" as const, duration: MOTION_MS.fast / 1000, ease: easeOut },
};

export const navPressSpring = {
  press: { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.5 },
  release: { type: "spring" as const, stiffness: 420, damping: 30, mass: 0.55 },
};
