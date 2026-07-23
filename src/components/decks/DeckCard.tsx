import { motion } from "framer-motion";
import { Copy, BarChart3, ChevronRight } from "lucide-react";
import { Deck } from "@/types";
import { formatNumber, getWinColor } from "@/utils";
import { UI } from "@/constants/labels";
import { Card, Button, LinearProgress, ElixirIcon } from "@/components/ui";
import { CardTile } from "@/components/cards";

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
      onClick={onOpen}
      className="relative"
    >
      <Card className="cursor-pointer overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-cr-blue bg-cr-blue/10 px-2.5 py-1 rounded-full border border-cr-blue/20">
            {deck.type === "rated" ? "Рейтинговые" : deck.type === "classic" ? "Обычные" : deck.type === "2v2" ? "2v2" : deck.type === "tournament" ? "Турнир" : "Путь Легенд"}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <ElixirIcon size={14} />
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

        <div className="grid grid-cols-4 gap-x-2 gap-y-1 mb-4">
          {deck.cards.map((card) => (
            <div key={card.id} className="min-w-0 overflow-hidden">
              <CardTile name={card.name} icon={card.icon} size="deck" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cr-muted">{UI.winrate}</span>
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

        <div className="mt-4 pt-4 border-t border-cr-border flex items-center justify-between">
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
          <ChevronRight className="w-4 h-4 text-cr-muted" />
        </div>
      </Card>
    </motion.div>
  );
}