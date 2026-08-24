import { Star } from "lucide-react";
import { cn } from "@/utils";

interface ProStarPriceProps {
  stars: number;
  className?: string;
  size?: "md" | "lg" | "xl";
  suffix?: string;
}

const sizeClasses = {
  md: { wrap: "text-xl", icon: "w-4 h-4" },
  lg: { wrap: "text-2xl", icon: "w-5 h-5" },
  xl: { wrap: "text-3xl", icon: "w-6 h-6" },
};

/** Telegram Stars price — gold Star icon + tabular amount. */
export function ProStarPrice({ stars, className, size = "lg", suffix }: ProStarPriceProps) {
  const s = sizeClasses[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-extrabold tabular-nums text-cr-gold leading-none",
        s.wrap,
        className,
      )}
    >
      <span>{stars}</span>
      <Star className={cn(s.icon, "fill-cr-gold text-cr-gold shrink-0")} aria-hidden />
      {suffix ? <span className="text-sm font-semibold text-cr-muted ml-0.5">{suffix}</span> : null}
    </span>
  );
}
