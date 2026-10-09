import type { ReactNode } from "react";
import { EventLogo } from "./EventLogo";

interface EventSectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function EventSectionHeader({ eyebrow, title, description, aside }: EventSectionHeaderProps) {
  return <header className={`section-hero${aside ? " section-hero--with-aside" : ""}`}>
    <div className="section-hero__brand"><EventLogo className="event-mark--section" /></div>
    <div className="section-hero__content">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </div>
    {aside ? <div className="section-hero__aside">{aside}</div> : null}
  </header>;
}
