import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { applyRenderProfile, readCurrentProfile } from "./applyProfile";
import { detectInitialProfile, downgradeProfile, prefersReducedMotion } from "./detectProfile";
import type { PerfSnapshot, RenderProfile } from "./types";
import { PROFILE_TOKENS } from "./types";

type PerfContextValue = {
  snapshot: PerfSnapshot;
  setProfile: (profile: RenderProfile) => void;
};

const PerfContext = createContext<PerfContextValue | null>(null);

function sampleFps(durationMs: number): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    let last = start;

    const tick = (now: number) => {
      frames += 1;
      last = now;
      if (now - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        const elapsed = Math.max(1, last - start);
        resolve((frames * 1000) / elapsed);
      }
    };
    requestAnimationFrame(tick);
  });
}

export function PerfProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PerfSnapshot>(() => {
    const profile = readCurrentProfile() || detectInitialProfile();
    return applyRenderProfile(profile, null);
  });
  const lockedRef = useRef(false);

  const setProfile = useCallback((profile: RenderProfile) => {
    lockedRef.current = true;
    setSnapshot((prev) => applyRenderProfile(profile, prev.fps));
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setSnapshot(applyRenderProfile("low", null));
      return;
    }

    let cancelled = false;
    const run = async () => {
      // Дать UI стабилизироваться, затем измерить FPS и при необходимости снизить профиль.
      await new Promise((r) => setTimeout(r, 900));
      if (cancelled || lockedRef.current) return;
      const fps = await sampleFps(1200);
      if (cancelled || lockedRef.current) return;

      let next = readCurrentProfile();
      if (fps < 42 && next !== "low") {
        next = downgradeProfile(next);
      } else if (fps < 50 && next === "high") {
        next = "medium";
      }
      setSnapshot(applyRenderProfile(next, Math.round(fps)));
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ snapshot, setProfile }), [snapshot, setProfile]);

  return createElement(PerfContext.Provider, { value }, children);
}

export function usePerfProfile(): PerfContextValue {
  const ctx = useContext(PerfContext);
  if (!ctx) {
    const profile = readCurrentProfile();
    const tokens = PROFILE_TOKENS[profile];
    return {
      snapshot: {
        profile,
        blurPx: tokens.blurPx,
        seedBlurPx: tokens.seedBlurPx,
        glassAlpha: tokens.glassAlpha,
        glowScale: tokens.glowScale,
        shadowScale: tokens.shadowScale,
        durationMs: tokens.durationMs,
        durationFastMs: tokens.durationFastMs,
        enterYPx: tokens.enterYPx,
        fps: null,
        cores: navigator.hardwareConcurrency || 4,
        memoryGb: typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null,
        touch: false,
        reducedMotion: false,
      },
      setProfile: (p) => applyRenderProfile(p, null),
    };
  }
  return ctx;
}
