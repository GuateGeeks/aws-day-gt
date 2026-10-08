export function formatCredits(value: number, signed = false): string {
  const prefix = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  const amount = Math.abs(value);
  return `${prefix}${amount} ${amount === 1 ? "crédito" : "créditos"}`;
}

export function CreditAmount({ value, signed = false, className = "" }: { value: number; signed?: boolean; className?: string }) {
  return <span className={["credit-amount", className].filter(Boolean).join(" ")}>
    <span className="credit-coin" aria-hidden="true">✦</span>
    <span>{formatCredits(value, signed)}</span>
  </span>;
}
