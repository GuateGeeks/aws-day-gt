import { CheckCircle2, CircleDashed, LockKeyhole, Sparkles, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { isAwsServiceChallengeId } from "../../../shared/challenges/bonus";
import { incorrectAnswerPenalty } from "../../../shared/challenges/credit-policy";
import type { ChallengeState } from "../../../shared/challenges/types";
import { Card, Chip, EmptyState, ProgressBar, StatusNotice } from "../../design-system/components";
import { CreditAmount, formatCredits } from "../../design-system/credits";
import { challengeSummary, nextAvailableChallenge } from "./challenge-view";
import { useChallenges, type AssignedChallenge } from "./useChallenges";

const categoryLabel = { CONNECT: "Conecta", CLOUD: "Cloud", SESSION: "Sesiones", EXPERIENCE: "Experiencias", COMMUNITY: "Comunidad" };
const stateLabel: Record<ChallengeState, string> = { available: "Disponible", locked: "Bloqueado", in_progress: "En progreso", processing: "En revisión", completed: "Completado", failed: "Fallado · solución disponible", rejected: "Foto rechazada · reenvíala" };

function ChallengeCard({ challenge, progress }: AssignedChallenge) {
  const status = challenge.active ? stateLabel[progress.status] : "Pausado temporalmente";
  const StatusIcon = progress.status === "completed" ? CheckCircle2 : progress.status === "failed" ? XCircle : progress.status === "locked" || !challenge.active ? LockKeyhole : CircleDashed;
  return <Link to={`/app/challenges/${challenge.id}`} className="challenge-link"><Card className="challenge-card">
    <div className="challenge-card__top"><span className="eyebrow">{isAwsServiceChallengeId(challenge.id) ? "Cloud · extra" : categoryLabel[challenge.category]}</span><Chip><CreditAmount value={progress.status === "failed" ? -(progress.auraDeducted ?? incorrectAnswerPenalty(challenge)) : challenge.auraReward} signed /></Chip></div>
    <div className="challenge-card__body"><h3>{challenge.title}</h3><p className="muted">{challenge.description}</p></div>
    <span className={`challenge-card__status challenge-card__status--${progress.status}`}><StatusIcon aria-hidden size={17} />{challenge.id === "C08" && progress.status === "in_progress" ? "Paso 1 de 2 completado" : status}</span>
  </Card></Link>;
}

export function ChallengesPage() {
  const { items, auraTotal, auraDeductedTotal, loading, error } = useChallenges();
  const { main, awsBonus, selfies, totalCompleted, auraPotential, auraInReview } = challengeSummary(items);
  const next = nextAvailableChallenge(items);
  const total = items.length || 10;
  const creditLabel = auraTotal === null ? (error ? "Créditos no disponibles" : "Cargando créditos…") : formatCredits(auraTotal);
  return <section className="stack challenges-page">
    <header className="challenge-overview"><div className="challenge-overview__copy"><p className="eyebrow">AWS Community Day Guatemala</p><h1>Tus desafíos</h1><p className="muted">{totalCompleted} de {total} {total === 1 ? "reto completado" : "retos completados"}</p><div className="challenge-overview__balance"><small>Tu saldo actual</small>{auraTotal === null ? <strong>{creditLabel}</strong> : <CreditAmount value={auraTotal} />}</div><p className="challenge-overview__ledger">Ganados <strong>+{auraTotal === null ? "—" : auraTotal + auraDeductedTotal}</strong><span>·</span> Descontados <strong>−{auraDeductedTotal}</strong><span>·</span> Disponibles <strong>+{auraPotential}</strong>{auraInReview > 0 && <> <span>·</span> En revisión <strong>+{auraInReview}</strong></>}</p></div><div className="challenge-overview__progress"><strong>{totalCompleted}/{total}</strong><ProgressBar value={totalCompleted} max={total} label="Retos completados" /></div></header>
    {next && <Link className="challenge-next" to={`/app/challenges/${next.challenge.id}`}><span><small>CONTINÚA TU RECORRIDO</small><strong>{next.challenge.title}</strong><span>{next.challenge.id === "C08" && next.progress.architectureStep === 1 ? "Paso 2 de 2 listo" : `Gana ${formatCredits(next.challenge.auraReward)} al completarlo`}</span></span><span className="challenge-next__arrow" aria-hidden>→</span></Link>}
    <Link className="ds-button ds-button--secondary geek-shortcut" to="/app/geek-id">Mi Geek ID</Link>
    {error && <StatusNotice tone="error">{error}</StatusNotice>}
    {loading ? <p role="status">Cargando Challenges…</p> : items.length ? <section className="challenge-section" aria-labelledby="all-challenges">
      <div className="challenge-section__heading"><div><p className="eyebrow">Tu recorrido personal</p><h2 id="all-challenges">Todos tus retos</h2></div><span className="muted">{totalCompleted} completados</span></div>
      <p className="muted">Puedes elegir cualquier reto disponible. Las preguntas, conexiones y experiencias están mezcladas para que explores a tu ritmo.</p>
      <div className="mission-list">{items.map((item) => <ChallengeCard key={item.challenge.id} {...item} />)}</div>
    </section> : <EmptyState title="Tus retos están en camino">Estamos preparando tu recorrido.</EmptyState>}
    {items.length > 0 && <p className="challenge-footnote"><Sparkles aria-hidden size={17} /> {main.length} retos base · {awsBonus.length} preguntas AWS extra · {selfies.length} selfies con revisión.</p>}
  </section>;
}
