import { useEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { OFFICIAL_AGENDA_URL, ROOMS, sessionDate, type AgendaSession } from "../../../shared/agenda";
import { countdownTo, getAgendaSpotlight, nextSessions } from "../../../shared/companion";
import { Card } from "../../design-system/components";

/** Sessions, rooms and schedule changes live on the official site; the app always links there. */
export function OfficialAgendaLink({ children = "Ver agenda oficial" }: { children?: string }) {
  return <a className="companion-cta" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
    <CalendarDays aria-hidden size={18} />{children}<ExternalLink aria-hidden size={16} />
  </a>;
}

function AgendaCarousel({ title, label, sessions, detail, next = false }: {
  title: string; label: string; sessions: AgendaSession[]; detail?: string; next?: boolean;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const sessionIds = sessions.map((session) => session.id).join(",");
  useEffect(() => { if (trackRef.current) trackRef.current.scrollLeft = 0; }, [sessionIds]);
  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(260, track.clientWidth * 0.8),
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }
  return <section className={`agenda-carousel${next ? " agenda-carousel--next" : ""}`}>
    <div className="agenda-carousel__heading">
      <div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>
      {sessions.length > 1 && <div className="agenda-carousel__controls">
        <button type="button" aria-label={`Ver actividades anteriores: ${label}`} onClick={() => move(-1)}><ChevronLeft aria-hidden size={20} /></button>
        <button type="button" aria-label={`Ver más actividades: ${label}`} onClick={() => move(1)}><ChevronRight aria-hidden size={20} /></button>
      </div>}
    </div>
    <ul className="agenda-carousel__track" aria-label={label} ref={trackRef}>
      {sessions.map((session, index) => <li key={session.id} className={index === 0 && !next ? "agenda-carousel__item--lead" : undefined}>
        <a href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
          <span className="agenda-carousel__meta">{session.start}–{session.end} · {ROOMS[session.room].short}</span>
          <h3>{session.title}</h3>
          {session.speaker && <span className="agenda-carousel__speaker">{session.speaker}</span>}
          <span className="agenda-carousel__link">Ver en agenda oficial <ExternalLink aria-hidden size={14} /></span>
        </a>
      </li>)}
    </ul>
  </section>;
}

export function AgendaSpotlightCard({ now, rehearsal = false }: { now: Date; rehearsal?: boolean }) {
  const { status, sessions } = getAgendaSpotlight(now);
  const featured = sessions[0];
  if (status === "ended" || !featured) return null;
  const next = status === "preview" ? [] : nextSessions(status === "live" ? now : sessionDate(featured.start));
  const nextStart = next[0]?.start;
  const label = status === "preview" ? "Vista previa" : status === "live" ? "En vivo" : "Próximamente";
  return <Card className={`agenda-spotlight agenda-spotlight--${status}`}>
    <div className="agenda-spotlight__masthead"><img src="/brand/aws-cd-2026-blanco.png" alt="AWS Community Day Guatemala" width={1465} height={774} /></div>
    <div className="agenda-spotlight__body stack">
      <div className="agenda-spotlight__top"><span className={`agenda-spotlight__status agenda-spotlight__status--${status}`}>{label}</span><span>Sábado 10 de octubre{rehearsal ? " · simulación local" : ""} · hora de Guatemala</span></div>
      <AgendaCarousel title={status === "preview" ? "Primera actividad" : status === "live" ? "En este momento" : "Próximas actividades"} label={status === "live" ? "Actividades en vivo" : "Próximas actividades"} sessions={sessions} />
      {nextStart && <AgendaCarousel title="A continuación" label="A continuación" sessions={next} detail={`${nextStart} · en ${countdownTo(now, sessionDate(nextStart)).totalMinutes} min`} next />}
      {status === "preview" && <p className="agenda-spotlight__note">Así se verá el bloque en vivo durante el evento. El horario avanza automáticamente el 10 de octubre.</p>}
      <OfficialAgendaLink>Ver agenda oficial</OfficialAgendaLink>
    </div>
  </Card>;
}
