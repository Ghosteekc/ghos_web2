import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Swords, TrendingDown, TrendingUp } from "lucide-react";
import { Card, Button, Loader } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { api, ApiError } from "@/api/client";
import type { DeckCompareCardNote, DeckCompareResult } from "@/types";
import { usePageRefresh } from "@/hooks";

type TabId = "overview" | "user" | "reference";

function parseReferenceCards(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((c) => decodeURIComponent(c.trim()))
    .filter(Boolean);
}

function noteToneClass(tone: DeckCompareCardNote["tone"]): string {
  if (tone === "good") return "border-cr-win/35 bg-cr-win/8";
  if (tone === "bad") return "border-cr-loss/35 bg-cr-loss/8";
  if (tone === "warn") return "border-cr-gold/35 bg-cr-gold/8";
  return "border-cr-border bg-cr-bg/40";
}

function CompareNoteRow({
  note,
  icon,
}: {
  note: DeckCompareCardNote;
  icon?: string;
}) {
  return (
    <li className={`rounded-xl border p-3 flex gap-3 ${noteToneClass(note.tone)}`}>
      <div className="w-11 shrink-0">
        {icon ? (
          <img src={icon} alt={note.card_ru} className="w-full aspect-[4/5] object-contain" loading="lazy" />
        ) : (
          <CardTile name={note.card} size="sm" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cr-text">{note.card_ru || note.card}</p>
        <p className="text-xs text-cr-muted mt-1 leading-relaxed">{note.text}</p>
      </div>
    </li>
  );
}

function SummaryList({ title, items, tone }: { title: string; items: string[]; tone: "win" | "loss" }) {
  if (!items.length) return null;
  const color = tone === "win" ? "text-cr-win" : "text-cr-loss";
  return (
    <div>
      <p className={`text-xs font-semibold mb-2 ${color}`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((line) => (
          <li key={line} className="text-xs text-cr-text leading-snug">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckGrid({ cards }: { cards: DeckCompareResult["user_deck"] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((card) => (
        <div key={card.name} className="min-w-0">
          <CardTile name={card.name} icon={card.icon} size="deck" />
        </div>
      ))}
    </div>
  );
}

export function DeckComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referenceCards = useMemo(
    () => parseReferenceCards(searchParams.get("ref")),
    [searchParams],
  );
  const referenceName = searchParams.get("name") ?? "Колода арены";
  const fromTab = searchParams.get("from") ?? "arena";

  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<DeckCompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backPath = `/decks?tab=${fromTab}`;

  const load = useCallback(async () => {
    if (referenceCards.length !== 8) {
      setError("Нужна полная колода из 8 карт");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await api.compareDeck(referenceCards);
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : "Не удалось сравнить колоды");
    } finally {
      setLoading(false);
    }
  }, [referenceCards]);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const userIcons = useMemo(
    () => new Map((data?.user_deck ?? []).map((c) => [c.name, c.icon])),
    [data?.user_deck],
  );
  const refIcons = useMemo(
    () => new Map((data?.reference_deck ?? []).map((c) => [c.name, c.icon])),
    [data?.reference_deck],
  );

  if (loading) return <Loader />;

  if (error || !data) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-cr-loss">{error ?? "Нет данных"}</p>
        <Button onClick={() => navigate(backPath)}>Назад к колодам</Button>
      </Card>
    );
  }

  const userScore = data.matchup_score ?? 50;
  const refScore = data.opponent_matchup_score ?? 50;
  const refLabel = fromTab === "arena" ? "Колода вашей арены" : "Колода соперника";

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="!px-2" onClick={() => navigate(backPath)} aria-label="Назад">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="page-title truncate">Сравнение колод</h1>
          <p className="text-xs text-cr-muted truncate">против «{referenceName || data.reference_name}»</p>
        </div>
      </div>

      <Card className="border-cr-gold/25 bg-gradient-to-br from-cr-gold/10 to-cr-bg/20 !p-4">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-5 h-5 text-cr-gold" />
          <p className="text-sm font-semibold text-cr-text">Матчап</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-cr-win/30 bg-cr-win/10 p-3 text-center">
            <p className="text-[11px] text-cr-muted">Ваша колода</p>
            <p className="text-2xl font-bold text-cr-win tabular-nums">{userScore.toFixed(0)}%</p>
            {data.user_synergy_score != null && (
              <p className="text-[10px] text-cr-muted mt-1">Синергия: {data.user_synergy_score.toFixed(0)}%</p>
            )}
          </div>
          <div className="rounded-xl border border-cr-loss/30 bg-cr-loss/10 p-3 text-center">
            <p className="text-[11px] text-cr-muted">{refLabel}</p>
            <p className="text-2xl font-bold text-cr-loss tabular-nums">{refScore.toFixed(0)}%</p>
            {data.reference_synergy_score != null && (
              <p className="text-[10px] text-cr-muted mt-1">Синергия: {data.reference_synergy_score.toFixed(0)}%</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-cr-muted mb-2">Ваша колода</p>
            <DeckGrid cards={data.user_deck} />
          </div>
          <div>
            <p className="text-[11px] text-cr-muted mb-2">{refLabel}</p>
            <DeckGrid cards={data.reference_deck} />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["overview", "Обзор"],
          ["user", "Ваша колода"],
          ["reference", refLabel],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold border transition-colors " +
              (tab === id
                ? "border-cr-gold/50 bg-cr-gold/15 text-cr-gold"
                : "border-cr-border bg-cr-card text-cr-muted hover:text-cr-text")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cr-win" />
              <p className="text-sm font-semibold text-cr-text">Ваши преимущества</p>
            </div>
            <SummaryList title="Сильнее" items={data.user_better} tone="win" />
            <div className="mt-3">
              <SummaryList title="Слабее" items={data.user_worse} tone="loss" />
            </div>
            {(data.user_synergy_notes?.length ?? 0) > 0 && (
              <div className="mt-3">
                <SummaryList title="Синергия в колоде" items={data.user_synergy_notes} tone="win" />
              </div>
            )}
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-cr-loss" />
              <p className="text-sm font-semibold text-cr-text">{refLabel}</p>
            </div>
            <SummaryList title="Сильнее вашей" items={data.reference_better} tone="win" />
            <div className="mt-3">
              <SummaryList title="Слабее вашей" items={data.reference_worse} tone="loss" />
            </div>
          </Card>
        </div>
      )}

      {tab === "user" && (
        <Card className="!p-4">
          <p className="text-sm font-semibold text-cr-text mb-3">Ваша колода — карта за картой</p>
          <ul className="space-y-2">
            {(data.user_card_notes ?? []).map((note) => (
              <CompareNoteRow key={note.card} note={note} icon={userIcons.get(note.card)} />
            ))}
          </ul>
        </Card>
      )}

      {tab === "reference" && (
        <Card className="!p-4">
          <p className="text-sm font-semibold text-cr-text mb-3">{refLabel} — карта за картой</p>
          <ul className="space-y-2">
            {(data.reference_card_notes ?? []).map((note) => (
              <CompareNoteRow key={note.card} note={note} icon={refIcons.get(note.card)} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default DeckComparePage;
