import { useNavigate } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/utils";
import { PRO_TITLE, proFeature } from "./proFeatures";

const DEFAULT_CTA = "Открыть Ghosteek Pro";

function useProNavigate() {
  const navigate = useNavigate();
  return () => navigate("/pro");
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-cr-gold/15 border border-cr-gold/40 text-cr-gold text-2xs font-bold uppercase tracking-wider",
        className,
      )}
    >
      <Crown className="w-3 h-3" aria-hidden />
      Pro
    </span>
  );
}

export interface ProLockCardProps {
  /** Feature id from the Pro catalog — fills title and description. */
  feature?: string | null;
  title?: string;
  description?: string;
  cta?: string;
  className?: string;
  compact?: boolean;
}

/** Inline «this needs Pro» card with a CTA to /pro. */
export function ProLockCard({
  feature,
  title,
  description,
  cta = DEFAULT_CTA,
  className,
  compact = false,
}: ProLockCardProps) {
  const goPro = useProNavigate();
  const known = proFeature(feature);
  const heading = title ?? known?.title ?? PRO_TITLE;
  const text =
    description ??
    known?.description ??
    "Эта функция доступна в Ghosteek Pro.";

  return (
    <Card className={cn("border-cr-gold/25", compact ? "!p-3" : undefined, className)}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-cr-gold/15 border border-cr-gold/30 flex items-center justify-center">
          <Lock className="w-4 h-4 text-cr-gold" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-cr-text">{heading}</h3>
            <ProBadge />
          </div>
          <p className="text-sm text-cr-muted leading-snug mt-1">{text}</p>
          <Button variant="primary" className="!py-2 !px-3 text-sm mt-3" onClick={goPro}>
            {cta}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Full-screen gate used instead of a page body for FREE users. */
export function ProGate({
  feature,
  title,
  description,
  className,
}: {
  feature?: string | null;
  title?: string;
  description?: string;
  className?: string;
}) {
  const goPro = useProNavigate();
  const known = proFeature(feature);
  const Icon = known?.icon ?? Crown;

  return (
    <div className={cn("flex flex-col items-center text-center gap-4 py-10", className)}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cr-gold/30 to-cr-blue/20 border border-cr-gold/40 flex items-center justify-center shadow-glow">
        <Icon className="w-7 h-7 text-cr-gold" aria-hidden />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-extrabold text-cr-text">
          {title ?? known?.title ?? PRO_TITLE}
        </h2>
        <p className="text-sm text-cr-muted leading-relaxed">
          {description ?? known?.description ?? "Функция доступна в Ghosteek Pro."}
        </p>
      </div>
      <Button variant="primary" onClick={goPro}>
        {DEFAULT_CTA}
      </Button>
    </div>
  );
}