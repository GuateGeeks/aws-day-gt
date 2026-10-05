import { ArrowRight, Bird, CalendarHeart, ExternalLink, Feather } from "lucide-react";
import { Link } from "react-router-dom";
import { EVENT_SITE_URL, OFFICIAL_AGENDA_URL } from "../../../shared/agenda";
import { quetziStage } from "../../../shared/companion";
import { Card, Chip } from "../../design-system/components";
import { QuetziGuide } from "../companion/QuetziGuide";
import { QuetziSprite } from "../companion/QuetziSprite";
import { EventLogo } from "./EventLogo";
import "./landing.css";

const STATS = [["7", "salas en paralelo"], ["6", "tracks"], ["34", "voces de la comunidad"], ["11", "misiones por persona"]] as const;
const EVOLUTION = [0, 2, 5, 9, 11];

export function LandingPage() {
  return <main className="landing page">
    <header className="landing__nav"><span className="brand-mark"><span className="brand-cloud"><QuetziSprite completed={11} crop="head" label="" /></span>AWS Community Day Guatemala</span><Link to="/login">Ingresar</Link></header>
    <section className="hero stack">
      <EventLogo />
      <Chip>Sábado 10 de octubre · URL, zona 16</Chip>
      <h1>Tu compañero para el Community Day.</h1>
      <QuetziGuide completed={11} summary="¡Hola! Soy Quetzi." detail="El 10 de octubre te acompaño con información del momento y retos relacionados con tus sesiones." />
      <p>Elige tus charlas en la agenda oficial; Quetzi te acompaña con retos en cada sesión. Cada misión aprobada le da una pluma nueva.</p>
      <div className="cluster">
        <Link className="ds-button ds-button--accent" to="/login">Despertar a Quetzi <ArrowRight aria-hidden size={20} /></Link>
        <a className="landing__site" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">Agenda oficial <ExternalLink aria-hidden size={16} /></a>
        <a className="landing__site" href={EVENT_SITE_URL} target="_blank" rel="noreferrer">Sitio del evento <ExternalLink aria-hidden size={16} /></a>
      </div>
    </section>
    <ul className="landing-stats" aria-label="El evento en números">{STATS.map(([value, label]) => <li key={label}><strong>{value}</strong><span>{label}</span></li>)}</ul>
    <section className="feature-grid" aria-label="Cómo funciona">
      <Card><CalendarHeart aria-hidden /><h2>Retos en cada charla</h2><p className="muted">Tú eliges las sesiones en la agenda oficial. Quetzi te propone un reto ligado a la charla en la que estás.</p></Card>
      <Card><Bird aria-hidden /><h2>Sigue a Quetzi</h2><p className="muted">Te muestra qué está pasando ahora y te lleva directo al reto relacionado cuando tienes uno.</p></Card>
      <Card><Feather aria-hidden /><h2>Hazlo crecer</h2><p className="muted">Fotos y retos ligados a las sesiones. Hasta 100 puntos y un lugar en el ranking.</p></Card>
    </section>
    <section className="evolution stack" aria-labelledby="evolution-title">
      <h2 id="evolution-title">De huevo a quetzal resplandeciente</h2>
      <ol className="evolution__steps">{EVOLUTION.map((completed) => <li key={completed}><QuetziSprite completed={completed} label="" /><span>{quetziStage(completed).name}</span></li>)}</ol>
    </section>
  </main>;
}
