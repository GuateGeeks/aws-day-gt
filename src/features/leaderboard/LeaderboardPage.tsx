import { httpsCallable } from "firebase/functions";
import { useQuery } from "@tanstack/react-query";
import { Card, EmptyState, StatusNotice } from "../../design-system/components";
import { CreditAmount } from "../../design-system/credits";
import { EventSectionHeader } from "../../design-system/EventSectionHeader";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";

interface LeaderboardRow {
  rank: number;
  userId: string;
  alias: string;
  auraTotal: number;
  completedChallenges: number;
}

interface LeaderboardSnapshot {
  rows: LeaderboardRow[];
  personalRank: number | null;
}

export function LeaderboardPage() {
  const { user } = useAuth();
  const ranking = useQuery({
    queryKey: ["leaderboard", user?.uid],
    queryFn: async () => (await httpsCallable<unknown, LeaderboardSnapshot>(functions, "getLeaderboardSnapshot")({})).data,
    staleTime: 30_000,
    retry: false
  });
  const rows = ranking.data?.rows ?? [];
  const personalRank = ranking.data?.personalRank ?? null;
  const state = ranking.isPending ? "loading" : ranking.isError ? "error" : "ready";

  return <section className="stack leaderboard-page">
    <EventSectionHeader layout="stacked" eyebrow="Comunidad en acción" title="Ranking de créditos" description="Solo aparecen participantes registrados. El saldo incluye créditos ganados y descontados en los desafíos." aside={state === "ready" && personalRank !== null ? <div className="ranking-intro__position"><small>Tu posición</small><strong>#{personalRank}</strong></div> : undefined} />
    {state === "loading" ? <p role="status">Cargando ranking…</p> : null}
    {state === "error" ? <div className="stack"><StatusNotice tone="error">No pudimos cargar el ranking.</StatusNotice><button type="button" onClick={() => void ranking.refetch()}>Intentar de nuevo</button></div> : null}
    {state === "ready" && rows.length ? <Card className="leaderboard"><div className="leaderboard__heading"><h2>Participantes</h2><span>Créditos</span></div><ol>{rows.map((row) => <li className={`${row.userId === user?.uid ? "is-you" : ""} ${row.rank <= 3 ? "is-podium" : ""}`} key={row.userId}><span className={`rank rank--${Math.min(row.rank, 4)}`} aria-label={`Posición ${row.rank}`}>{String(row.rank).padStart(2, "0")}</span><span className="leaderboard__person"><strong>{row.alias}{row.userId === user?.uid ? " (tú)" : ""}</strong><small>{row.completedChallenges} {row.completedChallenges === 1 ? "reto completado" : "retos completados"}</small></span><CreditAmount value={row.auraTotal} /></li>)}</ol></Card> : null}
    {state === "ready" && !rows.length ? <EmptyState title="El ranking empieza pronto">Sé la primera persona en completar un Challenge.</EmptyState> : null}
  </section>;
}
