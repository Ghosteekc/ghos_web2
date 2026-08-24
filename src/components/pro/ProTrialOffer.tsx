import { Gift, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";

interface ProTrialOfferProps {
  trialDays: number;
  loading?: boolean;
  onStart: () => void;
}

export function ProTrialOffer({ trialDays, loading = false, onStart }: ProTrialOfferProps) {
  return (
    <Card className="pro-trial-offer glass-card ui-enter !p-4 border-cr-blue/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-cr-blue/15 border border-cr-blue/30 flex items-center justify-center">
          <Gift className="w-5 h-5 text-cr-blue" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-extrabold text-cr-text">Пробный период</h3>
          <p className="text-sm text-cr-muted leading-snug mt-1">
            {trialDays} дней бесплатно — полный доступ ко всем Pro-функциям. Один раз на аккаунт.
          </p>
          <Button
            variant="secondary"
            className="w-full !py-2.5 text-base mt-3"
            disabled={loading}
            onClick={onStart}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Активируем…
              </>
            ) : (
              "Попробовать бесплатно"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
