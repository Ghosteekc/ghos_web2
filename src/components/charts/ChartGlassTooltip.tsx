import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export const ChartTooltipAnchorContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function ChartTooltipAnchor({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <ChartTooltipAnchorContext.Provider value={anchorRef}>
      <div ref={anchorRef} className={className}>
        {children}
      </div>
    </ChartTooltipAnchorContext.Provider>
  );
}

type TooltipCoordinate = { x?: number; y?: number };

export function ChartGlassTooltipShell({
  active,
  coordinate,
  children,
  offsetY = 10,
}: {
  active?: boolean;
  coordinate?: TooltipCoordinate;
  children: ReactNode;
  offsetY?: number;
}) {
  const anchorRef = useContext(ChartTooltipAnchorContext);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!active || !anchorRef?.current || coordinate?.x == null || coordinate?.y == null) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      setPosition({
        left: rect.left + coordinate.x!,
        top: rect.top + coordinate.y!,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [active, anchorRef, coordinate?.x, coordinate?.y]);

  if (!active || !position) return null;

  return createPortal(
    <div
      className="chart-tooltip-glass px-3 py-2 text-xs shadow-lg"
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        transform: `translate(-50%, calc(-100% - ${offsetY}px))`,
        zIndex: 10000,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
