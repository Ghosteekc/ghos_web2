import { useNavigate } from "react-router-dom";
import { ChevronRight, Crown } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/utils";
import type { SubscriptionInfo } from "@/types";
import { PRO_TAGLINE, PRO_TITLE, daysLeftWord, formatProExpiry } from "./proFeatures";

type BannerState = "active" | "expired" | "free";

function resolveState(sub: SubscriptionInfo | null | undefined): BannerState {
  if (!sub) return "free";
  if (sub.is_pro ?? sub.active) return "active";
  if (sub.expired || sub.expires_at) return "expired";
  return "free";
}

/** Compact Ghosteek Pro row on the profile screen; navigates to /pro. */
export function ProStatusBanner({
  subscription,
  className,
}: {
  subscription: SubscriptionInfo | null | undefined;
  className?: string;
}) {
  const navigate = useNavigate();
  const state = resolveState(subscription);
  const until = formatProExpiry(subscription?.expires_at);
  const daysLeft = subscription?.days_left ?? null;

  const subtitle =
    state === "active"
      ? daysLeft != null && daysLeft > 0
        ? `Активен · ${daysLeft} ${daysLeftWord(daysLeft)}${until ? ` · до ${until}` : ""}`
        : until
          ? `Активен · до ${until}`
          : "Активен"
      : state === "expired"
        ? `Подписка истекла${until ? ` ${until}` : ""} — продлить`
        : PRO_TAGLINE;

  return (
    <Card
      className={cn(
        "!py-3 !px-4",
        state === "active" ? "border-cr-gold/40 shadow-glow" : "border-cr-gold/20",
        className,
      )}
      onClick={() => navigate("/pro")}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border",
            state === "active"
              ? "bg-cr-gold/20 border-cr-gold/50"
              : "bg-cr-surface border-cr-border",
          )}
        >
          <Crown
            className={cn("w-5 h-5", state === "active" ? "text-cr-gold" : "text-cr-muted")}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-cr-text truncate">{PRO_TITLE}</p>
          <p
            className={cn(
              "text-sm truncate",
              state === "active"
                ? "text-cr-gold"
                : state === "expired"
                  ? "text-cr-loss"
                  : "text-cr-muted",
            )}
          >
            {subtitle}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-cr-muted shrink-0" aria-hidden />
      </div>
    </Card>
  );
}
