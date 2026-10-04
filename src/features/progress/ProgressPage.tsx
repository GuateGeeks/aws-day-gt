import { doc, onSnapshot } from "firebase/firestore";
import { Award, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { BADGES } from "../../../shared/badges";
import { EVENT_ID } from "../../../shared/constants";
import type { Score } from "../../../shared/types";
import { Card, ProgressBar } from "../../design-system/components";
import { db } from "../../firebase/data";
import { useAuth } from "../auth/AuthProvider";

export function ProgressPage() {
  const { user } = useAuth(); const [score, setScore] = useState<Score | null>(null);
  useEffect(() => user ? onSnapshot(doc(db, "scores", `${EVENT_ID}_${user.uid}`), (snap) => setScore(snap.exists() ? snap.data() as Score : null)) : undefined, [user]);
  const points = score?.totalPoints ?? 0; const completed = score?.completedMissions ?? 0;
  return <section className="stack"><p className="eyebrow">Tu recorrido</p><h1>Progreso</h1><Card className="score-hero stack"><span>Tu puntaje</span><strong>{points}</strong><span>de 100 puntos</span><ProgressBar value={points} label="Puntos obtenidos" /></Card><div className="stats-grid"><Card><strong>{completed}</strong><span>completadas</span></Card><Card><strong>{score?.photoMissions ?? 0}</strong><span>fotos</span></Card><Card><strong>{score?.commentMissions ?? 0}</strong><span>comentarios</span></Card></div><h2>Insignias</h2><div className="badge-grid">{BADGES.map((badge) => { const earned = completed >= badge.threshold; return <Card key={badge.id} className={`badge ${earned ? "badge--earned" : ""}`}>{earned ? <Award aria-hidden /> : <LockKeyhole aria-hidden />}<div><h3>{badge.name}</h3><p className="muted">{badge.description}</p></div></Card>; })}</div></section>;
}
