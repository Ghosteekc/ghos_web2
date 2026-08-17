import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { HapticIntensity } from "@/utils/hapticManager";
import { cn } from "@/utils";

const INTENSITY_OPTIONS: { id: HapticIntensity; label: string }[] = [
  { id: "weak", label: "Слабая" },
  { id: "standard", label: "Стандартная" },
  { id: "strong", label: "Сильная" },
];

const MOVE_TWEEN = { type: "tween" as const, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };
const RELEASE_TWEEN = { type: "tween" as const, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

interface HapticSegmentProps {
  value: HapticIntensity;
  onChange: (intensity: HapticIntensity) => void;
  disabled?: boolean;
}

export function HapticSegment({ value, onChange, disabled = false }: HapticSegmentProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bubbleX = useMotionValue(0);
  const bubbleW = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const [ready, setReady] = useState(false);
  const activeIndex = Math.max(
    0,
    INTENSITY_OPTIONS.findIndex((option) => option.id === value),
  );
  const focusIndexRef = useRef(activeIndex);

  const measureTab = useCallback((index: number): { x: number; width: number } | null => {
    const track = trackRef.current;
    const item = itemRefs.current[index];
    if (!track || !item) return null;
    const trackRect = track.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    return {
      x: itemRect.left - trackRect.left,
      width: itemRect.width,
    };
  }, []);

  const snapBubble = useCallback(
    (index: number) => {
      const m = measureTab(index);
      if (!m) return;
      bubbleX.set(m.x);
      bubbleW.set(m.width);
      scaleX.set(1);
      scaleY.set(1);
      focusIndexRef.current = index;
    },
    [bubbleW, bubbleX, measureTab, scaleX, scaleY],
  );

  const slideBubble = useCallback(
    (fromIndex: number, toIndex: number) => {
      const target = measureTab(toIndex);
      if (!target) return;

      if (
        fromIndex === toIndex &&
        Math.abs(bubbleX.get() - target.x) < 0.5 &&
        Math.abs(bubbleW.get() - target.width) < 0.5
      ) {
        snapBubble(toIndex);
        return;
      }

      const tabSteps = Math.max(1, Math.abs(toIndex - fromIndex));
      void animate(bubbleW, target.width, MOVE_TWEEN);
      void animate(bubbleX, target.x, {
        ...MOVE_TWEEN,
        onUpdate: (latest) => {
          const pull = Math.abs(latest - target.x);
          const stretch = Math.min(pull / 90, 0.14) * Math.min(tabSteps, 2);
          scaleX.set(1 + stretch);
          scaleY.set(1 - stretch * 0.45);
        },
        onComplete: () => {
          focusIndexRef.current = toIndex;
          void animate(scaleX, 1, RELEASE_TWEEN);
          void animate(scaleY, 1, RELEASE_TWEEN);
        },
      });
    },
    [bubbleW, bubbleX, measureTab, scaleX, scaleY, snapBubble],
  );

  useLayoutEffect(() => {
    if (!ready) {
      snapBubble(activeIndex);
      setReady(true);
      return;
    }
    slideBubble(focusIndexRef.current, activeIndex);
  }, [activeIndex, ready, slideBubble, snapBubble]);

  useEffect(() => {
    const onResize = () => snapBubble(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex, snapBubble]);

  return (
    <div
      ref={trackRef}
      className={cn("theme-segment-track theme-segment-track--intensity", disabled && "is-disabled")}
      role="radiogroup"
      aria-label="Мощность вибрации"
      aria-disabled={disabled}
    >
      <motion.div
        className="theme-segment-bubble theme-segment-bubble--pill"
        style={{ x: bubbleX, width: bubbleW, scaleX, scaleY }}
        aria-hidden
      >
        <span className="theme-segment-bubble-glass" />
        <span className="theme-segment-bubble-ring" />
      </motion.div>

      {INTENSITY_OPTIONS.map((option, index) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-label={option.label}
            aria-checked={active}
            disabled={disabled}
            className={cn("theme-segment-tab segment-tab theme-segment-tab--label", active && "is-active")}
            onClick={() => {
              if (disabled || option.id === value) return;
              onChange(option.id);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
