import { CalendarDays, Clock3, ExternalLink } from "lucide-react";
import { OFFICIAL_AGENDA_URL, sessionDate } from "../../../shared/agenda";
import { countdownTo } from "../../../shared/companion";
import { Card, Chip } from "../../design-system/components";

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
