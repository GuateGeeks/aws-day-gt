export function EventLogo({ className = "" }: { className?: string }) {
  return <img
    className={["event-mark", className].filter(Boolean).join(" ")}
    src="/brand/aws-cd-2026-blanco.png"
    alt="AWS Community Day Guatemala"
    width={1465}
    height={774}
    decoding="async"
  />;
}
