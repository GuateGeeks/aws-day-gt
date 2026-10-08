import { httpsCallable } from "firebase/functions";
import { Medal } from "lucide-react";
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
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const result = await httpsCallable<unknown, LeaderboardSnapshot>(functions, "getLeaderboardSnapshot")({});
      setRows(result.data.rows);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <section className="stack leaderboard-page">
    <p className="eyebrow">Comunidad en acción</p>
    <h1>Ranking de créditos</h1>
    <p className="muted">Solo aparecen participantes registrados. El ranking cuenta los créditos ganados y descontados en los desafíos.</p>
    {state === "loading" ? <p role="status">Cargando ranking…</p> : null}
    {state === "error" ? <div className="stack"><StatusNotice tone="error">No pudimos cargar el ranking.</StatusNotice><button type="button" onClick={() => void load()}>Intentar de nuevo</button></div> : null}
    {state === "ready" && rows.length ? <Card className="leaderboard"><ol>{rows.map((row) => <li className={row.userId === user?.uid ? "is-you" : ""} key={row.userId}><span className="rank">{row.rank <= 3 ? <Medal aria-label={`Posición ${row.rank}`} /> : row.rank}</span><strong className="grow">{row.alias}{row.userId === user?.uid ? " (tú)" : ""}</strong><CreditAmount value={row.auraTotal} /></li>)}</ol></Card> : null}
    {state === "ready" && !rows.length ? <EmptyState title="El ranking empieza pronto">Sé la primera persona en completar un Challenge.</EmptyState> : null}
  </section>;
}
