import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui";
import { useFavoriteDecks } from "@/hooks/FavoriteDecksProvider";
import { cn } from "@/utils";

interface FavoriteDeckButtonProps {
  cards: string[];
  onMessage: (msg: string) => void;
  className?: string;
}

export function FavoriteDeckButton({ cards, onMessage, className }: FavoriteDeckButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoriteDecks();
  const [busy, setBusy] = useState(false);
  const active = cards.length === 8 && isFavorite(cards);

  if (cards.length !== 8) return null;

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const added = await toggleFavorite(cards);
      onMessage(added ? "Колода добавлена в избранное" : "Колода удалена из избранного");
    } catch {
      onMessage("Не удалось обновить избранное");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "!px-3 shrink-0 transition-colors",
        active && "text-cr-gold",
        className,
      )}
      disabled={busy}
      onClick={() => void handleClick()}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      aria-pressed={active}
    >
      <Star
        className={cn(
          "w-4 h-4 transition-colors",
          active && "fill-cr-gold text-cr-gold",
        )}
      />
    </Button>
  );
}
