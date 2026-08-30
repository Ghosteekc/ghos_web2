import { Swords } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { useTelegram } from "@/hooks";
import { openClashRoyale } from "@/utils/openClashRoyale";
import { ApiError } from "@/api/client";

const NO_BATTLES_CODE = "E025";

const NO_BATTLES_RE =
  /нет данных о боях|сыграй(те)? несколько|для ведения статистики|пару (рейтинговых )?бо[её]в/i;

export function isNoBattlesError(error: unknown): boolean {
  if (error instanceof ApiError && error.code === NO_BATTLES_CODE) return true;
  if (error && typeof error === "object" && "code" in error) {
    if (String((error as { code?: unknown }).code ?? "") === NO_BATTLES_CODE) return true;
  }
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return NO_BATTLES_RE.test(text);
}

type NoBattlesHintProps = {
  className?: string;
  title?: string;
  description?: string;
};

/** Friendly empty state when CR battlelog has nothing useful yet. */
export function NoBattlesHint({
  className,
  title = "Пока нет боёв для статистики",
  description = "Если давно не играл, журнал боёв пока пуст. Сыграй пару рейтинговых матчей в Clash Royale — статистика подтянется сама.",
}: NoBattlesHintProps) {
  const { openLink } = useTelegram();

  return (
    <EmptyState
      className={className}
      icon={<Swords className="h-10 w-10 opacity-60" />}
      title={title}
      description={description}
      button="В бой!"
      onAction={() => openClashRoyale(openLink)}
    />
  );
}
