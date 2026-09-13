import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, Shield, Trophy, Users, Zap } from "lucide-react";
import { Button, Card, EmptyState, ErrorState, Loader, PageHeader } from "@/components/ui";
import { api } from "@/api/client";
import { usePageRefresh } from "@/hooks";
import { ContentReveal } from "@/motion";
import type { ClanMemberSort, ClanProfile } from "@/types";
import { formatNumber } from "@/utils";

const ACTIVITY_FILTERS: { value: ClanMemberSort; label: string }[] = [
  { value: "rank", label: "Все" },
  { value: "activity_desc", label: "Активные" },
  { value: "activity_asc", label: "Малоактивные" },
];

const ROLE_LABELS: Record<string, string> = {
  leader: "Лидер",
  coLeader: "Соруководитель",
  elder: "Старейшина",
  member: "Участник",
};

function backAction(onBack: () => void) {
  return (
    <Button variant="ghost" onClick={onBack} className="!p-2 shrink-0" aria-label="Назад">
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
}

export function ClanPage() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<ClanMemberSort>("rank");
  const [data, setData] = useState<ClanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const response = await api.getMyClan(sort);
      if (requestId !== latestRequest.current) return;
      setError(null);
      setData(response);
    } catch (cause) {
      if (requestId !== latestRequest.current) return;
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить клан");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [sort]);

  usePageRefresh(load);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const header = <PageHeader title="Мой клан" action={backAction(() => navigate("/"))} />;

  let content: React.ReactNode;
  if (error) {
    content = <ErrorState title={error} button="Повторить" onAction={() => void load()} />;
  } else if (!data || data.status === "no_clan" || !data.clan) {
    content = (
      <EmptyState
        icon={Users}
        title="Вы не состоите в клане"
        description="Вступите в клан в Clash Royale — и его состав появится здесь."
      />
    );
  } else {
    const clan = data.clan;
    const overview = [
      {
        label: "Участники",
        value: clan.members != null ? `${clan.members} / 50` : `${data.members.length} / 50`,
        icon: Users,
      },
      {
        label: "Clan Score",
        value: clan.clan_score != null ? formatNumber(clan.clan_score) : "—",
        icon: Trophy,
      },
      {
        label: "Кубки клановой войны",
        value: clan.clan_war_trophies != null ? formatNumber(clan.clan_war_trophies) : "—",
        icon: Shield,
      },
      {
        label: "Донаты за неделю",
        value: clan.donations_per_week != null ? formatNumber(clan.donations_per_week) : "—",
        icon: Gift,
      },
    ];

    content = (
      <div className="space-y-5">
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-cr-blue/15 border border-cr-blue/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-cr-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-cr-text truncate">{clan.name}</h2>
              <p className="text-xs text-cr-accent font-bold font-mono mt-1">{clan.tag}</p>
            </div>
          </div>
          {clan.description ? <p className="text-sm text-cr-muted mt-4">{clan.description}</p> : null}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {overview.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-cr-bg/50 border border-cr-border px-3 py-2.5 min-w-0">
                <div className="flex items-center gap-1.5 text-cr-muted">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs truncate">{label}</span>
                </div>
                <p className="text-base font-bold text-cr-text mt-1 truncate">{value}</p>
              </div>
            ))}
          </div>
          {clan.required_trophies != null ? (
            <p className="text-xs text-cr-muted mt-4">Вход от {formatNumber(clan.required_trophies)} трофеев</p>
          ) : null}
        </Card>

        <section>
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-bold text-cr-text">Состав</h2>
              {data.activity_basis ? (
                <p className="text-xs text-cr-muted mt-1">Активность: {data.activity_basis.toLowerCase()}</p>
              ) : null}
            </div>
            <span className="text-sm text-cr-muted shrink-0">{data.members.length}</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {ACTIVITY_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={sort === filter.value ? "primary" : "secondary"}
                className="!px-4 !py-2 whitespace-nowrap"
                onClick={() => setSort(filter.value)}
                aria-pressed={sort === filter.value}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <Card className="!p-0 mt-2" noMotion>
            {data.members.map((member, index) => (
              <div
                key={member.tag}
                className={"flex items-center gap-3 px-4 py-3 " + (index > 0 ? "border-t border-cr-border" : "")}
              >
                <span className="w-6 text-center text-xs font-mono text-cr-muted shrink-0">
                  {member.clan_rank ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-cr-text truncate">{member.name}</p>
                  <p className="text-xs text-cr-muted truncate">{ROLE_LABELS[member.role] ?? member.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-cr-text">{formatNumber(member.trophies)}</p>
                  <p className="text-xs text-cr-muted flex justify-end items-center gap-1">
                    <Zap className="w-3 h-3 text-cr-gold" /> {member.donations}
                  </p>
                </div>
              </div>
            ))}
            {data.members.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-cr-muted">Состав клана пока недоступен.</p>
            ) : null}
          </Card>
        </section>
      </div>
    );
  }

  return (
    <ContentReveal
      loading={loading}
      loader={<div className="space-y-6">{header}<Loader variant="section" label="Загрузка клана" /></div>}
    >
      <div className="space-y-5">{header}{content}</div>
    </ContentReveal>
  );
}

export default ClanPage;
