import { ArrowRight, Bird, CalendarHeart, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EVENT_SITE_URL, OFFICIAL_AGENDA_URL } from "../../../shared/agenda";
import { quetziFact } from "../../../shared/companion";
import { Card, Chip } from "../../design-system/components";
import { QuetziGuide } from "../companion/QuetziGuide";
import { GeekBrandPanel, GeekEyesLogo } from "./GeekEyesLogo";
import { EventLogo } from "./EventLogo";
import "./landing.css";

const STATS = [["7", "salas en paralelo"], ["7", "áreas temáticas"], ["34", "voces de la comunidad"], ["10", "Challenges por persona"]] as const;

export function LandingPage() {
  const [taps, setTaps] = useState(0);
  const line = taps === 0 ? "¡Hola! Soy Geek, tu guía GuateGeeks. El 10 de octubre te acompaño por todo el AWS Community Day Guatemala." : quetziFact(taps - 1);
  return <main className="landing page">
    <header className="landing__nav"><span className="brand-mark"><span className="brand-eyes"><GeekEyesLogo /></span>GuateGeeks Aura</span><Link to="/login">Ingresar</Link></header>
    <section className="hero stack">
      <GeekBrandPanel />
      <Chip>Sábado 10 de octubre · Universidad Rafael Landívar, zona 16</Chip>
      <h1>Conecta, explora y gana Aura.</h1>
      <p>Vive diez Aura Challenges: conecta con la comunidad, aprende AWS y explora las experiencias de GuateGeeks.</p>
      <div className="cluster">
        <Link className="ds-button ds-button--accent" to="/login">Empezar mis Challenges <ArrowRight aria-hidden size={20} /></Link>
        <a className="landing__site" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">Agenda oficial <ExternalLink aria-hidden size={16} /></a>
        <a className="landing__site" href={EVENT_SITE_URL} target="_blank" rel="noreferrer">Sitio del evento <ExternalLink aria-hidden size={16} /></a>
      </div>
      <QuetziGuide completed={11} line={line} onTap={() => setTaps((count) => count + 1)} />
    </section>
    <div className="landing-event"><span className="eyebrow">En AWS Community Day Guatemala</span><EventLogo className="event-logo--mini" /></div>
    <ul className="landing-stats" aria-label="El evento en números">{STATS.map(([value, label]) => <li key={label}><strong>{value}</strong><span>{label}</span></li>)}</ul>
    <section className="feature-grid" aria-label="Cómo funciona">
      <Card><CalendarHeart aria-hidden /><h2>Participa en las sesiones</h2><p className="muted">Descubre los códigos de talleres y charlas para ganar Aura.</p></Card>
      <Card><Bird aria-hidden /><h2>Conoce a la comunidad</h2><p className="muted">Comparte tu Geek ID y completa retos de conexión con otras personas.</p></Card>
      <Card><Sparkles aria-hidden /><h2>Vive la experiencia VR de GuateGeeks</h2><p className="muted">Visita el stand y recibe Aura después de completar la experiencia y confirmar tu código.</p></Card>
    </section>
  </main>;
}
