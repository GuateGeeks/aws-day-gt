import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Medal } from "lucide-react";
import { useEffect, useState } from "react";
import type { Score } from "../../../shared/types";
import { Card, EmptyState } from "../../design-system/components";
import { db } from "../../firebase/data";
import { useAuth } from "../auth/AuthProvider";

export function LeaderboardPage() {
  const { user } = useAuth(); const [scores, setScores] = useState<Score[]>([]);
  useEffect(() => onSnapshot(query(collection(db, "scores"), orderBy("totalPoints", "desc"), limit(50)), (snap) => setScores(snap.docs.map((item) => item.data() as Score).sort((a, b) => b.totalPoints - a.totalPoints || String(a.finalScoreReachedAt ?? "9999").localeCompare(String(b.finalScoreReachedAt ?? "9999"))))), []);
  return <section className="stack"><p className="eyebrow">Comunidad en acción</p><h1>Ranking</h1><p className="muted">Los empates se ordenan por quién alcanzó primero su puntaje.</p>{scores.length ? <Card className="leaderboard"><ol>{scores.map((score, index) => <li className={score.userId === user?.uid ? "is-you" : ""} key={score.userId}><span className="rank">{index < 3 ? <Medal aria-label={`Posición ${index + 1}`} /> : index + 1}</span><strong className="grow">{score.alias}{score.userId === user?.uid ? " (tú)" : ""}</strong><span>{score.totalPoints} pts</span></li>)}</ol></Card> : <EmptyState title="El ranking empieza pronto">Sé la primera persona en completar una misión.</EmptyState>}</section>;
}
