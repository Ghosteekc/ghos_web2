import { motion } from "framer-motion";
import { Copy, BarChart3, ChevronRight, Zap } from "lucide-react";
import { Deck } from "@/types";
import { formatNumber, getWinColor } from "@/utils";
import { Card, Button, LinearProgress } from "@/components/ui";
import { cn } from "@/utils";

interface DeckCardProps {
  deck: Deck;
  index: number;
  onOpen: () => void;
}

export function DeckCard({ deck, index, onOpen }: DeckCardProps) {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cardNames = deck.cards.map((c) => c.name).join("\n");
    void navigator.clipboard.writeText(cardNames);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onOpen}
      className="group relative"
    >
      <Card className="cursor-pointer overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-cr-blue bg-cr-blue/10 px-2.5 py-1 rounded-full border border-cr-blue/20">
            {deck.type === "rated" ? "Рейтинговые" : deck.type === "classic" ? "Обычные" : deck.type === "2v2" ? "2v2" : deck.type === "tournament" ? "Турнир" : "Путь Легенд"}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <Zap className="w-3.5 h-3.5 text-cr-muted" />
            <span
              className={
                "font-semibold " +
                (deck.avg_elixir > 3.5 ? "text-cr-loss" : deck.avg_elixir < 2.8 ? "text-cr-win" : "text-cr-text")
              }
            >
              {deck.avg_elixir.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {deck.cards.map((card, i) => (
            <div
              key={card.id}
              className="aspect-square rounded-xl bg-cr-bg/60 border border-cr-border flex items-center justify-center text-2xl hover:scale-105 hover:border-cr-gold/30 transition-all duration-200"
            >
              {card.icon ? (
                <img src={card.icon} alt={card.name} className="w-8 h-8 object-contain" loading="lazy" />
              ) : (
                "🃏"
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cr-muted">Winrate</span>
            <div className="flex items-center gap-2">
              <LinearProgress
                value={deck.winrate}
                color={deck.winrate >= 50 ? "#22c55e" : "#ef4444"}
                className="w-24"
                showLabel={false}
              />
              <span className={"font-semibold w-12 text-right " + getWinColor(deck.winrate)}>
                {deck.winrate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-cr-muted">Игр</span>
            <span className="font-semibold text-cr-text">{formatNumber(deck.total_games)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-cr-border flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCopy} className="!px-3 !py-2 text-xs">
              <Copy className="w-4 h-4 mr-1.5" />
              Копировать
            </Button>
            <Button variant="ghost" className="!px-3 !py-2 text-xs">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Статистика
            </Button>
          </div>
          <ChevronRight className="w-4 h-4 text-cr-muted group-hover:text-cr-gold transition-colors" />
        </div>
      </Card>
    </motion.div>
  );
}