import type { UpgradeCurrentDeckCard as UpgradeCurrentDeckCardData } from "@/types";

export function CurrentDeckCard({
  card,
  collectionAvailable,
}: {
  card: UpgradeCurrentDeckCardData;
  collectionAvailable: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cr-border bg-cr-card p-3">
      <div className="flex h-[3.75rem] w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cr-border bg-cr-surface">
        {card.icon ? (
          <img src={card.icon} alt={card.name_ru} className="h-full w-full object-contain p-0.5" loading="lazy" />
        ) : (
          <span className="text-lg" aria-hidden>🃏</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-cr-text">{card.name_ru}</p>
        {card.level != null ? (
          <p className="text-sm text-cr-muted">
            Уровень <span className="tabular-nums text-cr-text">{card.level}</span>
            {card.max_level != null ? <> из <span className="tabular-nums text-cr-text">{card.max_level}</span></> : null}
          </p>
        ) : (
          <p className="text-sm text-cr-muted">
            {collectionAvailable ? "Уровень карты не указан API" : "API не вернул коллекцию и уровень карты"}
          </p>
        )}
      </div>
    </div>
  );
}
