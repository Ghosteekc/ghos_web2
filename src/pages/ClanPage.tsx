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
        tone: "border-cr-blue/30 from-cr-blue/20 to-cr-blue/5",
        iconTone: "bg-cr-blue/15 text-cr-blue border-cr-blue/25",
      },
      {
        label: "Clan Score",
        value: clan.clan_score != null ? formatNumber(clan.clan_score) : "—",
        icon: Trophy,
        tone: "border-cr-gold/30 from-cr-gold/20 to-cr-gold/5",
        iconTone: "bg-cr-gold/15 text-cr-gold border-cr-gold/25",
      },
      {
        label: "Кубки войны",
        value: clan.clan_war_trophies != null ? formatNumber(clan.clan_war_trophies) : "—",
        icon: Shield,
        tone: "border-violet-400/25 from-violet-500/15 to-violet-500/5",
        iconTone: "bg-violet-500/15 text-violet-300 border-violet-400/25",
      },
      {
        label: "Донаты за неделю",
        value: clan.donations_per_week != null ? formatNumber(clan.donations_per_week) : "—",
        icon: Gift,
        tone: "border-cr-win/30 from-cr-win/15 to-cr-win/5",
        iconTone: "bg-cr-win/15 text-cr-win border-cr-win/25",
      },
    ];

    content = (
      <div className="space-y-5">
        <Card className="relative overflow-hidden border-cr-blue/30 shadow-glow">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-cr-blue/25 via-cr-blue/5 to-cr-gold/10 pointer-events-none" />
          <div className="absolute -right-10 -top-12 w-36 h-36 rounded-full bg-cr-gold/10 blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-cr-blue/30 to-cr-blue/5 border border-cr-blue/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_7px_16px_rgba(0,0,0,0.2)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cr-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-cr-text truncate">{clan.name}</h2>
              <p className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-cr-blue/10 border border-cr-blue/20 text-xs text-cr-accent font-bold font-mono">{clan.tag}</p>
            </div>
          </div>
          {clan.description ? <p className="relative text-sm text-cr-muted mt-4 leading-relaxed">{clan.description}</p> : null}
          <div className="relative grid grid-cols-2 gap-3 mt-5">
            {overview.map(({ label, value, icon: Icon, tone, iconTone }) => (
              <div key={label} className={`rounded-2xl bg-gradient-to-br ${tone} border px-3 py-3 min-w-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_7px_16px_rgba(0,0,0,0.16)]`}>
                <div className="flex items-center gap-2 text-cr-muted">
                  <span className={`w-6 h-6 shrink-0 rounded-lg border flex items-center justify-center ${iconTone}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs truncate">{label}</span>
                </div>
                <p className="text-lg font-extrabold text-cr-text mt-2 truncate">{value}</p>
              </div>
            ))}
          </div>
          {clan.required_trophies != null ? (
            <p className="relative inline-flex items-center gap-1.5 text-xs text-cr-muted mt-4 px-2.5 py-1.5 rounded-lg bg-cr-bg/35 border border-cr-border">
              <Trophy className="w-3.5 h-3.5 text-cr-gold" /> Вход от {formatNumber(clan.required_trophies)} трофеев
            </p>
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

          <Card className="!p-0 mt-2 border-cr-blue/20 shadow-[0_10px_24px_rgba(0,0,0,0.14)]" noMotion>
            {data.members.map((member, index) => (
              <div
                key={member.tag}
                className={
                  "flex items-center gap-3 px-4 py-3 " +
                  (index > 0 ? "border-t border-cr-border" : "") +
                  (member.tag === data.current_player_tag
                    ? " bg-gradient-to-r from-cr-blue/20 via-cr-blue/10 to-transparent shadow-[inset_3px_0_0_rgb(var(--cr-blue))]"
                    : "")
                }
              >
                <span className="w-6 text-center text-xs font-mono text-cr-muted shrink-0">
                  {member.clan_rank ?? "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-cr-text truncate">
                    {member.name}
                    {member.tag === data.current_player_tag ? (
                      <span className="ml-2 text-xs font-semibold text-cr-blue">Вы</span>
                    ) : null}
                  </p>
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
