import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { SUBMISSION_CUTOFF_AT, submissionNoticeState } from "../../../shared/submission-window";

export function useSubmissionWindowOpen() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  return now < SUBMISSION_CUTOFF_AT;
}

export function SubmissionWindowNotice() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  const state = submissionNoticeState(now);
  if (state === "hidden") return null;

  const remainingMinutes = Math.max(1, Math.ceil((SUBMISSION_CUTOFF_AT - now) / 60_000));
  const closed = state === "closed";
  return <aside className={`submission-alert submission-alert--${state}`} role="status" aria-live="polite">
    <span className="submission-alert__icon"><Clock3 aria-hidden size={19} /></span>
    <span className="submission-alert__copy">
      <strong>{closed ? "Entregas cerradas" : `Últimos ${remainingMinutes} min para participar`}</strong>
      <span>{closed ? "El envío de respuestas, fotos y selfies cerró a las 4:00 p. m. Puedes seguir consultando tus retos y progreso." : "Envía tus respuestas, fotos y selfies antes de las 4:00 p. m."}</span>
    </span>
  </aside>;
}
