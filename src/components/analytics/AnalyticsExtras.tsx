import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Swords, Wand2, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Brain, ChevronRight, ScanSearch, BarChart3 } from "lucide-react";
import { api, ApiError, isProRequiredError } from "@/api/client";
import { cacheGet, cacheHas, cacheInvalidate } from "@/api/cache";
import { Card, Button, Loader, ErrorState, EmptyState } from "@/components/ui";
import { CardDeckGrid, CardTile, PlayerDeckGrid } from "@/components/cards";
import { ProGate } from "@/components/pro";
import { useCardCatalog, useGhosteekPro, usePageRefresh, useTelegram } from "@/hooks";
import { battleDetailPath, cn } from "@/utils";
import type { CounterDeckData, CustomizeData, Deck, InsightsData, OpponentEntry, WinrateEntry } from "@/types";

function decksEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((card, i) => card === b[i]);
}

function DeckImportButton({ deckLink, label }: { deckLink?: string | null; label: string }) {
  const { openLink, showAlert } = useTelegram();

  const importDeck = async () => {
    if (!deckLink) return;
    if (openLink) {
      openLink(deckLink);
      return;
    }
    try {
      await navigator.clipboard.writeText(deckLink);
      showAlert?.("Ссылка на колоду скопирована");
    } catch {
      showAlert?.("Откройте приложение из Telegram для импорта колоды");
    }
  };

  if (!deckLink) {
    return (
      <p className="text-xs text-cr-muted mt-3">
        Импорт недоступен — не все карты распознаны
      </p>
    );
  }

  return (
    <Button
      variant="secondary"
      className="mt-3 w-full !py-2 text-base flex items-center justify-center gap-2"
      onClick={() => void importDeck()}
    >
      <ExternalLink className="w-4 h-4" />
      {label}
    </Button>
  );
}

