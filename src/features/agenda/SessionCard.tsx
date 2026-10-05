import { MapPin, Sparkles, Star, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { ROOMS, type AgendaSession } from "../../../shared/agenda";
import { Chip } from "../../design-system/components";
import { TRACK_COLORS } from "./track-colors";

type Props = {
  session: AgendaSession;
  starred: boolean;
  recommended: boolean;
  live: boolean;
  missionId?: string;
  onToggle: (id: string) => void;
};

export function SessionCard({ session, starred, recommended, live, missionId, onToggle }: Props) {
  const room = ROOMS[session.room];
  const byline = [session.speaker, session.org ?? session.origin].filter(Boolean).join(" · ");
  return <article className={`session-card${starred ? " session-card--starred" : ""}${live ? " session-card--live" : ""}`} aria-label={session.title}>
    <div className="session-card__top">
      <div className="cluster">
        {session.track && <Chip color={TRACK_COLORS[session.track]}>{session.track}</Chip>}
        {recommended && <span className="session-flag"><Sparkles aria-hidden size={14} />Quetzi recomienda</span>}
      </div>
      <button type="button" className="star-button" aria-pressed={starred} aria-label={`${starred ? "Quitar de" : "Agregar a"} mi ruta: ${session.title}`} onClick={() => onToggle(session.id)}>
        <Star aria-hidden size={22} fill={starred ? "currentColor" : "none"} />
      </button>
    </div>
    <h3>{session.title}</h3>
    {byline && <p className="muted">{byline}</p>}
    <p className="session-card__meta"><MapPin aria-hidden size={15} />{room.name} · {room.building} · {session.start}–{session.end}</p>
    {session.note && <p className="session-card__note">{session.note}</p>}
    {missionId && <Link className="session-mission" to={`/app/missions/${missionId}`}><Target aria-hidden size={16} />Tienes una misión aquí</Link>}
  </article>;
}
