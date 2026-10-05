/** Official AWS Community Day Guatemala 2026 logo (white-text variant), always on a dark panel. */
export function EventLogo({ className = "" }: { className?: string }) {
  return <div className={`event-logo ${className}`.trim()}>
    <img src="/brand/aws-cd-2026-blanco.png" alt="AWS Community Day Guatemala 2026" width={1465} height={774} decoding="async" />
  </div>;
}
