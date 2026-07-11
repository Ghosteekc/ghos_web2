import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { Card, Button, Loader, LinearProgress } from "@/components/ui";

import { CardTile } from "@/components/cards";

import { usePlayerCollection } from "@/hooks/usePlayerCollection";

import { usePageRefresh, useCardCatalog } from "@/hooks";

import type { CollectionCardEntry } from "@/types";



export function ProfileMasteryPage() {

  const navigate = useNavigate();

  const { data, loading, error, reload } = usePlayerCollection();

  const { getCard } = useCardCatalog();



  usePageRefresh(reload);



  const cardByName = useMemo(() => {

    const map = new Map<string, CollectionCardEntry>();

    for (const card of data?.cards ?? []) {

      map.set(card.name, card);

    }

    return map;

  }, [data?.cards]);



  if (loading) return <Loader />;



  if (error || !data) {

    return (

      <div className="space-y-4">

        <PageHeader title="Мастерство карт" onBack={() => navigate("/")} />

        <Card className="text-center space-y-3">

          <p className="text-cr-loss text-sm">{error ?? "Нет данных"}</p>

          <Button onClick={() => void reload()}>Повторить</Button>

        </Card>

      </div>

    );

  }



  return (

    <div className="space-y-4">

      <PageHeader title="Мастерство карт" onBack={() => navigate("/")} />



      {data.masteries.length === 0 ? (

        <Card className="text-center text-cr-muted text-sm">Нет данных о мастерстве</Card>

      ) : (

        <div className="space-y-3">

          {data.masteries.map((m) => {

            const owned = cardByName.get(m.card_name);

            const elixir = owned?.elixir ?? getCard(m.card_name)?.elixir ?? null;

            return (

              <Card key={m.card_name} className="!p-3">

                <div className="flex items-start gap-3">

                  <div className="shrink-0 w-[4.75rem]">

                    <CardTile

                      name={m.card_name}

                      icon={m.icon}

                      iconBase={m.icon_base}

                      iconEvo={m.icon_evo}

                      iconHero={m.icon_hero}

                      displayMode={m.display_mode}

                      rarity={owned?.rarity}

                      size="collection"

                      levelBadge={owned?.level != null && owned.level > 0 ? owned.level : undefined}

                      elixirCost={elixir != null && elixir < 99 ? elixir : undefined}

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

            );

          })}

        </div>

      )}

    </div>

  );

}



function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {

  return (

    <div className="flex items-center gap-3">

      <Button variant="ghost" onClick={onBack} className="!p-2 shrink-0">

        <ArrowLeft className="w-5 h-5" />

      </Button>

      <h1 className="page-title !mb-0">{title}</h1>

    </div>

  );

}



export { ProfileMasteryPage as default };

