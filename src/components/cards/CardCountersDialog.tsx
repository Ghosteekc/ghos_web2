import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { CardCountersData, CollectionCardEntry } from "@/types";
import { CardTile } from "./CardTile";

interface CardCountersDialogProps {
  card: CollectionCardEntry | null;
  onClose: () => void;
}

function CounterGrid({ cards, empty }: { cards: CardCountersData["counters"]; empty: string }) {
  if (!cards.length) {
    return <p className="py-3 text-sm text-cr-muted">{empty}</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
      {cards.map((item) => (
        <div key={item.name} className="min-w-0">
          <CardTile name={item.name} size="deck" showLabel />
        </div>
      ))}
    </div>
  );
}

export function CardCountersDialog({ card, onClose }: CardCountersDialogProps) {
  const [data, setData] = useState<CardCountersData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    let active = true;
    setData(null);
    setError(null);
    void api.getCardCounters(card.name).then(
      (result) => {
        if (active) setData(result);
      },
      (reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Не удалось загрузить контры");
      },
    );
    return () => {
      active = false;
    };
  }, [card]);

  useEffect(() => {
    if (!card) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, onClose]);

  return (
    <AnimatePresence>
      {card ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={`Контры карты ${card.name_ru}`}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cr-accent/45 bg-cr-surface p-4 shadow-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 330, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-5 flex items-center gap-3">
              <div className="w-14 shrink-0"><CardTile name={card.name} size="sm" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-cr-accent">Контры карты</p>
                <h2 className="truncate text-lg font-bold text-cr-text">{card.name_ru}</h2>
              </div>
              <button type="button" className="pixel-btn !p-2" onClick={onClose} aria-label="Закрыть">
                <X className="h-5 w-5" />
              </button>
            </header>

            {error ? (
              <p className="rounded-xl border border-cr-loss/35 bg-cr-loss/10 p-3 text-sm text-cr-loss">{error}</p>
            ) : !data ? (
              <p className="py-8 text-center text-sm text-cr-muted">Загружаем контры…</p>
            ) : (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-cr-win">Контрит</h3>
                  <p className="mb-3 text-xs text-cr-muted">Сильные контры выбранной карты</p>
                  <CounterGrid cards={data.counters} empty="Нет подтверждённых сильных контр." />
                </section>
                <section className="border-t border-cr-border pt-5">
                  <h3 className="text-sm font-bold text-cr-loss">Контрят карту</h3>
                  <p className="mb-3 text-xs text-cr-muted">Сильные ответы против выбранной карты</p>
                  <CounterGrid cards={data.countered_by} empty="Нет подтверждённых сильных ответов." />
                </section>
              </div>
            )}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
