import { CalendarDays, Clock3, ExternalLink, Feather } from "lucide-react";
import { OFFICIAL_AGENDA_URL, sessionDate } from "../../../shared/agenda";
import { countdownTo, quetziStage } from "../../../shared/companion";
import { Card, ProgressBar } from "../../design-system/components";
import { QuetziSprite } from "./QuetziSprite";

const TOTAL_FEATHERS = 11;

/** Sessions, rooms and schedule changes live on the official site; the app always links there. */
export function OfficialAgendaLink({ children = "Ver agenda oficial" }: { children?: string }) {
  return <a className="companion-cta" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
    <CalendarDays aria-hidden size={18} />{children}<ExternalLink aria-hidden size={16} />
  </a>;
}

export function CountdownCard({ now }: { now: Date }) {
  const { days, hours, minutes } = countdownTo(now, sessionDate("07:30"));
  return <Card className="stack companion-card">
    <h2><Clock3 aria-hidden size={20} /> Cuenta regresiva</h2>
    <div className="countdown" aria-label={`${days} días, ${hours} horas y ${minutes} minutos para el registro`}>
      {[[days, "días"], [hours, "horas"], [minutes, "min"]].map(([value, unit]) => <div key={unit}><strong>{value}</strong><span>{unit}</span></div>)}
    </div>
    <p className="muted">Sábado 10 de octubre · registro desde las 7:30 · Universidad Rafael Landívar, zona 16.</p>
    <OfficialAgendaLink>Elige tus charlas en la agenda oficial</OfficialAgendaLink>
  </Card>;
}

export function FeatherCard({ completed }: { completed: number }) {
  const stage = quetziStage(completed);
  const feathers = Math.min(completed, TOTAL_FEATHERS);
  return <Card className="feather-card">
    <QuetziSprite completed={completed} className="feather-card__bird" label={`Quetzi en etapa ${stage.name}`} />
    <div className="grow stack">
      <p className="eyebrow"><Feather aria-hidden size={14} /> {stage.name}</p>
      <strong>{feathers} de {TOTAL_FEATHERS} plumas</strong>
      <ProgressBar value={feathers} max={TOTAL_FEATHERS} label="Plumas de Quetzi" />
      <p className="muted">{stage.description}{stage.nextAt ? ` Siguiente etapa con ${stage.nextAt} misiones.` : ""}</p>
    </div>
  </Card>;
}
