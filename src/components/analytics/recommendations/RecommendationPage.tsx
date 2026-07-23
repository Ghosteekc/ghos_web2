import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { Card, Button, Loader } from "@/components/ui";
import { usePageRefresh } from "@/hooks";
import type { ArenaDecksData, PlayerCollectionData, Profile } from "@/types";
import { cn } from "@/utils";
import { ARENA_RECOMMENDATIONS } from "./arenaRecommendations";
import { RecommendationCard } from "./RecommendationCard";
import {
  evaluateAllArenas,
  evaluateArenaProgress,
  resolvePlayerArenaNumber,
  type ArenaProgressSummary,
} from "./recommendationEngine";

function ErrorCard({ message }: { message: string }) {
  return <Card className="text-center text-cr-loss text-sm">{message}</Card>;
}

function ArenaProgressHeader({ summary }: { summary: ArenaProgressSummary }) {
  return (
    <div className="rounded-xl border border-cr-gold/25 bg-cr-gold/5 p-4">
      <h3 className="text-sm font-semibold text-cr-text">Приоритет прокачки аккаунта</h3>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-[11px] text-cr-muted">Ваш прогресс</p>
          <p className="text-xl font-bold text-cr-gold tabular-nums">{summary.progressPercent}%</p>
        </div>
        <div>
          <p className="text-[11px] text-cr-muted">Соответствуют арене</p>
          <p className="text-xl font-bold text-cr-win tabular-nums">
            {summary.meetingCount} из {summary.totalCount}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-cr-muted">Требуют улучшения</p>
          <p className="text-xl font-bold text-cr-gold tabular-nums">{summary.needsUpgradeCount}</p>
        </div>
        <div>
          <p className="text-[11px] text-cr-muted">Рекомендуемый уровень</p>
          <p className="text-xl font-bold text-cr-text tabular-nums">{summary.recommendedLevel}+</p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-cr-border overflow-hidden">
        <div
          className="h-full rounded-full bg-cr-gold transition-[width] duration-300 ease-out"
          style={{ width: `${summary.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function ArenaBlock({
  summary,
  highlighted,
  onNavigate,
  blockRef,
}: {
  summary: ArenaProgressSummary;
  highlighted: boolean;
  onNavigate: () => void;
  blockRef: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={blockRef}
      id={`arena-block-${summary.arena}`}
      className={cn(
        "scroll-mt-24 rounded-2xl border p-4 transition-colors duration-300",
        highlighted
          ? "border-cr-gold/50 bg-cr-gold/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      <button
        type="button"
        onClick={onNavigate}
        className="w-full flex items-center justify-between gap-3 text-left group"
      >
        <div>
          <p className="text-xs text-cr-muted">Арена {summary.arena}</p>
          <h4 className="text-base font-semibold text-cr-text group-hover:text-cr-gold transition-colors">
            {summary.arenaName}
          </h4>
          <p className="text-[11px] text-cr-muted mt-1">
            Рекомендуемый уровень карт: {summary.recommendedLevel}+ · Прогресс {summary.progressPercent}%
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-cr-muted shrink-0 group-hover:text-cr-gold transition-colors" />
      </button>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.cards.map((card) => (
          <RecommendationCard key={card.cardName} card={card} />
        ))}
      </div>
    </div>
  );
}

export function RecommendationsPanel() {
  const [profile, setProfile] = useState<Profile | null>(() => cacheGet<Profile>("profile-v4"));
  const [collection, setCollection] = useState<PlayerCollectionData | null>(() =>
    cacheGet<PlayerCollectionData>("player-collection-v12"),
  );
  const [loading, setLoading] = useState(
    () => !cacheHas("profile-v4") || !cacheHas("player-collection-v12"),
  );
  const [error, setError] = useState<string | null>(null);
  const [highlightedArena, setHighlightedArena] = useState<number | null>(null);
  const blockRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const load = useCallback(async () => {
    const needProfile = !cacheHas("profile-v4");
    const needCollection = !cacheHas("player-collection-v12");
    if (needProfile || needCollection) {
      setLoading(true);
    }
    setError(null);

    try {
      const [profileData, collectionData] = await Promise.all([
        needProfile ? api.getProfile() : Promise.resolve(cacheGet<Profile>("profile-v4")),
        needCollection
          ? api.getPlayerCollection()
          : Promise.resolve(cacheGet<PlayerCollectionData>("player-collection-v12")),
      ]);
      setProfile(profileData);
      setCollection(collectionData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить данные профиля");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const arenaDecks = cacheGet<ArenaDecksData>("arena-decks-v4");

  const playerArena = useMemo(() => {
    if (!profile) return null;
    return resolvePlayerArenaNumber({
      trophies: profile.trophies,
      arenaName: profile.arena_name,
      arenaId: arenaDecks?.arena_id ?? null,
    });
  }, [profile, arenaDecks?.arena_id]);

  const allSummaries = useMemo(() => {
    if (!collection?.cards) return [];
    return evaluateAllArenas(collection.cards);
  }, [collection?.cards]);

  const myArenaSummary = useMemo(() => {
    if (!collection?.cards || playerArena == null) return null;
    return evaluateArenaProgress(playerArena, collection.cards);
  }, [collection?.cards, playerArena]);

  const scrollToArena = useCallback((arena: number) => {
    const node = blockRefs.current.get(arena);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setHighlightedArena(arena);
    window.setTimeout(() => setHighlightedArena(null), 2500);
  }, []);

  const goToMyArena = useCallback(() => {
    if (playerArena == null) return;
    scrollToArena(playerArena);
  }, [playerArena, scrollToArena]);

  if (loading) return <Loader />;
  if (error) return <ErrorCard message={error} />;
  if (!profile?.player_tag) {
    return (
      <Card className="text-center text-cr-muted text-sm">
        Привяжите аккаунт Clash Royale в настройках, чтобы получить рекомендации по прокачке.
      </Card>
    );
  }
  if (!collection?.cards?.length) {
    return <Card className="text-center text-cr-muted text-sm">Коллекция карт недоступна</Card>;
  }

  return (
    <div className="space-y-5">
      <Card className="border-cr-gold/20 bg-cr-gold/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cr-text">Рекомендации по прокачке</p>
            <p className="text-xs text-cr-muted mt-1 leading-relaxed">
              Приоритетные карты для каждой арены с учётом вашей коллекции
            </p>
            {playerArena != null && myArenaSummary ? (
              <p className="text-xs text-cr-gold mt-2">
                Ваша арена: {myArenaSummary.arenaName} · {profile.trophies?.toLocaleString("ru-RU") ?? "—"} 🏆
              </p>
            ) : null}
          </div>
          <Button
            variant="primary"
            className="shrink-0 !py-2 text-sm flex items-center justify-center gap-2"
            onClick={goToMyArena}
            disabled={playerArena == null}
          >
            <MapPin className="w-4 h-4" />
            Моя арена
          </Button>
        </div>
      </Card>

      {myArenaSummary ? <ArenaProgressHeader summary={myArenaSummary} /> : null}

      <Card>
        <h3 className="text-sm font-semibold text-cr-text mb-3">Все арены</h3>
        <div className="flex flex-wrap gap-2">
          {ARENA_RECOMMENDATIONS.map((arena) => (
            <button
              key={arena.arena}
              type="button"
              onClick={() => scrollToArena(arena.arena)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-left transition-colors hover:border-cr-gold/40 hover:bg-cr-gold/10",
                playerArena === arena.arena
                  ? "border-cr-gold/40 bg-cr-gold/10"
                  : "border-white/10 bg-white/[0.03]",
              )}
            >
              <span className="block text-[10px] text-cr-muted">Арена {arena.arena}</span>
              <span className="block text-xs text-cr-text max-w-[9rem] truncate">{arena.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {allSummaries.map((summary) => (
          <ArenaBlock
            key={summary.arena}
            summary={summary}
            highlighted={highlightedArena === summary.arena}
            onNavigate={() => scrollToArena(summary.arena)}
            blockRef={(node) => {
              if (node) blockRefs.current.set(summary.arena, node);
              else blockRefs.current.delete(summary.arena);
            }}
          />
        ))}
      </div>
    </div>
  );
}
