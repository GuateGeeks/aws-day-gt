import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useChallenges } from "../challenges/useChallenges";
import { CreditAmount } from "../../design-system/credits";
import { QuetziSprite } from "./QuetziSprite";
import "./companion.css";

const SEEN_KEY = "aura.challenges-seen";
const VISIBLE_MS = 6000;

function readSeen(uid: string): number | null {
  try { const value = localStorage.getItem(`${SEEN_KEY}.${uid}`); return value === null ? null : Number(value); } catch { return null; }
}
function writeSeen(uid: string, count: number) {
  try { localStorage.setItem(`${SEEN_KEY}.${uid}`, String(count)); } catch { /* blocked storage: celebrate again next time */ }
}

/** Shows newly awarded credits after a challenge completes. */
export function FeatherCelebration() {
  const { user } = useAuth(); const { items, loading } = useChallenges();
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const awarded = items.reduce((sum, item) => sum + (item.progress.auraAwarded ?? 0), 0);

  useEffect(() => {
    if (!user || loading) return;
    const seen = readSeen(user.uid);
    if (seen !== null && awarded > seen) setCelebrating(awarded - seen);
    if (seen === null || awarded !== seen) writeSeen(user.uid, awarded);
  }, [user, loading, awarded]);

  useEffect(() => {
    if (celebrating === null) return;
    const timer = window.setTimeout(() => setCelebrating(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  if (celebrating === null) return null;
  return <div className="feather-toast" role="status">
    <QuetziSprite completed={Math.min(10, items.filter((item) => item.progress.status === "completed").length)} mood="celebrate" crop="head" label="Geek celebrando" />
    <p className="grow"><strong>¡DESAFÍO COMPLETADO!</strong><br /><CreditAmount value={celebrating} signed /></p>
    <button type="button" onClick={() => setCelebrating(null)} aria-label="Cerrar celebración">✕</button>
  </div>;
}
