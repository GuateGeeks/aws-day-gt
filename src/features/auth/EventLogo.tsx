/** Event artwork supplied by the organizers. */
export function EventLogo({ className = "" }: { className?: string }) {
  return <div className={`event-logo ${className}`.trim()}>
    <img src="/brand/aws-community-day-guatemala.png" alt="AWS Community Day Guatemala" width={1536} height={1024} decoding="async" />
  </div>;
}
