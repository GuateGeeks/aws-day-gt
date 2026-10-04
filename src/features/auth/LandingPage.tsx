import { ArrowRight, Camera, Cloud, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, Chip } from "../../design-system/components";

export function LandingPage() {
  return <main className="landing page">
    <header className="landing__nav"><span className="brand-mark"><span className="brand-cloud"><Cloud aria-hidden /></span>AWS Community Day Guatemala</span><Link to="/login">Ingresar</Link></header>
    <section className="hero stack">
      <Chip>10 de octubre · Guatemala</Chip>
      <h1>Aprende, conecta y completa el reto.</h1>
      <p>Convierte tu Community Day en una aventura de 11 misiones. Comparte ideas, descubre sesiones y suma hasta 100 puntos.</p>
      <div className="cluster"><Button variant="accent" onClick={() => { location.href = "/login"; }}>Participar <ArrowRight aria-hidden size={20} /></Button><span className="muted">Acceso por enlace seguro · sin contraseña</span></div>
    </section>
    <section className="feature-grid" aria-label="Cómo funciona">
      <Card><Camera aria-hidden /><h2>11 misiones</h2><p className="muted">Fotos, comentarios y palabras inspiradas por el evento.</p></Card>
      <Card><Trophy aria-hidden /><h2>100 puntos</h2><p className="muted">Sigue tu progreso y descubre tu posición en tiempo real.</p></Card>
      <Card><Cloud aria-hidden /><h2>Funciona offline</h2><p className="muted">Continúa explorando aunque la red del recinto se sature.</p></Card>
    </section>
  </main>;
}
