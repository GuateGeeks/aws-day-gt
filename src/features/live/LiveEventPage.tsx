import { Activity, Cloud, Radio } from "lucide-react";
import { CommunityCloud } from "./CommunityCloud";
import { EventInsight, LiveMetrics, PhotoGallery, TrackPulse } from "./LivePanels";
import { usePublicVisualization } from "./usePublicVisualization";
import "./live-event.css";

function LiveHeader({ generatedAt, stale }: { generatedAt?: string; stale: boolean }) {
  const time = generatedAt ? new Intl.DateTimeFormat("es-GT", { hour: "2-digit", minute: "2-digit" }).format(new Date(generatedAt)) : null;
  return <header className="live-header">
    <div className="live-brand"><span className="live-brand__mark"><Cloud aria-hidden /></span><div><p>AWS Community Day Guatemala</p><h1>Comunidad en vivo</h1></div></div>
    <div className={`live-signal${stale ? " live-signal--stale" : ""}`}><span aria-hidden /><div><strong>{stale ? "Reconectando" : "En vivo"}</strong>{time ? <small>Actualizado {time}</small> : null}</div></div>
  </header>;
}

export function LiveEventPage() {
  const { snapshot, loading, stale, error, newEdgeIds, retry } = usePublicVisualization();

  if (!snapshot) return <main className="live-event live-event--centered">
    <LiveHeader stale={false} />
    {loading ? <div className="live-loading" role="status" aria-live="polite"><Activity aria-hidden /><p>Cargando la experiencia en vivo…</p></div> : <div className="live-loading live-loading--error"><Radio aria-hidden /><p>{error ?? "No pudimos cargar la experiencia en vivo."}</p><button type="button" onClick={retry}>Intentar de nuevo</button></div>}
  </main>;

  return <main className="live-event">
    <LiveHeader generatedAt={snapshot.generatedAt} stale={stale} />
    {stale && error ? <p className="live-reconnect" role="status" aria-live="polite">{error}</p> : null}
    <div className="live-stage">
      <section className="live-network" aria-labelledby="live-network-title">
        <div className="live-network__heading"><div><p>Conexiones que nacen hoy</p><h2 id="live-network-title">Red de conexiones</h2></div><span><Activity aria-hidden /> Pulso QR</span></div>
        <CommunityCloud nodes={snapshot.nodes} edges={snapshot.edges} newEdgeIds={newEdgeIds} />
      </section>
      <div className="live-story">
        <PhotoGallery photos={snapshot.photos} />
        <div className="live-story__lower"><TrackPulse tracks={snapshot.tracks} /><EventInsight insights={snapshot.insights} /></div>
      </div>
    </div>
    <LiveMetrics metrics={snapshot.metrics} />
  </main>;
}
