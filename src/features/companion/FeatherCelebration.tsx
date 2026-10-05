import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useMissions } from "../missions/useMissions";
import { QuetziSprite } from "./QuetziSprite";
import "./companion.css";

const SEEN_KEY = "quetzi.feathers-seen";
const VISIBLE_MS = 6000;

function readSeen(uid: string): number | null {
  try { const value = localStorage.getItem(`${SEEN_KEY}.${uid}`); return value === null ? null : Number(value); } catch { return null; }
}
function writeSeen(uid: string, count: number) {
  try { localStorage.setItem(`${SEEN_KEY}.${uid}`, String(count)); } catch { /* blocked storage: celebrate again next time */ }
}

/** Shows a toast with a celebrating Quetzi whenever a mission is newly approved. */
export function FeatherCelebration() {
  const { user } = useAuth(); const { items, loading } = useMissions();
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const approved = items.filter((item) => item.status === "approved").length;

  useEffect(() => {
    if (!user || loading) return;
    const seen = readSeen(user.uid);
    if (seen !== null && approved > seen) setCelebrating(approved);
    if (seen === null || approved !== seen) writeSeen(user.uid, approved);
  }, [user, loading, approved]);

  useEffect(() => {
    if (celebrating === null) return;
    const timer = window.setTimeout(() => setCelebrating(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  if (celebrating === null) return null;
  return <div className="feather-toast" role="status">
    <QuetziSprite completed={celebrating} mood="celebrate" crop="head" label="Quetzi celebrando" />
    <p className="grow"><strong>¡Nueva pluma para Quetzi!</strong><br /><span className="muted">Misión aprobada · {celebrating} de 11</span></p>
    <button type="button" onClick={() => setCelebrating(null)} aria-label="Cerrar celebración">✕</button>
  </div>;
}
