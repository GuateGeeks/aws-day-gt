import { useCallback, useEffect, useRef, useState } from "react";
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
  const activeIndexRef = useRef(0);
  const interactionAtRef = useRef(-Infinity);
  const pausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sessionIds = sessions.map((session) => session.id).join(",");
  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [sessionIds]);

  const goTo = useCallback((index: number, manual = false) => {
    const track = trackRef.current;
    if (!track || sessions.length < 2) return;
    if (manual) interactionAtRef.current = Date.now();
    const targetIndex = (index + sessions.length) % sessions.length;
    const first = track.children[0] as HTMLElement | undefined;
    const target = track.children[targetIndex] as HTMLElement | undefined;
    if (!first || !target) return;
    activeIndexRef.current = targetIndex;
    setActiveIndex(targetIndex);
    track.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
  }, [sessions.length]);

  useEffect(() => {
    if (sessions.length < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.hidden || pausedRef.current || Date.now() - interactionAtRef.current < 8000) return;
      goTo(activeIndexRef.current + 1);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [goTo, sessionIds, sessions.length]);

  function move(direction: -1 | 1) {
    goTo(activeIndexRef.current + direction, true);
  }
  function syncIndex() {
    const track = trackRef.current;
    if (!track || !track.children.length) return;
    const first = track.children[0] as HTMLElement;
    const nearest = [...track.children].reduce((best, child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - first.offsetLeft - track.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
    if (nearest !== activeIndexRef.current) {
      activeIndexRef.current = nearest;
      setActiveIndex(nearest);
    }
  }
  return <section className={`agenda-carousel${next ? " agenda-carousel--next" : ""}`}
    onMouseEnter={() => { pausedRef.current = true; }}
    onMouseLeave={() => { pausedRef.current = false; }}
    onFocusCapture={() => { pausedRef.current = true; }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false; }}
    onPointerDown={() => { interactionAtRef.current = Date.now(); }}>
    <div className="agenda-carousel__heading">
      <div><h2>{title}</h2>{detail && <span>{detail}</span>}</div>
      {sessions.length > 1 && <div className="agenda-carousel__controls">
        <span className="agenda-carousel__position">{activeIndex + 1} de {sessions.length}</span>
        <button type="button" aria-label={`Ver actividades anteriores: ${label}`} onClick={() => move(-1)}><ChevronLeft aria-hidden size={20} /></button>
        <button type="button" aria-label={`Ver más actividades: ${label}`} onClick={() => move(1)}><ChevronRight aria-hidden size={20} /></button>
      </div>}
    </div>
    <ul className="agenda-carousel__track" aria-label={label} ref={trackRef} onScroll={syncIndex}>
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
  const untilNext = nextStart ? countdownTo(now, sessionDate(nextStart)).totalMinutes : undefined;
  const liveDetail = status === "live" && sessions.length === 1 && next.length > 1 && untilNext !== undefined && untilNext <= 5
    ? `1 actividad en curso · ${next.length} actividades empiezan a las ${nextStart}` : undefined;
  const label = status === "preview" ? "Vista previa" : status === "live" ? "En vivo" : "Próximamente";
  return <Card className={`agenda-spotlight agenda-spotlight--${status}`}>
    <div className="agenda-spotlight__masthead"><img src="/brand/aws-cd-2026-blanco.png" alt="AWS Community Day Guatemala" width={1465} height={774} /></div>
    <div className="agenda-spotlight__body stack">
      <div className="agenda-spotlight__top"><span className={`agenda-spotlight__status agenda-spotlight__status--${status}`}>{label}</span><span>Sábado 10 de octubre{rehearsal ? " · simulación de hoy" : ""} · hora de Guatemala</span></div>
      <AgendaCarousel title={status === "preview" ? "Primera actividad" : status === "live" ? "En este momento" : "Próximas actividades"} label={status === "live" ? "Actividades en vivo" : "Próximas actividades"} sessions={sessions} detail={liveDetail} />
      {nextStart && <AgendaCarousel title="A continuación" label="A continuación" sessions={next} detail={`${nextStart} · en ${untilNext} min`} next />}
      {status === "preview" && <p className="agenda-spotlight__note">Así se verá el bloque en vivo durante el evento. El horario avanza automáticamente el 10 de octubre.</p>}
      <OfficialAgendaLink>Ver agenda oficial</OfficialAgendaLink>
    </div>
  </Card>;
}
