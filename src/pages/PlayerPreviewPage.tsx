import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Crown,
  ExternalLink,
  Flame,
  MapPinned,
  Swords,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, ApiError, isProRequiredError } from "@/api/client";
import { ProGate } from "@/components/pro";
import { SearchResult } from "@/types";
import { Button, Card, ElixirIcon, Loader, ErrorState, EmptyState, PageHeader } from "@/components/ui";
import { PlayerDeckGrid } from "@/components/cards";
import { FavoriteDeckButton } from "@/components/decks/FavoriteDeckButton";
import { LeagueBanner, resolveLeagueInfo } from "@/components/profile/LeagueBanner";
import { formatFullNumber, formatPlayerTag, getWinColor } from "@/utils";
import { useCardCatalog, usePageRefresh, useTelegram } from "@/hooks";
import { UI } from "@/constants/labels";

interface StatTile {
  label: string;
  value: string;
  valueClass?: string;
  icon: LucideIcon;
  iconClass: string;
  span?: boolean;
}

export function PlayerPreviewPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { openLink } = useTelegram();
  const { nameRu } = useCardCatalog();
  const [player, setPlayer] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proLocked, setProLocked] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tag) return;
    try {
      setError(null);
      setProLocked(false);
      setPlayer(await api.getPlayerPreview(tag));
    } catch (e) {
      setPlayer(null);
      if (isProRequiredError(e)) {
        setProLocked(true);
        setError(null);
      } else {
        setError(e instanceof ApiError ? e.message : "Игрок не найден");
      }
    } finally {
      setLoading(false);
    }
  }, [tag]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const importDeck = async (deckLink: string) => {
    if (openLink) {
      openLink(deckLink);
      setHint("Открываем Clash Royale для импорта колоды…");
      setTimeout(() => setHint(null), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(deckLink);
      setHint("Ссылка на колоду скопирована");
    } catch {
      setHint("Откройте приложение из Telegram для импорта колоды");
    }
    setTimeout(() => setHint(null), 3000);
  };

  const cards = player?.cards ?? [];
  const hasDeck = cards.length === 8;

  const stats: StatTile[] = player
    ? [
        {
          label: "Кубки",
          value: formatFullNumber(player.trophies),
          icon: Trophy,
          iconClass: "text-cr-gold",
        },
        {
          label: "Макс.",
          value:
            player.max_trophies != null ? formatFullNumber(player.max_trophies) : "—",
          icon: Crown,
          iconClass: "text-cr-gold",
        },
        {
          label: UI.winrate,
          value:
            player.winrate != null ? `${player.winrate.toFixed(1)}%` : "н/д",
          valueClass:
            player.winrate != null ? getWinColor(player.winrate) : "text-cr-muted",
          icon: TrendingUp,
          iconClass:
            player.winrate != null && player.winrate >= 50
              ? "text-cr-win"
              : "text-cr-muted",
        },
        {
          label: "Победы",
          value:
            player.total_wins != null ? formatFullNumber(player.total_wins) : "—",
          icon: Swords,
          iconClass: "text-cr-win",
        },
        {
          label: "Арена",
          value: player.arena || "—",
          icon: MapPinned,
          iconClass: "text-cr-blue",
          span: true,
        },
        ...(player.clan_name
          ? [
              {
                label: "Клан",
                value: player.clan_name,
                icon: Users,
                iconClass: "text-cr-muted",
                span: true,
              } satisfies StatTile,
            ]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Игрок"
        action={
          <Button variant="ghost" onClick={() => navigate(-1)} className="!p-2 shrink-0" aria-label="Назад">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />

      {loading ? (
        <Loader />
      ) : proLocked ? (
        <ProGate feature="player_search" />
      ) : error || !player ? (
        <ErrorState title={error ?? "Не найден"} />
      ) : (
        <>
          <Card className="overflow-hidden relative !p-3">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cr-blue/20 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[2px] shadow-glow overflow-hidden">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.player_name}
                      className="w-full h-full rounded-full object-cover bg-cr-surface scale-125"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-cr-surface flex items-center justify-center text-2xl font-extrabold text-cr-gold">
                      {player.player_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-cr-text truncate">
                  {player.player_name}
                </h2>
                <p className="text-cr-accent text-base font-bold font-mono mt-1">
                  {formatPlayerTag(player.player_tag)}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-cr-blue/10 border border-cr-blue/20 text-cr-blue text-sm font-medium max-w-full">
                  {player.arena_icon ? (
                    <img src={player.arena_icon} alt="" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    <Flame className="w-3 h-3 shrink-0" />
                  )}
                  <span className="truncate">{player.arena || "Арена неизвестна"}</span>
                </span>
                {player.favorite_card ? (
                  <p className="text-sm text-cr-gold font-bold mt-2 truncate">
                    ★ {nameRu(player.favorite_card)}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="!py-3 !px-4">
            <LeagueBanner league={resolveLeagueInfo(player.league, player.trophies)} />
          </Card>

          <div className="grid grid-cols-2 gap-1.5">
            {stats.map((item, index) => (
              <Card
                key={item.label}
                delay={index * 0.04}
                className={
                  "!py-2.5 !px-2 text-center flex flex-col items-center justify-center gap-0.5 min-h-[3.75rem] min-w-0 " +
                  (item.span ? "col-span-2" : "")
                }
              >
                <item.icon className={`w-5 h-5 shrink-0 ${item.iconClass}`} />
                <p
                  className={
                    "text-[16px] font-bold tabular-nums leading-tight truncate max-w-full px-1 " +
                    (item.valueClass ?? "text-cr-text")
                  }
                >
                  {item.value}
                </p>
                <p className="text-2xs text-cr-muted leading-tight">{item.label}</p>
              </Card>
            ))}
          </div>

          {player.recent_games && player.recent_games > 0 && player.recent_winrate != null ? (
            <p className="text-xs text-cr-muted text-center -mt-3">
              Из последних {player.recent_games} боёв на лестнице:{" "}
              <span className={"font-semibold " + getWinColor(player.recent_winrate)}>
                {player.recent_winrate.toFixed(0)}%
              </span>
            </p>
          ) : null}

          <Card className="!p-3">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-cr-text">Любимая колода</h3>
                <p className="text-xs text-cr-muted mt-0.5">
                  {hasDeck
                    ? "Текущая колода из профиля Clash Royale"
                    : "Колода пока недоступна"}
                </p>
              </div>
              {hasDeck ? (
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-center justify-end gap-1 text-sm">
                    <ElixirIcon size={14} />
                    <span className="font-semibold text-cr-text">
                      {(player.avg_elixir ?? 0).toFixed(1)}
                    </span>
                  </div>
                  {(player.deck_games ?? 0) > 0 && player.deck_winrate != null ? (
                    <p className={"text-sm font-bold " + getWinColor(player.deck_winrate)}>
                      {UI.winrateShort} {player.deck_winrate.toFixed(0)}% · {player.deck_games}{" "}
                      {UI.battles}
                    </p>
                  ) : (
                    <p className="text-xs text-cr-muted">Винрейт колоды: н/д</p>
                  )}
                </div>
              ) : null}
            </div>

            {hasDeck ? (
              <>
                <PlayerDeckGrid cards={cards} size="deck" className="mb-3" />
                <div className="flex gap-2">
                  {player.deck_link ? (
                    <Button
                      variant="secondary"
                      className="flex-1 !py-2 text-base flex items-center justify-center gap-2"
                      onClick={() => void importDeck(player.deck_link!)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Импорт колоды
                    </Button>
                  ) : (
                    <p className="flex-1 text-sm text-cr-muted text-center self-center">
                      Импорт недоступен
                    </p>
                  )}
                  <FavoriteDeckButton
                    cards={cards.map((c) => c.name)}
                    onMessage={(msg) => {
                      setHint(msg);
                      setTimeout(() => setHint(null), 3000);
                    }}
                  />
                </div>
              </>
            ) : (
              <EmptyState title="Не удалось загрузить текущую колоду игрока" />
            )}
          </Card>

          {hint ? (
            <p className="text-center text-sm text-cr-gold font-medium">{hint}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export { PlayerPreviewPage as default };
