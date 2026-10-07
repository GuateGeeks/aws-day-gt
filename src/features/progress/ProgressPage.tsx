import { Link } from "react-router-dom";
import { Card, ProgressBar, StatusNotice } from "../../design-system/components";
import { useChallenges } from "../challenges/useChallenges";
import { challengeSummary, nextAvailableChallenge } from "../challenges/challenge-view";

export function ProgressPage() {
  const { items, auraTotal, auraDeductedTotal, loading, error } = useChallenges();
  const { mainCompleted, bonusCompleted, selfieCompleted, totalCompleted, auraPotential, auraInReview } = challengeSummary(items);
  const next = nextAvailableChallenge(items);
  const total = items.length || 10;
  if (loading) return <section className="stack progress-page"><h1>Progreso</h1><p role="status">Cargando tu progreso…</p></section>;

  return <section className="stack progress-page">
    <p className="eyebrow">Tu recorrido</p><h1>Progreso</h1>
    {error && <StatusNotice tone="error">{error}</StatusNotice>}
    <Card className="score-hero stack">
      <span>Tu saldo de Aura</span><strong>{auraTotal ?? "—"}</strong>
      <span>Gana Aura en los retos y recupera tu saldo si te equivocaste.</span>
      <span>{totalCompleted} de {total} retos completados · {mainCompleted} base · {bonusCompleted} preguntas AWS</span>
      <ProgressBar value={totalCompleted} max={total} label="Retos completados" />
    </Card>
    <div className="aura-ledger" aria-label="Detalle de tu Aura">
      <Card className="aura-ledger__item"><span>Ganada</span><strong>+{auraTotal === null ? "—" : auraTotal + auraDeductedTotal}</strong><small>Aura ya obtenida</small></Card>
      <Card className="aura-ledger__item aura-ledger__item--lost"><span>Descontada</span><strong>−{auraDeductedTotal}</strong><small>Por respuestas incorrectas</small></Card>
      <Card className="aura-ledger__item"><span>Por conseguir</span><strong>+{auraPotential}</strong><small>En retos disponibles</small></Card>
      <Card className="aura-ledger__item"><span>En revisión</span><strong>+{auraInReview}</strong><small>Aura aún no acreditada</small></Card>
    </div>
    {next && <Link className="challenge-next" to={`/app/challenges/${next.challenge.id}`}><span><small>TU SIGUIENTE CHALLENGE</small><strong>{next.challenge.title}</strong><span>Continúa y suma {next.challenge.auraReward} Aura</span></span><span className="challenge-next__arrow" aria-hidden>→</span></Link>}
    <section className="stack" aria-labelledby="progress-list-title">
      <div className="challenge-section__heading"><h2 id="progress-list-title">Todos tus retos</h2><span className="muted">{totalCompleted}/{total}</span></div>
      <div className="progress-list">{items.map(({ challenge, progress }, index) => {
        const completed = progress.status === "completed";
        const failed = progress.status === "failed";
        const caption = challenge.id === "C08" && progress.status === "in_progress" ? `Paso ${(progress.architectureStep ?? 0) + 1} de 2` : completed ? "Completado" : failed ? "Respuesta incorrecta · cerrado" : progress.status === "processing" ? "En revisión" : progress.status === "locked" ? "Próximamente" : "Por hacer";
        return <Link key={challenge.id} to={`/app/challenges/${challenge.id}`} className={`progress-item progress-item--${progress.status}`}>
          <span className="progress-item__number">{completed ? "✓" : failed ? "−" : String(index + 1).padStart(2, "0")}</span>
          <span className="progress-item__body"><strong>{challenge.title}</strong><small>{caption}</small></span>
          <span className="progress-item__aura">{failed ? `−${progress.auraDeducted ?? 150}` : `+${completed ? progress.auraAwarded ?? challenge.auraReward : challenge.auraReward}`}<small>{completed ? "Aura ganada" : failed ? "Aura descontada" : progress.status === "processing" ? "En revisión" : "Por ganar"}</small></span>
        </Link>;
      })}</div>
    </section>
    <Card className="stack"><h2>Selfies del evento</h2><p className="muted">{selfieCompleted} de 2 aprobadas por el equipo</p><ProgressBar value={selfieCompleted} max={2} label="Selfies aprobadas" /><Link to="/app/geek-id">Ver selfies en Mi Geek ID →</Link></Card>
  </section>;
}
