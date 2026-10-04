import { httpsCallable } from "firebase/functions";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Chip, StatusNotice } from "../../design-system/components";
import { functions } from "../../firebase/functions";
import { PhotoEvidence } from "../submissions/PhotoEvidence";
import { TextEvidence } from "../submissions/TextEvidence";
import { useMissions } from "./useMissions";

export function MissionDetailPage() {
  const { missionId } = useParams(); const { items, loading } = useMissions(); const navigate = useNavigate(); const item = items.find((entry) => entry.missionId === missionId);
  if (loading) return <p role="status">Cargando misión…</p>; if (!item) return <Navigate to="/app/missions" replace />;
  async function replace() { if (!confirm("¿Reemplazar esta misión? Solo puedes hacerlo dos veces.")) return; try { const result = await httpsCallable(functions, "replaceMission")({ missionId: item?.missionId }); navigate(`/app/missions/${(result.data as { missionId: string }).missionId}`, { replace: true }); } catch { alert("No hay un reemplazo compatible disponible."); } }
  const locked = item.status === "approved" || item.status === "submitted";
  return <section className="stack"><Link className="back-link" to="/app/missions"><ArrowLeft aria-hidden size={18} /> Mis misiones</Link><div className="cluster"><Chip>{item.points} puntos</Chip><Chip>{item.mission.evidenceType === "photo" ? "Foto" : item.mission.evidenceType === "word" ? "Una palabra" : "Comentario"}</Chip></div><h1>{item.mission.title}</h1><p className="lead">{item.mission.description}</p><Card className="stack"><h2>Tu misión</h2><p>{item.mission.instructions}</p>{item.mission.room && <p className="muted">{item.mission.room}{item.mission.speaker ? ` · ${item.mission.speaker}` : ""}</p>}</Card>{locked ? <StatusNotice tone="success">{item.status === "approved" ? "Misión completada y puntos otorgados." : "Evidencia enviada y pendiente de revisión."}</StatusNotice> : item.mission.evidenceType === "photo" ? <PhotoEvidence mission={item.mission} /> : <TextEvidence mission={item.mission} />}{item.status === "available" && <Button variant="ghost" onClick={replace}><RefreshCw aria-hidden size={18} /> Reemplazar misión</Button>}</section>;
}
