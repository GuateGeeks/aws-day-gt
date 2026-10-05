import { useMemo, useState } from "react";
import { AGENDA, ROOMS, TRACKS, agendaSlots, type AgendaSession, type Track } from "../../../shared/agenda";
import { findConflicts, findSessionForMission, isRecommended, sessionsAt, sortByRecommendation } from "../../../shared/companion";
import { EmptyState, StatusNotice } from "../../design-system/components";
import { useAuth } from "../auth/AuthProvider";
import { useNow } from "../companion/useNow";
import { useMissions } from "../missions/useMissions";
import { SessionCard } from "./SessionCard";
import { useMyRoute } from "./useMyRoute";
import "./agenda.css";

const COMMON_KINDS = new Set<AgendaSession["kind"]>(["break", "plenary", "social"]);

function PlenaryRow({ session }: { session: AgendaSession }) {
  const who = [session.speaker, session.org].filter(Boolean).join(" · ");
  return <p className="plenary-row"><strong>{session.title}</strong>{who && <span className="muted"> · {who}</span>}<span className="muted"> · {session.start}–{session.end}{session.room !== "plenaria" ? ` · ${ROOMS[session.room].short}` : ""}</span></p>;
}

export function AgendaPage() {
  const { profile } = useAuth(); const { items } = useMissions(); const now = useNow(); const route = useMyRoute();
  const [track, setTrack] = useState<Track | "all">("all"); const [onlyRoute, setOnlyRoute] = useState(false);
  const interests = profile?.interests ?? [];
  const liveIds = new Set(sessionsAt(now).map((session) => session.id));
  const missionBySession = useMemo(() => new Map(items.filter((item) => item.status !== "replaced").flatMap((item) => {
    const session = findSessionForMission(item.mission);
    return session ? [[session.id, item.missionId] as const] : [];
  })), [items]);
  const conflicts = findConflicts(route.ids);
  const visible = AGENDA.filter((session) => (!onlyRoute || route.has(session.id)) && (track === "all" || session.track === track) && (track === "all" && !onlyRoute || !COMMON_KINDS.has(session.kind)));
  const slots = agendaSlots(visible);

  return <section className="stack">
    <header className="stack page-heading">
      <p className="eyebrow">Sábado 10 de octubre · URL Campus Central</p>
      <h1>Agenda</h1>
      <p className="muted">Salas en paralelo todo el día. Toca la estrella para armar tu ruta y Quetzi te guiará.</p>
    </header>
    <div className="segmented" role="group" aria-label="Vista">
      <button type="button" aria-pressed={!onlyRoute} onClick={() => setOnlyRoute(false)}>Todo</button>
      <button type="button" aria-pressed={onlyRoute} onClick={() => setOnlyRoute(true)}>Mi ruta ({route.ids.length})</button>
    </div>
    <div className="filter-row" role="group" aria-label="Filtrar por track">
      <button type="button" className="filter-chip" aria-pressed={track === "all"} onClick={() => setTrack("all")}>Todos los tracks</button>
      {TRACKS.map((name) => <button type="button" key={name} className="filter-chip" aria-pressed={track === name} onClick={() => setTrack(name)}>{name}</button>)}
    </div>
    {conflicts.length > 0 && <StatusNotice tone="error">Tienes sesiones al mismo tiempo: {conflicts.map(([a, b]) => `«${a.title}» y «${b.title}»`).join("; ")}. Quetzi no puede volar a dos salas a la vez.</StatusNotice>}
    {slots.length === 0 && <EmptyState title={onlyRoute ? "Tu ruta está vacía" : "Sin sesiones"}>{onlyRoute ? "Marca con estrella las charlas que no te quieres perder." : "Prueba con otro track."}</EmptyState>}
    {slots.map((slot) => {
      const inSlot = visible.filter((session) => session.start === slot);
      const live = inSlot.some((session) => liveIds.has(session.id));
      const headingId = `slot-${slot.replace(":", "")}`;
      return <section key={slot} className="agenda-slot" aria-labelledby={headingId}>
        <h2 id={headingId} className="agenda-slot__time">{slot}{live && <span className="live-pill">En curso</span>}</h2>
        <div className="agenda-slot__list">
          {sortByRecommendation(inSlot, interests).map((session) => COMMON_KINDS.has(session.kind)
            ? <PlenaryRow key={session.id} session={session} />
            : <SessionCard key={session.id} session={session} starred={route.has(session.id)} recommended={isRecommended(session, interests)} live={liveIds.has(session.id)} missionId={missionBySession.get(session.id)} onToggle={route.toggle} />)}
        </div>
      </section>;
    })}
    <p className="muted source-note">Fuente: agenda oficial en awscommunitygt.com. Puede cambiar el día del evento.</p>
  </section>;
}
