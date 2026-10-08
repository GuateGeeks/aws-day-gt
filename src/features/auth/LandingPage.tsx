import { ArrowRight, Bird, Camera, ExternalLink, BookOpenText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EVENT_SITE_URL, OFFICIAL_AGENDA_URL } from "../../../shared/agenda";
import { quetziFact } from "../../../shared/companion";
import { Card, Chip } from "../../design-system/components";
import { QuetziGuide } from "../companion/QuetziGuide";
import { isLocalRehearsalActive } from "../companion/useNow";
import { GeekBrandPanel, GeekEyesLogo } from "./GeekEyesLogo";
import "./landing.css";

const STATS = [["7", "salas en paralelo"], ["7", "áreas temáticas"], ["34", "voces de la comunidad"], ["10", "Challenges por persona"]] as const;

export function LandingPage() {
  const [taps, setTaps] = useState(0);
  const rehearsal = isLocalRehearsalActive();
  const line = taps === 0 ? rehearsal ? "¡Hola! Soy Geek, tu guía GuateGeeks. La agenda avanza contigo hoy durante el ensayo local del AWS Community Day Guatemala." : "¡Hola! Soy Geek, tu guía GuateGeeks. El 10 de octubre te acompaño por todo el AWS Community Day Guatemala." : quetziFact(taps - 1);
  return <main className="landing page">
    <header className="landing__nav"><span className="brand-mark"><span className="brand-eyes"><GeekEyesLogo /></span><span>AWS Community Day<small className="brand-sub">Guatemala · GuateGeeks</small></span></span><Link to="/login">Ingresar</Link></header>
    <section className="hero stack">
      <GeekBrandPanel />
      <Chip>{rehearsal ? "Ensayo local · 8 de octubre" : "Sábado 10 de octubre"} · Universidad Rafael Landívar, zona 16</Chip>
      <h1>Vive el evento. Gana créditos.</h1>
      <p>Explora AWS Community Day Guatemala con desafíos rápidos, experiencias y momentos para compartir. Cada logro suma monedas a tu recorrido.</p>
      <div className="cluster">
        <Link className="ds-button ds-button--accent" to="/login">Empezar mis Challenges <ArrowRight aria-hidden size={20} /></Link>
        <a className="landing__site" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">Agenda oficial <ExternalLink aria-hidden size={16} /></a>
        <a className="landing__site" href={EVENT_SITE_URL} target="_blank" rel="noreferrer">Sitio del evento <ExternalLink aria-hidden size={16} /></a>
      </div>
      <QuetziGuide completed={11} line={line} onTap={() => setTaps((count) => count + 1)} />
    </section>
    <div className="landing-event"><span className="eyebrow">La comunidad AWS se encuentra en Guatemala</span><span className="landing-event__partner">Experiencia creada por GuateGeeks</span></div>
    <ul className="landing-stats" aria-label="El evento en números">{STATS.map(([value, label]) => <li key={label}><strong>{value}</strong><span>{label}</span></li>)}</ul>
    <section className="feature-grid" aria-label="Cómo funciona">
      <Card><Camera aria-hidden /><h2>Comparte tu experiencia</h2><p className="muted">Publica un momento del evento, etiqueta a GuateGeeks y envía una captura para revisión.</p></Card>
      <Card><Bird aria-hidden /><h2>Conoce a la comunidad</h2><p className="muted">Comparte tu Geek ID y completa retos de conexión con otras personas.</p></Card>
      <Card><BookOpenText aria-hidden /><h2>Descubre Sócrates</h2><p className="muted">Conoce la aplicación de aprendizaje creada por GuateGeeks.</p><a href="https://guategeeks.com/socrates.app/#/" target="_blank" rel="noreferrer">Explorar Sócrates <ExternalLink aria-hidden size={16} /></a></Card>
    </section>
  </main>;
}
