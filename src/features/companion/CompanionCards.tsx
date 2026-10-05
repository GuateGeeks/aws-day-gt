import { ArrowRight, CalendarHeart, Clock3, Feather, MapPin, Star, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ROOMS, sessionDate, type AgendaSession } from "../../../shared/agenda";
import { countdownTo, findSessionForMission, quetziStage } from "../../../shared/companion";
import { Card, Chip, ProgressBar } from "../../design-system/components";
import type { AssignedMission } from "../missions/useMissions";
import { QuetziSprite } from "./QuetziSprite";

const TOTAL_FEATHERS = 11;

export function CountdownCard({ now, routeCount }: { now: Date; routeCount: number }) {
  const { days, hours, minutes } = countdownTo(now, sessionDate("07:30"));
  return <Card className="stack companion-card">
    <h2><Clock3 aria-hidden size={20} /> Cuenta regresiva</h2>
    <div className="countdown" aria-label={`${days} días, ${hours} horas y ${minutes} minutos para el registro`}>
      {[[days, "días"], [hours, "horas"], [minutes, "min"]].map(([value, unit]) => <div key={unit}><strong>{value}</strong><span>{unit}</span></div>)}
    </div>
    <p className="muted">Sábado 10 de octubre · registro desde las 7:30 · Universidad Rafael Landívar, zona 16.</p>
    <Link className="companion-cta" to="/app/agenda"><Star aria-hidden size={18} />{routeCount ? `Tu ruta tiene ${routeCount} sesiones` : "Arma tu ruta del día"}<ArrowRight aria-hidden size={18} /></Link>
  </Card>;
}

function SessionLine({ session, starred }: { session: AgendaSession; starred: boolean }) {
  const room = ROOMS[session.room];
  return <li className="session-line">
    {starred && <Star aria-label="En tu ruta" size={16} fill="currentColor" className="session-line__star" />}
    <div className="grow"><strong>{session.title}</strong><span className="muted"><MapPin aria-hidden size={13} /> {room.short} · {room.building}{session.speaker ? ` · ${session.speaker}` : ""}</span></div>
  </li>;
}

export function NowNextCard({ now, current, next, isStarred }: { now: Date; current: AgendaSession[]; next: AgendaSession[]; isStarred: (id: string) => boolean }) {
  const nextStart = next[0]?.start;
  const minutes = nextStart ? countdownTo(now, sessionDate(nextStart)).totalMinutes : 0;
  const top = (sessions: AgendaSession[]) => [...sessions].sort((a, b) => Number(isStarred(b.id)) - Number(isStarred(a.id))).slice(0, 3);
  return <Card className="stack companion-card">
    {current.length > 0 && <><h2>Ahora</h2><ul className="session-lines">{top(current).map((session) => <SessionLine key={session.id} session={session} starred={isStarred(session.id)} />)}</ul></>}
    {nextStart && <><h2>Siguiente · {nextStart} <Chip>en {minutes} min</Chip></h2><ul className="session-lines">{top(next).map((session) => <SessionLine key={session.id} session={session} starred={isStarred(session.id)} />)}</ul></>}
    <Link className="companion-cta" to="/app/agenda"><CalendarHeart aria-hidden size={18} />Ver toda la agenda<ArrowRight aria-hidden size={18} /></Link>
  </Card>;
}

export function ChallengeCard({ item }: { item?: AssignedMission }) {
  if (!item) return <Card className="stack companion-card"><h2><Target aria-hidden size={20} /> Reto de Quetzi</h2><p className="muted">No tienes retos pendientes por ahora. ¡Revisa tu progreso o el ranking!</p></Card>;
  const session = findSessionForMission(item.mission);
  return <Card className="stack companion-card challenge-card">
    <h2><Target aria-hidden size={20} /> Reto de Quetzi</h2>
    <Link className="challenge-link" to={`/app/missions/${item.missionId}`}>
      <span className="grow"><strong>{item.mission.title}</strong><span className="muted">{session ? `${session.start} · ${ROOMS[session.room].short}` : "Puedes hacerlo en cualquier momento"}</span></span>
      <Chip>+{item.points} pts</Chip>
    </Link>
  </Card>;
}

export function FeatherCard({ completed }: { completed: number }) {
  const stage = quetziStage(completed);
  const feathers = Math.min(completed, TOTAL_FEATHERS);
  return <Card className="feather-card">
    <QuetziSprite completed={completed} className="feather-card__bird" label={`Quetzi en etapa ${stage.name}`} />
    <div className="grow stack">
      <p className="eyebrow"><Feather aria-hidden size={14} /> {stage.name}</p>
      <strong>{feathers} de {TOTAL_FEATHERS} plumas</strong>
      <ProgressBar value={feathers} max={TOTAL_FEATHERS} label="Plumas de Quetzi" />
      <p className="muted">{stage.description}{stage.nextAt ? ` Siguiente etapa con ${stage.nextAt} misiones.` : ""}</p>
    </div>
  </Card>;
}

const BUILDINGS = [
  ["Edificio O", "Auditorio Principal Tajumulco · plenarias y keynotes"],
  ["Edificio H", "Tacaná, Acatenango, Santa María, Agua y Fuego"],
  ["Biblioteca", "Casa de Kiro"],
  ["Laboratorio", "Workshop práctico"]
] as const;

export function RoomGuide() {
  return <details className="ds-card room-guide">
    <summary><MapPin aria-hidden size={18} /> ¿Dónde queda cada sala?</summary>
    <dl>{BUILDINGS.map(([building, rooms]) => <div key={building}><dt>{building}</dt><dd className="muted">{rooms}</dd></div>)}</dl>
  </details>;
}
