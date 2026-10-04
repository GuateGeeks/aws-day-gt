import { EmptyState, ProgressBar } from "../../design-system/components";
import { MissionCard } from "./MissionCard";
import { useMissions } from "./useMissions";

export function MissionsPage() {
  const { items, loading } = useMissions(); const completed = items.filter((item) => item.status === "approved").length;
  return <section className="stack"><header className="stack page-heading"><p className="eyebrow">Tu reto personal</p><div className="row"><div className="grow"><h1>Misiones</h1><p className="muted">{completed} de {items.length || 11} completadas</p></div><strong className="score-pill">{items.filter((item) => item.status === "approved").reduce((sum, item) => sum + item.points, 0)} pts</strong></div><ProgressBar value={completed} max={items.length || 11} label="Misiones completadas" /></header>{loading ? <p role="status">Cargando misiones…</p> : items.length ? <div className="mission-list">{items.filter((item) => item.status !== "replaced").map((item) => <MissionCard key={item.id} item={item} />)}</div> : <EmptyState title="Aún no tienes misiones">Completa tu perfil para generar tu reto personalizado.</EmptyState>}</section>;
}
