import { useState } from "react";
import { Gem } from "lucide-react";
import { Button, Card } from "@/components/ui";

interface ProCreditsCardProps {
  balance: number;
  maxSharePercent?: number;
  rewardAmount?: number;
}

export function ProCreditsCard({
  balance,
  maxSharePercent = 50,
  rewardAmount = 10,
}: ProCreditsCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-2" aria-labelledby="pro-credits-heading">
      <h2 id="pro-credits-heading" className="text-base font-semibold text-cr-text">
        Ghosteek Credits
      </h2>
      <Card className="!p-4 glass-card ui-enter">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-cr-gold/15 border border-cr-gold/30 flex items-center justify-center">
            <Gem className="w-5 h-5 text-cr-gold" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-extrabold text-cr-text tabular-nums leading-none">
              {balance}{" "}
              <span className="text-base font-bold text-cr-muted">Credits</span>
            </p>
            <p className="text-sm text-cr-muted leading-snug mt-1.5">
              Credits можно использовать для оплаты до {maxSharePercent}% стоимости Pro. Credits
              хранятся без ограничений по времени.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full mt-3 !py-2 text-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Скрыть" : "Как получить Credits?"}
        </Button>

        {open ? (
          <p className="mt-3 text-sm text-cr-muted leading-snug">
            Приглашай друзей в Ghosteek. За каждого приведённого друга вы и ваш друг получаете по +
            {rewardAmount} Credits.
          </p>
        ) : null}
      </Card>
    </section>
  );
}
