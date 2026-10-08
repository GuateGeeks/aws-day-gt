import { BookOpenText, ExternalLink, Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Card } from "../../design-system/components";
import "./community-links.css";

const socialLinks = [
  { name: "Facebook", href: "https://www.facebook.com/GuateGeeksGT/", icon: Facebook },
  { name: "Instagram", href: "https://www.instagram.com/guategeeks/", icon: Instagram },
  { name: "LinkedIn", href: "https://gt.linkedin.com/company/guategeeks", icon: Linkedin }
] as const;

export function CommunityLinks() {
  return <div className="community-links" id="guategeeks">
    <Card className="community-product"><div className="community-product__icon"><BookOpenText aria-hidden size={25} /></div><div className="community-product__copy"><span className="eyebrow">Creado por GuateGeeks</span><h2>Conoce Sócrates</h2><p>Explora nuestra aplicación de aprendizaje y descubre qué más estamos creando.</p><a href="https://guategeeks.com/socrates.app/#/" target="_blank" rel="noreferrer">Conocer Sócrates <ExternalLink aria-hidden size={16} /></a></div></Card>
    <Card className="community-social"><h2>Sigue a GuateGeeks</h2><p className="muted">Ideas, proyectos y próximos encuentros de la comunidad.</p><div className="community-social__links">{socialLinks.map(({ name, href, icon: Icon }) => <a key={name} href={href} target="_blank" rel="noreferrer"><Icon aria-hidden size={18} />{name}</a>)}</div></Card>
    <div className="community-contact"><span>¿Quieres una experiencia como esta para tu comunidad o evento?</span><a href="mailto:info@guategeeks.com"><Mail aria-hidden size={17} /> Hablemos</a></div>
  </div>;
}
