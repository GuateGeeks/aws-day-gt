import { CalendarDays, Clock3, ExternalLink } from "lucide-react";
import { OFFICIAL_AGENDA_URL, ROOMS, sessionDate } from "../../../shared/agenda";
import { countdownTo, getAgendaSpotlight } from "../../../shared/companion";
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

export function AgendaSpotlightCard({ now }: { now: Date }) {
  const { status, sessions } = getAgendaSpotlight(now);
  const featured = sessions[0];
  if (status === "ended" || !featured) return null;
  const others = sessions.slice(1);
  const label = status === "preview" ? "Vista previa" : status === "live" ? "En vivo" : "Próximamente";
  return <Card className={`agenda-spotlight agenda-spotlight--${status}`}>
    <div className="agenda-spotlight__masthead">
      <img src="/brand/aws-community-day-guatemala.png" alt="AWS Community Day Guatemala" width={1536} height={1024} />
      <span className="agenda-spotlight__credit"><img src="/brand/guategeeks.png" alt="" width={800} height={800} />Creado por GuateGeeks</span>
    </div>
    <div className="agenda-spotlight__body stack">
      <div className="agenda-spotlight__top"><span className={`agenda-spotlight__status agenda-spotlight__status--${status}`}>{label}</span><span>Sábado 10 de octubre · hora de Guatemala</span></div>
      <div className="agenda-spotlight__featured"><span className="agenda-spotlight__time">{featured.start}–{featured.end}</span><h2>{featured.title}</h2><p>{featured.speaker ? `${featured.speaker} · ` : ""}{ROOMS[featured.room].name}</p></div>
      {others.length > 0 && <div className="agenda-spotlight__other"><strong>También en este horario</strong><ul>{others.map((session) => <li key={session.id}><span>{session.start} · {ROOMS[session.room].short}</span><h3>{session.title}</h3>{session.speaker && <small>{session.speaker}</small>}</li>)}</ul></div>}
      {status === "preview" && <p className="agenda-spotlight__note">Así se verá el bloque en vivo durante el evento. El horario avanza automáticamente el 10 de octubre.</p>}
      <OfficialAgendaLink>Ver agenda oficial</OfficialAgendaLink>
    </div>
  </Card>;
}
