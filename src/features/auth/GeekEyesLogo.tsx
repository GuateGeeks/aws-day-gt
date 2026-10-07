export function GeekEyesLogo({ className = "" }: { className?: string }) {
  return <img className={className} src="/brand/geek-eyes.png" alt="" width={512} height={282} decoding="async" />;
}

export function GeekBrandPanel({ compact = false }: { compact?: boolean }) {
  return <div className={`geek-brand-panel${compact ? " geek-brand-panel--compact" : ""}`}>
    <span className="geek-brand-panel__eyes"><GeekEyesLogo /></span>
    <span className="geek-brand-panel__text"><span>Guate</span><strong>Geeks</strong><small>Aura · AWS Day GT</small></span>
  </div>;
}
