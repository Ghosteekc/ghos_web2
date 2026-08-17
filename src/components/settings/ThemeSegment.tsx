import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Moon, Smartphone, Sun, type LucideIcon } from "lucide-react";
import type { AppTheme } from "@/hooks/useTheme";
import { cn } from "@/utils";

const THEME_OPTIONS: { id: AppTheme; label: string; Icon: LucideIcon }[] = [
  { id: "dark", label: "Тёмная", Icon: Moon },
  { id: "light", label: "Светлая", Icon: Sun },
  { id: "auto", label: "Системная", Icon: Smartphone },
];

const MOVE_TWEEN = { type: "tween" as const, duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };
const RELEASE_TWEEN = { type: "tween" as const, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const };

interface ThemeSegmentProps {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
}

export function ThemeSegment({ value, onChange }: ThemeSegmentProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bubbleX = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const [ready, setReady] = useState(false);
  const activeIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.id === value),
  );
  const focusIndexRef = useRef(activeIndex);

  const measureCenterX = useCallback((index: number): number | null => {
    const track = trackRef.current;
    const item = itemRefs.current[index];
    if (!track || !item) return null;
    const trackRect = track.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    return itemRect.left - trackRect.left + itemRect.width / 2;
  }, []);

  const snapBubble = useCallback(
    (index: number) => {
      const x = measureCenterX(index);
      if (x == null) return;
      bubbleX.set(x);
      scaleX.set(1);
      scaleY.set(1);
      focusIndexRef.current = index;
    },
    [bubbleX, measureCenterX, scaleX, scaleY],
  );

  const slideBubble = useCallback(
    (fromIndex: number, toIndex: number) => {
      const target = measureCenterX(toIndex);
      if (target == null) return;

      if (fromIndex === toIndex && Math.abs(bubbleX.get() - target) < 0.5) {
        snapBubble(toIndex);
        return;
      }

      const tabSteps = Math.max(1, Math.abs(toIndex - fromIndex));
      void animate(bubbleX, target, {
        ...MOVE_TWEEN,
        onUpdate: (latest) => {
          const pull = Math.abs(latest - target);
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
    [bubbleX, measureCenterX, scaleX, scaleY, snapBubble],
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
      className="theme-segment-track"
      role="radiogroup"
      aria-label="Тема"
    >
      <motion.div
        className="theme-segment-bubble"
        style={{ x: bubbleX, scaleX, scaleY }}
        aria-hidden
      >
        <span className="theme-segment-bubble-glass" />
        <span className="theme-segment-bubble-ring" />
      </motion.div>

      {THEME_OPTIONS.map((option, index) => {
        const active = option.id === value;
        const Icon = option.Icon;
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
            className={cn("theme-segment-tab segment-tab", active && "is-active")}
            onClick={() => {
              if (option.id === value) return;
              onChange(option.id);
            }}
          >
            <Icon className="w-4 h-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
