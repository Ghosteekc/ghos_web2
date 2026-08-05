import { Download } from "lucide-react";
import { CardTile } from "@/components/cards";
import { ElixirIcon } from "@/components/ui";
import { useTelegram } from "@/hooks";
import type { AiDeckCardData } from "@/components/ai/chatTypes";

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

  return (
    <div className="ai-deck-card">
      <div className="ai-deck-card-head">
        <div className="min-w-0">
          <p className="ai-deck-card-title truncate">{title}</p>
          {deck.archetype && deck.archetype !== title ? (
            <p className="ai-deck-card-meta truncate">{deck.archetype}</p>
          ) : null}
          {deck.arena ? <p className="ai-deck-card-meta truncate">{deck.arena}</p> : null}
        </div>
        <div className="ai-deck-card-elixir" title="Средний эликсир">
          <ElixirIcon size={14} />
          <span>{elixir.toFixed(1)}</span>
        </div>
      </div>

      <div className="ai-deck-card-grid">
        {cards.map((name, index) => (
          <div key={`${name}-${index}`} className="min-w-0">
            <CardTile name={name} size="deck" showLabel={false} />
          </div>
        ))}
      </div>

      {canImport ? (
        <button type="button" className="ai-deck-card-import" onClick={onImport}>
          <Download className="w-4 h-4 shrink-0" aria-hidden />
          Импортировать
        </button>
      ) : null}
    </div>
  );
}
