import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Copy,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { Card, Button, Loader, Skeleton } from "@/components/ui";
import { api } from "@/api/client";
import { Deck } from "@/types";

export function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const deckTypes = ["all", "rated", "classic", "2v2", "tournament", "legend_path"];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getDecks(filter);
        setDecks(res.decks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cr-text tracking-tight">Колоды</h1>
        <span className="text-sm text-cr-muted">{decks.length} колод</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {deckTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 " +
              (filter === type
                ? "bg-cr-gold text-cr-bg shadow-glow"
                : "bg-cr-card text-cr-muted hover:text-cr-text border border-cr-border")
            }
          >
            {type === "all" ? "Все" : type === "rated" ? "Рейтинговые" : type === "classic" ? "Обычные" : type === "2v2" ? "2v2" : type === "tournament" ? "Турнир" : "Путь Легенд"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGroup count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {decks.map((deck, i) => (
            <DeckCard key={deck.id} deck={deck} index={i} onOpen={() => navigate(`/decks/${deck.id}`)} />
          ))}
          {decks.length === 0 && (
            <Card className="col-span-full text-center">
              <SlidersHorizontal className="w-12 h-12 text-cr-muted mx-auto mb-3 opacity-50" />
              <p className="text-cr-muted">Колоды не найдены</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export { DecksPage as default };

function DeckCard({ deck, index, onOpen }: { deck: Deck; index: number; onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      whileHover={{ y: -6 }}
      onClick={onOpen}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-cr-blue bg-cr-blue/10 px-2.5 py-1 rounded-full border border-cr-blue/20">
            {deck.type === "rated" ? "Рейтинговые" : deck.type === "classic" ? "Обычные" : "2v2"}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-cr-gold" />
            <span className="font-semibold text-cr-text">{deck.avg_elixir.toFixed(1)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {deck.cards.map((card) => (
            <div
              key={card.id}
              className="aspect-square rounded-xl bg-cr-bg/60 border border-cr-border flex items-center justify-center text-2xl hover:scale-105 transition-transform"
            >
              {card.icon ? (
                <img src={card.icon} alt={card.name} className="w-8 h-8 object-contain" loading="lazy" />
              ) : (
                "🃏"
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-cr-muted">Winrate</span>
          <span className={"font-bold " + (deck.winrate >= 50 ? "text-cr-win" : "text-cr-loss")}>
            {deck.winrate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-cr-muted">Игр</span>
          <span className="font-semibold text-cr-text">{deck.total_games}</span>
        </div>
      </Card>
    </motion.div>
  );
}

import { SkeletonGroup } from "@/components/ui";