export function DeckWinratesPanel({ onAnalyze }: { onAnalyze?: (deck: Deck) => void }) {
  const navigate = useNavigate();
  const { iconUrl } = useCardCatalog();
  const [rows, setRows] = useState<WinrateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await api.getWinrates());
    } catch (e) {
      setRows([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить винрейт");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader variant="section" />;
  if (error) return <ErrorState title={error} />;
  if (!rows.length) {
    return <EmptyState title="Сыграйте бои — появится статистика по колодам" />;
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const deckCards =
          row.deck_cards && row.deck_cards.length === 8
            ? [...row.deck_cards].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
            : row.cards.map((name, slot) => ({
                id: `${name}-${slot}`,
                name,
                icon: iconUrl(name) || "",
                cost: 0,
                evolution_level: 0,
                is_hero: false,
                slot,
              }));
        const cardNames = deckCards.map((c) => c.name).filter(Boolean);
        const deckKey = [...cardNames].sort().join("|");
        const canAnalyze = Boolean(onAnalyze) && deckCards.length === 8;
        const canOpenStats = cardNames.length === 8 && Boolean(deckKey);
        return (
          <Card key={deckKey || i} noMotion>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-cr-text">
                <span className="text-cr-win">{row.wins} побед</span>
                <span className="text-cr-muted"> · </span>
                <span className="text-cr-loss">{row.losses} поражений</span>
                <span className="text-cr-muted"> · {row.total} игр</span>
              </span>
              <span className={`text-base font-bold ${row.winrate >= 50 ? "text-cr-win" : "text-cr-loss"}`}>
                {row.winrate.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-3 w-full">
              {deckCards.map((card, slot) => {
                const displayMode = card.is_hero
                  ? "hero"
                  : (card.evolution_level ?? 0) >= 1
                    ? "evo"
                    : "base";
                return (
                  <div key={`${card.id}-${slot}`} className="min-w-0 overflow-visible">
                    <CardTile
                      name={card.name}
                      icon={card.icon || iconUrl(card.name)}
                      size="lg"
                      showLabel
                      displayMode={displayMode}
                      iconEvo={card.icon || iconUrl(card.name)}
                      iconHero={card.icon || iconUrl(card.name)}
                    />
                  </div>
                );
              })}
            </div>
            {canOpenStats ? (
              <Button
                variant="secondary"
                className="w-full !py-2 text-base flex items-center justify-center gap-2 mt-3"
                onClick={() =>
                  navigate(`/decks/mine/stats?deck=${encodeURIComponent(deckKey)}`)
                }
              >
                <BarChart3 className="w-4 h-4" />
                Статистика колоды
              </Button>
            ) : null}
            {canAnalyze ? (
              <Button
                variant="secondary"
                className="w-full !py-2 text-base flex items-center justify-center gap-2 mt-2"
                onClick={() =>
                  onAnalyze?.({
                    id: i + 1,
                    name: `Моя колода · ${row.winrate.toFixed(1)}%`,
                    cards: deckCards.map((card, slot) => ({
                      ...card,
                      id: card.id || `${card.name}-${slot}`,
                      icon: card.icon || iconUrl(card.name) || "",
                      cost: card.cost || 0,
                      slot: card.slot ?? slot,
                    })),
                    winrate: row.winrate,
                    total_games: row.total,
                    avg_elixir: 0,
                    best_matchups: [],
                    worst_matchups: [],
                    type: "mine",
                  })
                }
              >
                <ScanSearch className="w-4 h-4" />
                Анализ
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export function OpponentsPanel() {
  const [opponents, setOpponents] = useState<OpponentEntry[]>([]);
  const [counters, setCounters] = useState<Record<number, CounterDeckData>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOpponents(await api.getOpponents());
    } catch (e) {
      setOpponents([]);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить соперников");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCounter = async (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex(index);

    if (counters[index]) {
      return;
    }

    setLoadingId(index);
    try {
      const data = await api.getCounterDeck(index);
      setCounters((prev) => ({ ...prev, [index]: data }));
    } catch {
      setActiveIndex(null);
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) return <Loader variant="section" />;
  if (error) return <ErrorState title={error} />;
  if (!opponents.length) {
    return <EmptyState title="Нет данных о колодах соперников" />;
  }

  return (
    <div className="space-y-4">
      {opponents.map((opp) => {
        const isOpen = activeIndex === opp.index;
        const counter = counters[opp.index];
        const isLoadingCounter = loadingId === opp.index;

        return (
          <Card key={opp.index}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-base font-semibold text-cr-text flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cr-loss" />
                  {opp.name}
                </p>
                <p className="text-sm text-cr-muted mt-0.5">
                  {opp.won_against ? "Вы побеждали эту колоду" : "Проигрывали этой колоде"} · эликсир {opp.avg_elixir.toFixed(1)}
                </p>
              </div>
              <Button
                variant="secondary"
                className={cn(
                  "!py-1.5 !px-3 text-sm shrink-0",
                  isOpen && "border-cr-gold/60 text-cr-gold bg-cr-gold/10 active:bg-cr-gold/20",
                )}
                disabled={isLoadingCounter}
                onClick={() => void loadCounter(opp.index)}
              >
                <Swords className="w-3.5 h-3.5 mr-1" />
                {isOpen ? "Скрыть" : "Контр"}
              </Button>
            </div>
            {opp.threats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {opp.threats.map((t) => (
                  <span key={t} className="text-2xs px-2 py-0.5 rounded-full bg-cr-loss/10 text-cr-loss border border-cr-loss/20">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <PlayerDeckGrid
              cards={opp.deck_cards?.length ? opp.deck_cards : opp.deck}
              size="lg"
              showLabels
            />

            {isOpen && (
              <div className="mt-3 pt-3 border-t border-cr-win/20 rounded-lg bg-cr-win/5 px-3 pb-3 -mx-1">
                {isLoadingCounter ? (
                  <p className="text-sm text-cr-muted text-center py-2">Подбираем контр-колоду…</p>
                ) : counter ? (
                  <>
                    <h3 className="text-base font-semibold text-cr-text mb-1">
                      Контр-колода vs {counter.opponent_name}
                    </h3>
                    <p className="text-sm text-cr-muted mb-3">Под ваш арсенал и арену</p>
                    <CardDeckGrid cards={counter.counter_deck} size="lg" showLabels maxVisible={8} />
                  </>
                ) : null}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function deckLevels(cards?: CustomizeData["original_cards"]) {
  return cards?.map((c) => c.level ?? null) ?? [];
}

function deckIcons(cards?: CustomizeData["original_cards"]) {
  return cards?.map((c) => c.icon ?? "");
}

export function DeckToolsPanel() {
  const [customize, setCustomize] = useState<CustomizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proLocked, setProLocked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const { nameRu } = useCardCatalog();
  const { isPro, loading: proLoading } = useGhosteekPro();

  const load = useCallback(async (force = false) => {
    if (!isPro) {
      setCustomize(null);
      setProLocked(true);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setProLocked(false);
      if (force) {
        cacheInvalidate("customize-v7");
      }
      const custom = await api.getCustomizeDeck();
      setCustomize(custom);
      if (!custom) {
        setError("Недостаточно боёв для рекомендаций");
      }
    } catch (e) {
      setCustomize(null);
      if (isProRequiredError(e)) {
        setProLocked(true);
        setError(null);
      } else {
        setProLocked(false);
        setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
      }
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    if (proLoading) return;
    void load();
  }, [load, proLoading]);

  const synergyNeeded = Boolean(
    customize &&
      (customize.synergy_needed ?? !decksEqual(customize.original, customize.customized)),
  );
  const levelAltNeeded = Boolean(customize?.level_alt_needed);
  const upgrades = customize?.upgrade_priority ?? [];
  const balanced = Boolean(
    customize?.balanced ??
      (customize && !synergyNeeded && !levelAltNeeded && upgrades.length === 0),
  );

  if (proLoading || loading) return <Loader variant="section" />;
  if (proLocked) {
    return (
      <ProGate
        feature="deck_improve"
        title="Улучшение колоды"
        description="Подбор замен и улучшений для твоей колоды доступен в Ghosteek Pro."
      />
    );
  }
  if (error && !customize) return <ErrorState title={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-cr-muted px-3 py-2 text-sm"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void load(true).finally(() => setRefreshing(false));
          }}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>
      {customize && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="w-5 h-5 text-cr-gold" />
            <h3 className="font-semibold text-cr-text">Улучшение колоды</h3>
          </div>
          <p className="text-sm text-cr-muted mb-1">
            Ср. эликсир: {customize.avg_elixir.toFixed(1)}
            {customize.recommended_level ? (
              <> · рекоменд. ур. для арены: {customize.recommended_level}</>
            ) : null}
          </p>
          <p className="text-sm text-cr-muted mb-2 mt-3">Было</p>
          <CardDeckGrid
            cards={customize.original}
            icons={deckIcons(customize.original_cards)}
            levels={deckLevels(customize.original_cards)}
            size="lg"
            showLabels
            maxVisible={8}
          />

          {upgrades.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-cr-gold mb-2 recommendation-accent">Рекомендуемый уровень карт</p>
              <ul className="space-y-1.5">
                {upgrades.map((u) => (
                  <li
                    key={`${u.name}-${u.level}`}
                    className="flex items-center gap-2 text-sm text-cr-text"
                  >
                    {u.icon ? (
                      <img src={u.icon} alt="" className="h-7 w-7 rounded object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-cr-surface text-2xs font-bold">
                        {(u.name_ru || u.name).charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {u.name_ru || nameRu(u.name)}
                    </span>
                    <span className="shrink-0 text-cr-loss">
                      ур. {u.level ?? "?"} → {u.recommended_level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {synergyNeeded ? (
            <>
              <p className="text-sm text-cr-muted mb-2 mt-4">По синергии</p>
              <CardDeckGrid
                cards={customize.customized}
                icons={deckIcons(customize.customized_cards)}
                levels={deckLevels(customize.customized_cards)}
                size="lg"
                showLabels
                maxVisible={8}
              />
              <DeckImportButton deckLink={customize.deck_link} label="Импорт улучшенной колоды" />
            </>
          ) : null}

          {levelAltNeeded && customize.level_alt_deck?.length ? (
            <>
              <p className="text-sm text-cr-muted mb-1 mt-4">Сильнее по уровням (тот же стиль)</p>
              {typeof customize.level_alt_avg_elixir === "number" ? (
                <p className="text-xs text-cr-muted mb-2">
                  Ср. эликсир: {customize.level_alt_avg_elixir.toFixed(1)}
                </p>
              ) : null}
              <CardDeckGrid
                cards={customize.level_alt_deck}
                icons={deckIcons(customize.level_alt_cards)}
                levels={deckLevels(customize.level_alt_cards)}
                size="lg"
                showLabels
                maxVisible={8}
              />
              <DeckImportButton
                deckLink={customize.level_alt_deck_link}
                label="Импорт колоды по уровням"
              />
            </>
          ) : null}

          {balanced ? (
            <p className="text-sm text-cr-muted mt-4">
              Колода подходит для вашей арены — обязательных замен нет
            </p>
          ) : null}

          {customize.issues.length > 0 && (
            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-sm text-cr-gold"
              onClick={() => setShowIssues((v) => !v)}
            >
              {showIssues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Замечания ({customize.issues.length})
            </button>
          )}
          {showIssues && (
            <ul className="mt-2 space-y-1 text-sm text-cr-muted">
              {customize.issues.map((issue, i) => {
                const isHeading =
                  issue === "Что хорошо" ||
                  issue === "Что можно улучшить" ||
                  issue === "Итоговая рекомендация";
                return (
                  <li
                    key={i}
                    className={
                      isHeading
                        ? "mt-2 first:mt-0 font-medium text-cr-text"
                        : undefined
                    }
                  >
                    {isHeading ? issue : `· ${issue}`}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export function LossAnalysisPanel() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightsData | null>(() => cacheGet<InsightsData>("insights"));
  const [loading, setLoading] = useState(() => !cacheHas("insights"));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hasCache = cacheHas("insights");
    if (!hasCache) {
      setLoading(true);
    }
    try {
      setError(null);
      setInsights(await api.getInsights());
    } catch (e) {
      setInsights(null);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить разбор поражений");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const lossInsights = useMemo(
    () => (insights?.insights ?? []).filter((item) => !item.won).slice(0, 7),
    [insights?.insights],
  );

  if (loading) return <Loader variant="section" />;
  if (error) return <ErrorState title={error} />;
  if (!insights) {
    return <EmptyState title="Сыграйте бои — здесь появится разбор ваших поражений" />;
  }

  if (!insights.patterns.length && !lossInsights.length) {
    return <EmptyState title="Сыграйте бои — здесь появится разбор ваших поражений" />;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-cr-blue" />
        <h3 className="text-base font-semibold text-cr-text">Разбор поражений</h3>
      </div>

      {insights.patterns.length ? (
        <div className="space-y-2 mb-4">
          {insights.patterns.map((pattern, index) => (
            <p
              key={index}
              className="text-sm text-cr-gold bg-cr-gold/10 border border-cr-gold/20 rounded-lg px-3 py-2"
            >
              {pattern}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {lossInsights.map((item) => (
          <button
            key={item.battle_index}
            type="button"
            onClick={() =>
              navigate(battleDetailPath(item.timestamp, item.battle_index), {
                state: { from: "/analytics?section=losses" },
              })
            }
            className="w-full text-left rounded-xl border p-3 transition-colors border-cr-loss/25 bg-cr-loss/5"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <Swords className="w-4 h-4 text-cr-loss shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-cr-accent font-semibold mb-0.5">против {item.opponent_name}</p>
                <p className="text-base text-cr-text leading-snug">{item.summary}</p>
                {item.matchup_score > 0 ? (
                  <p className="text-xs text-cr-muted mt-1">Матчап: {item.matchup_score.toFixed(0)}/100</p>
                ) : null}
              </div>
              <ChevronRight className="w-5 h-5 text-cr-muted shrink-0 mt-0.5" />
            </div>
            {item.details.length > 0 && (
              <ul className="mt-2 space-y-1 pl-6">
                {item.details.slice(0, 2).map((detail, detailIndex) => (
                  <li key={detailIndex} className="text-xs text-cr-accent/90 font-medium leading-snug">
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
