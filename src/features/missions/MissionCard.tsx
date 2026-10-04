import { Camera, MessageSquareText, Type } from "lucide-react";
import { Link } from "react-router-dom";
import type { AssignedMission } from "./useMissions";
import { Card, Chip } from "../../design-system/components";

const icons = { photo: Camera, comment: MessageSquareText, word: Type };
const statusLabel = { available: "Pendiente", submitted: "En revisión", approved: "Completada", rejected: "Intenta de nuevo", replaced: "Reemplazada", cancelled: "Cancelada", expired: "Expirada" };
export function MissionCard({ item }: { item: AssignedMission }) {
  const Icon = icons[item.mission.evidenceType];
  return <Link className="mission-link" to={`/app/missions/${item.missionId}`}><Card interactive className={`mission-card mission-card--${item.status}`}><div className="mission-icon"><Icon aria-hidden /></div><div className="grow stack mission-copy"><div className="cluster"><Chip>{item.points} pts</Chip><span className="status-label">{statusLabel[item.status]}</span></div><h2>{item.mission.title}</h2><p className="muted">{item.mission.description}</p></div></Card></Link>;
}
