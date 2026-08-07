import { useEffect, useState } from "react";
import { usePerfProfile } from "./PerfProvider";
import type { RenderProfile } from "./types";

/**
 * Только DEV. Production tree-shake через import.meta.env.DEV.
 */
export function PerfDevOverlay() {
  if (!import.meta.env.DEV) return null;
  return <PerfDevOverlayInner />;
}

function PerfDevOverlayInner() {
  const { snapshot, setProfile } = usePerfProfile();
  const [liveFps, setLiveFps] = useState<number | null>(snapshot.fps);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        setLiveFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fps = liveFps ?? snapshot.fps ?? "—";
  const cost =
    snapshot.profile === "high" ? "100%" : snapshot.profile === "medium" ? "~70%" : "~40%";

  return (
    <div
      className="perf-dev-overlay"
      role="status"
      aria-label="Performance overlay"
    >
      <div className="perf-dev-overlay__row">
        <strong>FPS</strong> <span>{fps}</span>
      </div>
      <div className="perf-dev-overlay__row">
        <strong>Profile</strong>{" "}
        <select
          value={snapshot.profile}
          onChange={(e) => setProfile(e.target.value as RenderProfile)}
          className="perf-dev-overlay__select"
        >
          <option value="high">HIGH</option>
          <option value="medium">MEDIUM</option>
          <option value="low">LOW</option>
        </select>
      </div>
      <div className="perf-dev-overlay__row">
        <strong>Blur</strong> <span>{snapshot.blurPx}px</span>
      </div>
      <div className="perf-dev-overlay__row">
        <strong>Anim</strong> <span>{snapshot.durationMs}ms</span>
      </div>
      <div className="perf-dev-overlay__row">
        <strong>Cost</strong> <span>{cost}</span>
      </div>
      <div className="perf-dev-overlay__row perf-dev-overlay__meta">
        cores {snapshot.cores}
        {snapshot.memoryGb != null ? ` · ${snapshot.memoryGb}GB` : ""}
        {snapshot.touch ? " · touch" : " · pointer"}
      </div>
    </div>
  );
}
