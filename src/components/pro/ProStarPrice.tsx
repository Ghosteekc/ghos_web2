import { Star } from "lucide-react";
import { cn } from "@/utils";

interface ProStarPriceProps {
  stars: number;
  className?: string;
  size?: "md" | "lg" | "xl";
  suffix?: string;
  /** inherit — matches parent text (e.g. primary CTA); accent — gold on dark panels */
  tone?: "accent" | "inherit";
}

const sizeClasses = {
  md: { wrap: "text-xl", icon: "w-4 h-4" },
  lg: { wrap: "text-2xl", icon: "w-5 h-5" },
  xl: { wrap: "text-3xl", icon: "w-6 h-6" },
};

/** Telegram Stars price — gold Star icon + tabular amount. */
export function ProStarPrice({
  stars,
  className,
  size = "lg",
  suffix,
  tone = "accent",
}: ProStarPriceProps) {
  const s = sizeClasses[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-extrabold tabular-nums leading-none",
        tone === "inherit"
          ? "pro-star-price--inherit text-inherit [&_svg]:fill-current [&_svg]:text-current"
          : "text-cr-gold [&_svg]:fill-cr-gold [&_svg]:text-cr-gold",
        s.wrap,
        className,
      )}
    >
      <span>{stars}</span>
      <Star className={cn(s.icon, "shrink-0")} aria-hidden />
      {suffix ? <span className="text-sm font-semibold text-cr-muted ml-0.5">{suffix}</span> : null}
    </span>
  );
}
