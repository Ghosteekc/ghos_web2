import { cn } from "@/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
}

export function Skeleton({ className = "", variant = "rectangular", width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-cr-card via-cr-surface to-cr-card bg-[length:200%_100%] rounded-xl",
        {
          "rounded-full": variant === "circular",
          "rounded-xl": variant === "rectangular",
          "h-4 max-w-[200px]": variant === "text",
        },
        className
      )}
      style={{ width, height }}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  className?: string;
}

export function SkeletonGroup({ count = 3, className = "" }: SkeletonGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}