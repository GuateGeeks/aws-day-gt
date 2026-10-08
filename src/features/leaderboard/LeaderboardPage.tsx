import { httpsCallable } from "firebase/functions";
import { Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, StatusNotice } from "../../design-system/components";
import { CreditAmount } from "../../design-system/credits";
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
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [personalRank, setPersonalRank] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const result = await httpsCallable<unknown, LeaderboardSnapshot>(functions, "getLeaderboardSnapshot")({});
      setRows(result.data.rows);
      setPersonalRank(result.data.personalRank);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <section className="stack leaderboard-page">
    <header className="ranking-intro"><div className="ranking-intro__icon"><Trophy aria-hidden size={26} /></div><div><p className="eyebrow">Comunidad en acción</p><h1>Ranking de créditos</h1><p>Solo aparecen participantes registrados. El saldo incluye créditos ganados y descontados en los desafíos.</p></div>{state === "ready" && personalRank !== null && <div className="ranking-intro__position"><small>Tu posición</small><strong>#{personalRank}</strong></div>}</header>
    {state === "loading" ? <p role="status">Cargando ranking…</p> : null}
    {state === "error" ? <div className="stack"><StatusNotice tone="error">No pudimos cargar el ranking.</StatusNotice><button type="button" onClick={() => void load()}>Intentar de nuevo</button></div> : null}
    {state === "ready" && rows.length ? <Card className="leaderboard"><div className="leaderboard__heading"><h2>Participantes</h2><span>Créditos</span></div><ol>{rows.map((row) => <li className={`${row.userId === user?.uid ? "is-you" : ""} ${row.rank <= 3 ? "is-podium" : ""}`} key={row.userId}><span className={`rank rank--${Math.min(row.rank, 4)}`} aria-label={`Posición ${row.rank}`}>{String(row.rank).padStart(2, "0")}</span><span className="leaderboard__person"><strong>{row.alias}{row.userId === user?.uid ? " (tú)" : ""}</strong><small>{row.completedChallenges} {row.completedChallenges === 1 ? "reto completado" : "retos completados"}</small></span><CreditAmount value={row.auraTotal} /></li>)}</ol></Card> : null}
    {state === "ready" && !rows.length ? <EmptyState title="El ranking empieza pronto">Sé la primera persona en completar un Challenge.</EmptyState> : null}
  </section>;
}
