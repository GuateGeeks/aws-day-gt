export function GeekEyesLogo({ className = "" }: { className?: string }) {
  return <img className={className} src="/brand/geek-eyes.png" alt="" width={512} height={282} decoding="async" />;
}

export function GeekBrandPanel({ compact = false }: { compact?: boolean }) {
  return <div className={`geek-brand-panel${compact ? " geek-brand-panel--compact" : ""}`}>
    <img className="geek-brand-panel__event" src="/brand/aws-community-day-guatemala.png" alt="AWS Community Day Guatemala" width={1536} height={1024} decoding="async" />
    <span className="geek-brand-panel__partner"><img src="/brand/guategeeks.png" alt="GuateGeeks" width={800} height={800} decoding="async" /><small>Una experiencia de GuateGeeks</small></span>
  </div>;
}
