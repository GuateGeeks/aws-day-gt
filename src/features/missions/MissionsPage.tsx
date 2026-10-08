import { EmptyState, ProgressBar } from "../../design-system/components";
import { MissionCard } from "./MissionCard";
import { useMissions } from "./useMissions";

export function MissionsPage() {
  const { items, loading } = useMissions(); const completed = items.filter((item) => item.status === "approved").length;
  return <section className="stack"><header className="stack page-heading"><p className="eyebrow">Historial separado</p><div className="row"><div className="grow"><h1>Misiones anteriores</h1><p className="muted">{completed} de {items.length} completadas</p></div><strong className="score-pill">{items.filter((item) => item.status === "approved").reduce((sum, item) => sum + item.points, 0)} pts históricos</strong></div><ProgressBar value={completed} max={items.length || 1} label="Misiones anteriores completadas" /></header>{loading ? <p role="status">Cargando misiones…</p> : items.length ? <div className="mission-list">{items.filter((item) => item.status !== "replaced").map((item) => <MissionCard key={item.id} item={item} />)}</div> : <EmptyState title="Sin misiones anteriores">Tus nuevos retos están en Desafíos.</EmptyState>}</section>;
}
