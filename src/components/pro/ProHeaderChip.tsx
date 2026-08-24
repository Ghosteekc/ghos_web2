import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { cn } from "@/utils";
import type { SubscriptionInfo } from "@/types";
import { formatProExpiry } from "./proFeatures";

type ChipState = "active" | "expired" | "free";

function resolveState(sub: SubscriptionInfo | null | undefined): ChipState {
  if (!sub) return "free";
  if (sub.is_pro ?? sub.active) return "active";
  if (sub.expired || sub.expires_at) return "expired";
  return "free";
}

/**
 * Compact Ghosteek Pro control for page headers (top-right, aligned with title).
 */
export function ProHeaderChip({
  subscription,
  className,
}: {
  subscription?: SubscriptionInfo | null;
  className?: string;
}) {
  const navigate = useNavigate();
  const state = resolveState(subscription);
  const until = formatProExpiry(subscription?.expires_at);

  const label =
    state === "active" ? (until ? `Pro · до ${until}` : "Pro") : state === "expired" ? "Pro · истек" : "Ghosteek Pro";

  return (
    <button
      type="button"
      onClick={() => navigate("/pro")}
      className={cn(
        "inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5",
        "text-sm font-extrabold tracking-wide border transition-transform",
        "active:scale-[0.97] shadow-glow",
        state === "active"
          ? "bg-gradient-to-r from-cr-gold to-amber-400 text-cr-bg border-cr-gold/80"
          : state === "expired"
            ? "bg-cr-loss/20 text-cr-loss border-cr-loss/50"
            : "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white border-fuchsia-300/40",
        className,
      )}
      aria-label="Ghosteek Pro"
    >
      <Crown className="w-4 h-4 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
