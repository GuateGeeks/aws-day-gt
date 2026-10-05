import { CalendarDays, Clock3, ExternalLink, Feather, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { OFFICIAL_AGENDA_URL, ROOMS, sessionDate } from "../../../shared/agenda";
import { countdownTo, findSessionForMission, missionTiming, quetziStage } from "../../../shared/companion";
import { Card, Chip, ProgressBar } from "../../design-system/components";
import type { AssignedMission } from "../missions/useMissions";
import { QuetziSprite } from "./QuetziSprite";

const TOTAL_FEATHERS = 11;

/** Sessions, rooms and schedule changes live on the official site; the app always links there. */
export function OfficialAgendaLink({ children = "Ver agenda oficial" }: { children?: string }) {
  return <a className="companion-cta" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
    <CalendarDays aria-hidden size={18} />{children}<ExternalLink aria-hidden size={16} />
  </a>;
}

export function CountdownCard({ now }: { now: Date }) {
  const { days, hours, minutes } = countdownTo(now, sessionDate("07:30"));
  return <Card className="stack companion-card">
    <h2><Clock3 aria-hidden size={20} /> Cuenta regresiva</h2>
    <div className="countdown" aria-label={`${days} días, ${hours} horas y ${minutes} minutos para el registro`}>
      {[[days, "días"], [hours, "horas"], [minutes, "min"]].map(([value, unit]) => <div key={unit}><strong>{value}</strong><span>{unit}</span></div>)}
    </div>
    <p className="muted">Sábado 10 de octubre · registro desde las 7:30 · Universidad Rafael Landívar, zona 16.</p>
    <OfficialAgendaLink>Elige tus charlas en la agenda oficial</OfficialAgendaLink>
  </Card>;
}

export function NextBlockCard({ now, nextStart }: { now: Date; nextStart?: string }) {
  const minutes = nextStart ? countdownTo(now, sessionDate(nextStart)).totalMinutes : 0;
  return <Card className="stack companion-card">
    <h2><Clock3 aria-hidden size={20} /> {nextStart ? <>Siguiente bloque: {nextStart} <Chip>en {minutes} min</Chip></> : "Última parte del día"}</h2>
    <p className="muted">Charlas, salas y cambios de último momento están en la agenda oficial.</p>
    <OfficialAgendaLink />
  </Card>;
}

const TIMING_LABEL = { now: "Ahora", next: "Siguiente" } as const;

export function ChallengeCard({ item, now }: { item?: AssignedMission; now: Date }) {
  if (!item) return <Card className="stack companion-card"><h2><Target aria-hidden size={20} /> Reto de Quetzi</h2><p className="muted">No tienes retos pendientes por ahora. ¡Revisa tu progreso o el ranking!</p></Card>;
  const session = findSessionForMission(item.mission);
  const timing = missionTiming(item.mission, now);
  return <Card className="stack companion-card challenge-card">
    <h2><Target aria-hidden size={20} /> Reto de Quetzi</h2>
    <Link className="challenge-link" to={`/app/missions/${item.missionId}`}>
      <span className="grow">
        {timing && session && <span className="challenge-link__when">{TIMING_LABEL[timing]} · {ROOMS[session.room].short}</span>}
        <strong>{item.mission.title}</strong>
        <span className="muted">{session ? `«${session.title}» · ${session.start}` : "Puedes hacerlo en cualquier momento"}</span>
      </span>
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
