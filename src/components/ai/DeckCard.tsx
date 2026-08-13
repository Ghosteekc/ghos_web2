import { Download } from "lucide-react";
import { CardTile } from "@/components/cards";
import { Button, ElixirIcon } from "@/components/ui";
import { useTelegram } from "@/hooks";
import type { AiDeckCardData } from "@/components/ai/chatTypes";
import { cn } from "@/utils";

type Props = {
  deck: AiDeckCardData;
};

export function DeckCard({ deck }: Props) {
  const { openLink, showAlert } = useTelegram();
  const cards = (deck.deck || []).slice(0, 8);
  const importUrl = (deck.import_url || "").trim();
  const canImport = Boolean(importUrl);
  const elixir = Number(deck.average_elixir) || 0;
  const title = deck.title || deck.archetype || "Колода";
  const showArchetype = Boolean(deck.archetype && deck.archetype !== title);

  const onImport = () => {
    if (!importUrl) return;
    if (openLink) {
      openLink(importUrl);
      return;
    }
    try {
      window.open(importUrl, "_blank", "noopener,noreferrer");
    } catch {
      showAlert?.("Не удалось открыть ссылку импорта");
    }
  };

  if (cards.length < 8) return null;

  const elixirTone =
    elixir > 3.5 ? "text-cr-loss" : elixir < 2.8 ? "text-cr-win" : "text-cr-text";

  return (
    <div className="ai-deck-card">
      <div className="ai-deck-card-head">
        <div className="min-w-0 flex-1">
          <p className="ai-deck-card-title truncate">{title}</p>
          {(showArchetype || deck.arena) && (
            <div className="ai-deck-card-tags">
              {showArchetype ? (
                <span className="ai-deck-card-tag">{deck.archetype}</span>
              ) : null}
              {deck.arena && !/^Арена\s+\d{5,}$/i.test(deck.arena) ? (
                <span className="ai-deck-card-tag">{deck.arena}</span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="ai-deck-card-grid">
        {cards.map((name, index) => (
          <div key={`${name}-${index}`} className="min-w-0 overflow-hidden">
            <CardTile name={name} size="deck" showLabel={false} />
          </div>
        ))}
      </div>

      <div className="ai-deck-card-elixir-row">
        <span className="text-cr-muted">Средний эликсир</span>
        <div className={cn("ai-deck-card-elixir", elixirTone)} title="Средний эликсир">
          <ElixirIcon size={14} />
          <span>{elixir.toFixed(1)}</span>
        </div>
      </div>

      {canImport ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onImport}
          className="ai-deck-card-import"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden />
          Импортировать
        </Button>
      ) : null}
    </div>
  );
}
