export function GuateGeeksLogo({ className = "" }: { className?: string }) {
  return <img className={className} src="/brand/guategeeks.png" alt="GuateGeeks" width={800} height={800} decoding="async" />;
}

export function GeekBrandPanel({ compact = false }: { compact?: boolean }) {
  return <div className={`geek-brand-panel${compact ? " geek-brand-panel--compact" : ""}`}>
    <span className="geek-brand-panel__event-wrap"><img className="geek-brand-panel__event" src="/brand/aws-cd-2026-blanco.png" alt="AWS Community Day Guatemala" width={1465} height={774} decoding="async" /></span>
    <span className="geek-brand-panel__partner"><img src="/brand/guategeeks.png" alt="GuateGeeks" width={800} height={800} decoding="async" /><small>Una experiencia de GuateGeeks</small></span>
  </div>;
}
