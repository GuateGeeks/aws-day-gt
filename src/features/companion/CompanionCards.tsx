import { CalendarDays, ExternalLink } from "lucide-react";
import { OFFICIAL_AGENDA_URL, ROOMS, sessionDate } from "../../../shared/agenda";
import { countdownTo, getAgendaSpotlight, nextSessions } from "../../../shared/companion";
import { Card } from "../../design-system/components";

/** Sessions, rooms and schedule changes live on the official site; the app always links there. */
export function OfficialAgendaLink({ children = "Ver agenda oficial" }: { children?: string }) {
  return <a className="companion-cta" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
    <CalendarDays aria-hidden size={18} />{children}<ExternalLink aria-hidden size={16} />
  </a>;
}

export function AgendaSpotlightCard({ now, rehearsal = false }: { now: Date; rehearsal?: boolean }) {
  const { status, sessions } = getAgendaSpotlight(now);
  const featured = sessions[0];
  if (status === "ended" || !featured) return null;
  const next = status === "preview" ? [] : nextSessions(status === "live" ? now : sessionDate(featured.start));
  const nextStart = next[0]?.start;
  const others = sessions.slice(1);
  const label = status === "preview" ? "Vista previa" : status === "live" ? "En vivo" : "Próximamente";
  return <Card className={`agenda-spotlight agenda-spotlight--${status}`}>
    <div className="agenda-spotlight__masthead"><img src="/brand/aws-cd-2026-blanco.png" alt="AWS Community Day Guatemala" width={1465} height={774} /></div>
    <div className="agenda-spotlight__body stack">
      <div className="agenda-spotlight__top"><span className={`agenda-spotlight__status agenda-spotlight__status--${status}`}>{label}</span><span>Sábado 10 de octubre{rehearsal ? " · simulación local" : ""} · hora de Guatemala</span></div>
      <div className="agenda-spotlight__featured"><span className="agenda-spotlight__time">{featured.start}–{featured.end}</span><h2>{featured.title}</h2><p>{featured.speaker ? `${featured.speaker} · ` : ""}{ROOMS[featured.room].name}</p></div>
      {others.length > 0 && <div className="agenda-spotlight__other"><strong>También en este horario</strong><ul>{others.map((session) => <li key={session.id}><span>{session.start} · {ROOMS[session.room].short}</span><h3>{session.title}</h3>{session.speaker && <small>{session.speaker}</small>}</li>)}</ul></div>}
      {nextStart && <div className={`agenda-spotlight__other agenda-spotlight__next${next.length === 1 ? " agenda-spotlight__next--single" : ""}`}><div className="agenda-spotlight__next-heading"><strong>A continuación</strong><span>{nextStart} · en {countdownTo(now, sessionDate(nextStart)).totalMinutes} min</span></div><ul>{next.map((session) => <li key={session.id}><span>{ROOMS[session.room].short}</span><h3>{session.title}</h3>{session.speaker && <small>{session.speaker}</small>}</li>)}</ul></div>}
      {status === "preview" && <p className="agenda-spotlight__note">Así se verá el bloque en vivo durante el evento. El horario avanza automáticamente el 10 de octubre.</p>}
      <OfficialAgendaLink>Ver agenda oficial</OfficialAgendaLink>
    </div>
  </Card>;
}
