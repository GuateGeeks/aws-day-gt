import { PartyPopper } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getEventPhase, nextSessions, quetziLine } from "../../../shared/companion";
import { Card } from "../../design-system/components";
import { CreditAmount } from "../../design-system/credits";
import { useAuth } from "../auth/AuthProvider";
import { useChallenges } from "../challenges/useChallenges";
import { CountdownCard, NextBlockCard, OfficialAgendaLink } from "./CompanionCards";
import { QuetziGuide } from "./QuetziGuide";
import { useNow } from "./useNow";
import "./companion.css";

export function CompanionPage() {
  const { profile } = useAuth(); const { items: challenges } = useChallenges(); const now = useNow();
  const [taps, setTaps] = useState(0);
  const phase = getEventPhase(now);
  const completed = challenges.filter((item) => item.progress.status === "completed").length;
  const nextChallenge = challenges.find((item) => item.progress.status === "available" || item.progress.status === "in_progress");
  const line = quetziLine({ phase, alias: profile?.alias, now, tap: taps });

  return <section className="stack companion">
    <p className="eyebrow">AWS Community Day Guatemala 2026</p>
    <QuetziGuide completed={completed} line={line} onTap={() => setTaps((count) => count + 1)} />
    {phase !== "post" && <Card className="stack companion-card"><h2>Tu próximo desafío</h2>{nextChallenge ? <Link className="challenge-link" to={`/app/challenges/${nextChallenge.challenge.id}`}><strong>{nextChallenge.challenge.title}</strong><CreditAmount value={nextChallenge.challenge.auraReward} signed /></Link> : <p className="muted">Explora tus desafíos para empezar.</p>}<Link to="/app/challenges">Ver todos mis retos</Link></Card>}
    {phase === "pre" && <CountdownCard now={now} />}
    {phase === "live" && <NextBlockCard now={now} nextStart={nextSessions(now)[0]?.start} />}
    {phase === "post" && <Card className="stack companion-card"><h2><PartyPopper aria-hidden size={20} /> ¡Gracias por venir!</h2><p className="muted">Gracias por ser parte de la comunidad AWS de Guatemala. Nos vemos en el próximo Community Day.</p><OfficialAgendaLink>Repasa la agenda oficial</OfficialAgendaLink></Card>}
  </section>;
}
