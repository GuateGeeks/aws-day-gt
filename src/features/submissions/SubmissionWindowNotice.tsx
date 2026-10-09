import { useEffect, useState } from "react";
import { isSubmissionWindowOpen, SUBMISSIONS_CLOSED_MESSAGE, SUBMISSIONS_OPEN_MESSAGE } from "../../../shared/submission-window";
import { StatusNotice } from "../../design-system/components";

export function useSubmissionWindowOpen() {
  const [open, setOpen] = useState(() => isSubmissionWindowOpen());
  useEffect(() => {
    const update = () => setOpen(isSubmissionWindowOpen());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  return open;
}

export function SubmissionWindowNotice({ compact = false }: { compact?: boolean }) {
  const open = useSubmissionWindowOpen();
  return <StatusNotice tone={open ? "info" : "error"}>
    <span className="submission-window-notice"><strong>{open ? "Cierre de entregas" : "Entregas cerradas"}</strong><span>{open ? SUBMISSIONS_OPEN_MESSAGE : SUBMISSIONS_CLOSED_MESSAGE}</span>{!compact && open && <span>Después de esa hora podrás seguir consultando tu progreso y los retos.</span>}</span>
  </StatusNotice>;
}
