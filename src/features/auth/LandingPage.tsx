import { ArrowRight, Bot, Camera, ExternalLink, BookOpenText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { quetziFact } from "../../../shared/companion";
import { Card, Chip } from "../../design-system/components";
import { QuetziGuide } from "../companion/QuetziGuide";
import { isLocalRehearsalActive } from "../companion/useNow";
import { GeekBrandPanel, GuateGeeksLogo } from "./GeekEyesLogo";
import "./landing.css";

export function LandingPage() {
  const [taps, setTaps] = useState(0);
  const rehearsal = isLocalRehearsalActive();
  const line = taps === 0 ? rehearsal ? "¡Hola! Soy Geek, tu guía GuateGeeks. La agenda avanza contigo hoy durante la simulación del AWS Community Day Guatemala." : "¡Hola! Soy Geek, tu guía GuateGeeks. El 10 de octubre te acompaño por todo el AWS Community Day Guatemala." : quetziFact(taps - 1);
  return <main className="landing page">
    <header className="landing__nav"><span className="brand-mark"><GuateGeeksLogo className="brand-logo" /><span className="brand-copy"><span className="brand-title__full">AWS Community Day</span><span className="brand-title__short">AWS Day</span><small className="brand-sub">Guatemala · GuateGeeks</small></span></span><Link to="/login">Ingresar</Link></header>
    <section className="hero stack">
      <GeekBrandPanel />
      <Chip>Sábado 10 de octubre{rehearsal ? " · simulación de hoy" : ""} · Universidad Rafael Landívar, zona 16</Chip>
      <h1>Vive el evento. Gana créditos.</h1>
      <p>Explora AWS Community Day Guatemala con desafíos rápidos, experiencias y momentos para compartir. Cada logro suma monedas a tu recorrido.</p>
      <div className="cluster">
        <Link className="ds-button ds-button--accent" to="/login">Empezar mis Challenges <ArrowRight aria-hidden size={20} /></Link>
      </div>
      <QuetziGuide completed={11} line={line} onTap={() => setTaps((count) => count + 1)} />
    </section>
    <section className="feature-grid" aria-label="Cómo funciona">
      <Card><Camera aria-hidden /><h2>Comparte tu experiencia</h2><p className="muted">Publica un momento del evento, etiqueta a GuateGeeks y envía una captura para revisión.</p></Card>
      <Card><Bot aria-hidden /><h2>Conoce a la comunidad</h2><p className="muted">Comparte tu Geek ID y completa retos de conexión con otras personas.</p></Card>
      <Card><BookOpenText aria-hidden /><h2>Descubre Sócrates</h2><p className="muted">Conoce la aplicación de aprendizaje creada por GuateGeeks.</p><a href="https://guategeeks.com/socrates.app/#/" target="_blank" rel="noreferrer">Explorar Sócrates <ExternalLink aria-hidden size={16} /></a></Card>
    </section>
  </main>;
}
