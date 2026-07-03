import { useCallback, useEffect, useState } from "react";
import { Layers, Smile, Sparkles } from "lucide-react";
import { Card, Button, Loader, LinearProgress } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import type { PlayerCollectionData } from "@/types";

type CollectionTab = "cards" | "emotes" | "mastery";

const TABS: { id: CollectionTab; label: string; icon: typeof Layers }[] = [
  { id: "cards", label: "Коллекция карт", icon: Layers },
  { id: "emotes", label: "Коллекция эмодзи", icon: Smile },
  { id: "mastery", label: "Мастерство карт", icon: Sparkles },
];

const FILTER_BTN_ACTIVE =
  "px-3 py-2 rounded-xl text-xs font-cr whitespace-nowrap bg-cr-gold text-white border border-cr-gold/50 shadow-glow";
const FILTER_BTN_IDLE =
  "px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap bg-cr-card/70 text-cr-text border border-cr-border hover:bg-cr-card-hover";

function EvoHeroBadges({
  hasEvo,
  hasHero,
}: {
  hasEvo: boolean;
  hasHero: boolean;
}) {
  if (!hasEvo && !hasHero) return null;
  return (
    <div className="flex gap-0.5 justify-center mt-0.5">
      {hasEvo ? (
        <span className="text-[9px] px-1 rounded bg-cr-blue/20 text-cr-blue border border-cr-blue/30">E</span>
      ) : null}
      {hasHero ? (
        <span className="text-[9px] px-1 rounded bg-cr-gold/20 text-cr-gold border border-cr-gold/30">★</span>
      ) : null}
    </div>
  );
}

export function ProfileCollection() {
  const [tab, setTab] = useState<CollectionTab>("cards");
  const [data, setData] = useState<PlayerCollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLockedCards, setShowLockedCards] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPlayerCollection();
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Не удалось загрузить коллекцию");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>
        <Button onClick={() => void load()}>Повторить</Button>
      </Card>
    );
  }

  const visibleCards = showLockedCards ? data.cards : data.cards.filter((c) => c.owned);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={tab === item.id ? FILTER_BTN_ACTIVE : FILTER_BTN_IDLE}
              style={tab === item.id ? { textShadow: "var(--cr-stroke-body)" } : undefined}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "cards" ? (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-sm text-cr-text font-semibold">
              {data.cards_owned} / {data.cards_total} карт
            </p>
            <button
              type="button"
              className="text-xs text-cr-accent underline"
              onClick={() => setShowLockedCards((v) => !v)}
            >
              {showLockedCards ? "Только мои" : "Показать все"}
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {visibleCards.map((card) => (
              <div
                key={card.name}
                className={card.owned ? "" : "opacity-45 grayscale"}
                title={card.name_ru}
              >
                <CardTile
                  name={card.name}
                  icon={card.icon}
                  size="deck"
                  levelBadge={card.owned && card.level ? card.level : undefined}
                />
                <EvoHeroBadges hasEvo={card.has_evo} hasHero={card.has_hero} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "emotes" ? (
        <Card>
          <div className="mb-4 space-y-1">
            <p className="text-sm text-cr-text font-semibold">
              {data.emotes_owned} / {data.emotes_total} эмодзи
            </p>
            {data.emote_collection_level > 0 ? (
              <p className="text-xs text-cr-muted">
                Бейдж коллекции: ур. {data.emote_collection_level}
                {data.emote_collection_target
                  ? ` · ${data.emote_collection_progress}/${data.emote_collection_target}`
                  : ""}
              </p>
            ) : null}
            {data.emotes_api_note ? (
              <p className="text-[11px] text-cr-muted leading-snug">{data.emotes_api_note}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {data.emotes.map((emote) => (
              <div
                key={emote.id}
                className={
                  "flex flex-col items-center gap-1 p-2 rounded-xl border " +
                  (emote.owned
                    ? "border-cr-gold/30 bg-cr-gold/5"
                    : "border-cr-border/40 bg-cr-bg/30 opacity-50 grayscale")
                }
                title={emote.name}
              >
                <div className="w-10 h-10 rounded-full bg-cr-card flex items-center justify-center text-lg">
                  {emote.owned ? "😀" : "🔒"}
                </div>
                <span className="text-[9px] text-center text-cr-muted leading-tight line-clamp-2">
                  {emote.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "mastery" ? (
        <div className="space-y-3">
          {data.masteries.length === 0 ? (
            <Card className="text-center text-cr-muted text-sm">Нет данных о мастерстве</Card>
          ) : (
            data.masteries.map((m) => (
              <Card key={m.card_name} className="!p-3">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-12">
                    <CardTile
                      name={m.card_name}
                      icon={m.icon}
                      size="sm"
                      levelBadge={m.level}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-cr-text truncate">{m.card_name_ru}</p>
                      <span className="text-xs text-cr-gold font-bold shrink-0">
                        Ур. {m.level}/{m.max_level}
                      </span>
                    </div>
                    {m.target ? (
                      <>
                        <LinearProgress value={m.progress_percent} max={100} showLabel={false} className="mb-1" />
                        <p className="text-[11px] text-cr-muted">
                          {m.progress} / {m.target} ({m.progress_percent.toFixed(0)}%)
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-cr-win">Максимальный уровень</p>
                    )}
                    <p className="text-[11px] text-cr-accent mt-1 leading-snug">{m.next_hint}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
