import { ArrowRight, PartyPopper } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getEventPhase, quetziLine } from "../../../shared/companion";
import { Card } from "../../design-system/components";
import { CreditAmount } from "../../design-system/credits";
import { useAuth } from "../auth/AuthProvider";
import { GeekBrandPanel } from "../auth/GeekEyesLogo";
import { useChallenges } from "../challenges/useChallenges";
import { AgendaSpotlightCard, OfficialAgendaLink } from "./CompanionCards";
import { BrowserReminderButton } from "./AgendaReminderCenter";
import { QuetziGuide } from "./QuetziGuide";
import { isLocalRehearsalActive, useNow } from "./useNow";
import "./companion.css";
import { SubmissionWindowNotice } from "../submissions/SubmissionWindowNotice";

export function CompanionPage() {
  const { profile } = useAuth(); const { items: challenges } = useChallenges(); const now = useNow();
  const [taps, setTaps] = useState(0);
  const phase = getEventPhase(now);
  const completed = challenges.filter((item) => item.progress.status === "completed").length;
  const nextChallenge = challenges.find((item) => item.progress.status === "available" || item.progress.status === "in_progress");
  const line = quetziLine({ phase, alias: profile?.alias, now, tap: taps });

  return <section className="stack companion">
    <div className="companion-welcome">
      <GeekBrandPanel />
      <div className="companion-welcome__body"><h1>¡Bienvenido{profile?.alias ? `, ${profile.alias}` : ""}!</h1><p>Explora la experiencia y elige tu primer desafío. Cada reto completado suma créditos a tu recorrido.</p><Link className="ds-button ds-button--accent" to="/app/challenges">Vamos al challenge <ArrowRight aria-hidden size={20} /></Link></div>
    </div>
    <SubmissionWindowNotice />
    {phase !== "post" && <AgendaSpotlightCard now={now} rehearsal={isLocalRehearsalActive()} />}
    {phase !== "post" && <BrowserReminderButton />}
    <QuetziGuide completed={completed} line={line} onTap={() => setTaps((count) => count + 1)} />
    {phase !== "post" && <Card className="companion-next-card">
      <div className="companion-next-card__heading"><span>Tu próximo paso</span><h2>Tu próximo desafío</h2></div>
      {nextChallenge ? <Link className="companion-next-card__action" to={`/app/challenges/${nextChallenge.challenge.id}`}>
        <span className="companion-next-card__details"><strong>{nextChallenge.challenge.title}</strong><CreditAmount value={nextChallenge.challenge.auraReward} signed /></span>
        <span className="companion-next-card__button">{nextChallenge.progress.status === "in_progress" ? "Continuar desafío" : "Empezar desafío"}<ArrowRight aria-hidden size={18} /></span>
      </Link> : <p>Explora tus desafíos para empezar.</p>}
      <Link className="companion-next-card__all" to="/app/challenges">Ver todos mis retos</Link>
    </Card>}
    {phase === "post" && <Card className="stack companion-card"><h2><PartyPopper aria-hidden size={20} /> ¡Gracias por venir!</h2><p className="muted">Gracias por ser parte de la comunidad AWS de Guatemala. Nos vemos en el próximo Community Day.</p><OfficialAgendaLink>Repasa la agenda oficial</OfficialAgendaLink></Card>}
    <p className="companion-partner-note">Experiencia creada por GuateGeeks · <Link to="/app/profile#guategeeks">Conoce Sócrates y contacta al equipo</Link></p>
  </section>;
}
