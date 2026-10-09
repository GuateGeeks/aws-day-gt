import { Camera, Link2, Radio, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicVisualizationPhoto, PublicVisualizationSnapshot, PublicVisualizationTrack } from "../../../shared/public-visualization";

export function PhotoGallery({ photos }: { photos: PublicVisualizationPhoto[] }) {
  const [start, setStart] = useState(0);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const available = useMemo(() => photos.filter((photo) => !failed.has(photo.id)), [photos, failed]);

  useEffect(() => { setStart(0); setFailed(new Set()); }, [photos]);
  useEffect(() => {
    if (available.length <= 3) return;
    const interval = globalThis.setInterval(() => setStart((current) => (current + 3) % available.length), 9_000);
    return () => globalThis.clearInterval(interval);
  }, [available.length]);

  const visible = Array.from({ length: Math.min(3, available.length) }, (_, offset) => available[(start + offset) % available.length]!);
  return <section className="live-panel live-gallery" aria-labelledby="live-gallery-title">
    <header className="live-panel__heading"><span className="live-panel__icon"><Camera aria-hidden /></span><div><p>Momentos compartidos</p><h2 id="live-gallery-title">Galería en vivo</h2></div></header>
    {visible.length ? <div className="live-gallery__grid">
      {visible.map((photo, index) => <figure className={index === 0 ? "live-gallery__feature" : ""} key={photo.id}>
        <img src={photo.url} alt={`Foto compartida por ${photo.alias}`} width={photo.width ?? 1200} height={photo.height ?? 900} onError={() => setFailed((current) => new Set([...current, photo.id]))} />
        <figcaption>@{photo.alias}</figcaption>
      </figure>)}
    </div> : <div className="live-panel__empty"><Camera aria-hidden /><p>Las historias del evento aparecerán aquí.</p></div>}
  </section>;
}

export function TrackPulse({ tracks }: { tracks: PublicVisualizationTrack[] }) {
  return <section className="live-panel live-tracks" aria-labelledby="live-tracks-title">
    <header className="live-panel__heading"><span className="live-panel__icon live-panel__icon--orange"><Radio aria-hidden /></span><div><p>Lo que mueve a la comunidad</p><h2 id="live-tracks-title">Tracks elegidos</h2></div></header>
    {tracks.length ? <ol>
      {tracks.map((track) => <li key={track.id}>
        <div className="live-track__label"><strong>{track.label}</strong><span>{track.count} · {track.percentage}%</span></div>
        <span className="live-track__bar" aria-hidden><span style={{ transform: `scaleX(${track.percentage / 100})` }} /></span>
      </li>)}
    </ol> : <div className="live-panel__empty live-panel__empty--compact"><Radio aria-hidden /><p>Las preferencias aparecerán al completar Track Pulse.</p></div>}
  </section>;
}

export function EventInsight({ insights }: { insights: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [insights]);
  useEffect(() => {
    if (insights.length < 2) return;
    const interval = globalThis.setInterval(() => setIndex((current) => (current + 1) % insights.length), 10_000);
    return () => globalThis.clearInterval(interval);
  }, [insights.length]);
  if (!insights.length) return null;
  return <aside className="live-insight" aria-label="Insight de la comunidad"><Sparkles aria-hidden /><p>{insights[index]}</p></aside>;
}

export function LiveMetrics({ metrics }: { metrics: PublicVisualizationSnapshot["metrics"] }) {
  const values = [
    { label: "Personas conectadas", value: metrics.participants, icon: Users },
    { label: "Conexiones QR", value: metrics.connections, icon: Link2 },
    { label: "Fotos aprobadas", value: metrics.approvedPhotos, icon: Camera },
    { label: "Track líder", value: metrics.leadingTrack?.label ?? "—", icon: Radio }
  ];
  return <section className="live-metrics" aria-label="Pulso del evento">
    {values.map(({ label, value, icon: Icon }) => <div className="live-metric" key={label}><Icon aria-hidden /><span>{label}</span><strong>{typeof value === "number" ? value.toLocaleString("es-GT") : value}</strong></div>)}
  </section>;
}
