import { Link } from "react-router-dom";
import { Card, ProgressBar, StatusNotice } from "../../design-system/components";
import { CreditAmount, formatCredits } from "../../design-system/credits";
import { CreditDashboard } from "../../design-system/CreditDashboard";
import { EventLogo } from "../../design-system/EventLogo";
import { incorrectAnswerPenalty } from "../../../shared/challenges/credit-policy";
import { useChallenges } from "../challenges/useChallenges";
import { challengeSummary, nextAvailableChallenge } from "../challenges/challenge-view";

export function ProgressPage() {
  const { items, auraTotal, auraDeductedTotal, loading, error } = useChallenges();
  const { mainCompleted, bonusCompleted, selfieCompleted, totalCompleted, auraPotential, auraInReview } = challengeSummary(items);
  const next = nextAvailableChallenge(items);
  const total = items.length || 10;
  if (loading) return <section className="stack progress-page"><h1>Progreso</h1><p role="status">Cargando tu progreso…</p></section>;

  return <section className="stack progress-page">
    <header className="progress-intro"><EventLogo className="event-mark--section" /><p className="eyebrow">Tu recorrido</p><h1>Tu progreso</h1><p className="muted">Cada reto cuenta. Aquí puedes ver lo que ganaste, lo que se descontó y lo que te falta por descubrir.</p></header>
    {error && <StatusNotice tone="error">{error}</StatusNotice>}
    <CreditDashboard balance={auraTotal} balanceFallback={error ? "Créditos no disponibles" : "Cargando créditos…"} deducted={auraDeductedTotal} available={auraPotential} inReview={auraInReview} />
    <div className="progress-completion"><div className="progress-completion__top"><span>Retos completados</span><strong>{totalCompleted} / {total}</strong></div><ProgressBar value={totalCompleted} max={total} label="Retos completados" /><p>{mainCompleted} retos base · {bonusCompleted} preguntas AWS</p></div>
    {next && <Link className="challenge-next" to={`/app/challenges/${next.challenge.id}`}><span><small>TU SIGUIENTE DESAFÍO</small><strong>{next.challenge.title}</strong><span>Continúa y suma {formatCredits(next.challenge.auraReward)}</span></span><span className="challenge-next__arrow" aria-hidden>→</span></Link>}
    <section className="stack" aria-labelledby="progress-list-title">
      <div className="challenge-section__heading"><h2 id="progress-list-title">Todos tus retos</h2><span className="muted">{totalCompleted}/{total}</span></div>
      <div className="progress-list">{items.map(({ challenge, progress }, index) => {
        const completed = progress.status === "completed";
        const failed = progress.status === "failed";
        const caption = challenge.id === "C08" && progress.status === "in_progress" ? `Paso ${(progress.architectureStep ?? 0) + 1} de 2` : completed ? "Completado" : failed ? "Respuesta incorrecta · cerrado" : progress.status === "processing" ? "En revisión" : progress.status === "locked" ? "Próximamente" : "Por hacer";
        return <Link key={challenge.id} to={`/app/challenges/${challenge.id}`} className={`progress-item progress-item--${progress.status}`}>
          <span className="progress-item__number">{completed ? "✓" : failed ? "−" : String(index + 1).padStart(2, "0")}</span>
          <span className="progress-item__body"><strong>{challenge.title}</strong><small>{caption}</small></span>
          <span className="progress-item__aura"><CreditAmount value={failed ? -(progress.auraDeducted ?? incorrectAnswerPenalty(challenge)) : completed ? progress.auraAwarded ?? challenge.auraReward : challenge.auraReward} signed /><small>{completed ? "Ganados" : failed ? "Descontados" : progress.status === "processing" ? "En revisión" : "Por ganar"}</small></span>
        </Link>;
      })}</div>
    </section>
    <Card className="stack"><h2>Selfies del evento</h2><p className="muted">{selfieCompleted} de 2 aprobadas por el equipo</p><ProgressBar value={selfieCompleted} max={2} label="Selfies aprobadas" /><Link to="/app/geek-id">Ver selfies en Mi Geek ID →</Link></Card>
  </section>;
}
