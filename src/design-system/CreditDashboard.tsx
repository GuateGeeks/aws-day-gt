import { CreditAmount, formatCredits } from "./credits";
import { EventLogo } from "./EventLogo";

interface CreditDashboardProps {
  balance: number | null;
  balanceFallback?: string;
  deducted: number;
  available: number;
  inReview: number;
}

export function CreditDashboard({ balance, balanceFallback = "Cargando créditos…", deducted, available, inReview }: CreditDashboardProps) {
  const metrics = [
    { label: "Ganados", value: balance === null ? "—" : formatCredits(balance + deducted, true), className: "" },
    { label: "Descontados", value: formatCredits(-deducted), className: "credit-dashboard__metric--lost" },
    { label: "Por conseguir", value: formatCredits(available, true), className: "" },
    { label: "En revisión", value: formatCredits(inReview, true), className: "" }
  ];

  return <div className="credit-dashboard" aria-label="Resumen de créditos">
    <div className="credit-dashboard__balance">
      <EventLogo className="event-mark--credits" />
      <span className="credit-dashboard__eyebrow">Tu saldo de créditos</span>
      {balance === null ? <strong className="credit-dashboard__fallback">{balanceFallback}</strong> : <CreditAmount value={balance} />}
      <small>Se actualiza al completar o fallar un reto.</small>
    </div>
    <div className="credit-dashboard__metrics" aria-label="Detalle de tus créditos">
      {metrics.map(({ label, value, className }) => <div className={`credit-dashboard__metric ${className}`} key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
  </div>;
}
