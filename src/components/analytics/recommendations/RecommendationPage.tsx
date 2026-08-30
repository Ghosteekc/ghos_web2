import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/api/client";
import { cacheGet, cacheHas } from "@/api/cache";
import { Card, Button, Loader, ErrorState, EmptyState } from "@/components/ui";
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

function ArenaProgressHeader({ summary }: { summary: ArenaProgressSummary }) {
  return (
    <Card className="!p-4 border-cr-border">
      <h3 className="text-base font-semibold text-cr-text">Приоритет прокачки аккаунта</h3>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-cr-muted">Твой прогресс</p>
          <p className="text-xl font-bold text-cr-gold tabular-nums recommendation-accent">{summary.progressPercent}%</p>
        </div>
        <div>
          <p className="text-xs text-cr-muted">Соответствуют арене</p>
          <p className="text-xl font-bold text-cr-win tabular-nums">
            {summary.meetingCount} из {summary.totalCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-cr-muted">Требуют улучшения</p>
          <p className="text-xl font-bold text-cr-gold tabular-nums recommendation-accent">{summary.needsUpgradeCount}</p>
        </div>
        <div>
          <p className="text-xs text-cr-muted">Рекомендуемый уровень</p>
          <p className="text-xl font-bold text-cr-text tabular-nums">{summary.recommendedLevel}+</p>
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-cr-border overflow-hidden">
        <div
          className="h-full rounded-full bg-cr-gold origin-left"
          style={{ transform: `scaleX(${Math.max(0, Math.min(1, summary.progressPercent / 100))})` }}
        />
      </div>
    </Card>
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
        "recommendation-arena-block scroll-mt-24 rounded-2xl border p-4 transition-colors duration-[220ms] bg-cr-card",
        highlighted
          ? "is-highlighted border-cr-gold/50 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]"
          : "border-cr-border",
      )}
    >
      <button
        type="button"
        onClick={onNavigate}
        className="pixel-btn pixel-btn--nav w-full mt-0"
      >
        <span className="pixel-btn-text">
          <span className="pixel-btn-hint">Арена {summary.arena}</span>
          <span className="pixel-btn-label">{summary.arenaName}</span>
          <span className="pixel-btn-hint">
            Рекомендуемый уровень карт: {summary.recommendedLevel}+ · Прогресс {summary.progressPercent}%
          </span>
        </span>
        <ChevronRight className="pixel-btn-chevron" aria-hidden />
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
  const [profile, setProfile] = useState<Profile | null>(() => cacheGet<Profile>("profile-v8"));
  const [collection, setCollection] = useState<PlayerCollectionData | null>(() =>
    cacheGet<PlayerCollectionData>("player-collection-v13"),
  );
  const [loading, setLoading] = useState(
    () => !cacheHas("profile-v8") || !cacheHas("player-collection-v13"),
  );
  const [error, setError] = useState<string | null>(null);
  const [highlightedArena, setHighlightedArena] = useState<number | null>(null);
  const blockRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const load = useCallback(async () => {
    const needProfile = !cacheHas("profile-v8");
    const needCollection = !cacheHas("player-collection-v13");
    if (needProfile || needCollection) {
      setLoading(true);
    }
    setError(null);

    try {
      const [profileData, collectionData] = await Promise.all([
        needProfile ? api.getProfile() : Promise.resolve(cacheGet<Profile>("profile-v8")),
        needCollection
          ? api.getPlayerCollection()
          : Promise.resolve(cacheGet<PlayerCollectionData>("player-collection-v13")),
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

  const arenaDecks = cacheGet<ArenaDecksData>("arena-decks-v10");

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

  if (loading) return <Loader variant="section" />;
  if (error) return <ErrorState title={error} />;
  if (!profile?.player_tag) {
    return (
      <EmptyState title="Привяжи аккаунт Clash Royale в настройках, чтобы получить рекомендации по прокачке." />
    );
  }
  if (!collection?.cards?.length) {
    return <EmptyState title="Коллекция карт недоступна" />;
  }

  return (
    <div className="space-y-5 recommendations-panel">
      <Card className="border-cr-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <p className="text-base font-semibold text-cr-text">Рекомендации по прокачке</p>
            <p className="text-sm text-cr-muted mt-1 leading-relaxed">
              Приоритетные карты для каждой арены с учётом твоей коллекции
            </p>
            {playerArena != null && myArenaSummary ? (
              <p className="text-sm text-cr-gold mt-2 recommendation-accent">
                Твоя арена: {myArenaSummary.arenaName} · {profile.trophies?.toLocaleString("ru-RU") ?? "—"} 🏆
              </p>
            ) : null}
          </div>
          <Button
            variant="primary"
            className="shrink-0 !py-2 text-base flex items-center justify-center gap-2"
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
        <h3 className="text-base font-semibold text-cr-text mb-3">Все арены</h3>
        <div className="flex flex-wrap gap-2">
          {ARENA_RECOMMENDATIONS.map((arena) => (
            <button
              key={arena.arena}
              type="button"
              onClick={() => scrollToArena(arena.arena)}
              className={cn(
                "recommendation-arena-chip text-left",
                playerArena === arena.arena && "recommendation-arena-chip--current",
              )}
            >
              <span className="block text-2xs text-cr-muted">Арена {arena.arena}</span>
              <span className="block text-sm text-cr-text leading-snug">{arena.name}</span>
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
