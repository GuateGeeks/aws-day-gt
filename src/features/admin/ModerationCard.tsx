import { Check, X } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import type { Submission } from "../../../shared/types";
import { Button, Card, StatusNotice, Textarea } from "../../design-system/components";
import { CreditAmount } from "../../design-system/credits";
import { PrivateEvidenceImage } from "./PrivateEvidenceImage";

type ModerationCardProps = {
  submission: Submission;
  onReview: (submission: Submission, decision: "approved" | "rejected", note?: string) => Promise<void>;
};

export function ModerationCard({ submission, onReview }: ModerationCardProps) {
  const [imageReady, setImageReady] = useState(false);
  const [reviewing, setReviewing] = useState<"approved" | "rejected" | null>(null);
  const [reviewError, setReviewError] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const handleReadyChange = useCallback((ready: boolean) => setImageReady(ready), []);

  async function review(decision: "approved" | "rejected", note?: string) {
    setReviewing(decision);
    setReviewError(false);
    try {
      await onReview(submission, decision, note);
      setRejecting(false);
      setReason("");
    } catch {
      setReviewError(true);
    } finally {
      setReviewing(null);
    }
  }

  function submitRejection(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length >= 3) void review("rejected", reason.trim());
  }

  const reviewDisabled = !imageReady || reviewing !== null;
  const challengeLabel: Record<string, string> = { C15: "Comparte la experiencia GuateGeeks", C16: "Selfie con speaker", C17: "Selfie en un stand" };
  const reviewHint: Record<string, string> = { C15: "Confirma que la captura muestre el stand de GuateGeeks y la experiencia que ofrece, además de la etiqueta a GuateGeeks, antes de aprobar.", C16: "Confirma que aparezcan el participante y un speaker del evento.", C17: "Confirma que aparezcan el participante y un stand del evento." };

  return <Card className="stack">
    <div className="row"><strong className="grow">{challengeLabel[submission.missionId] ?? submission.missionId}</strong><CreditAmount value={submission.provisionalPoints} signed /></div>
    <p className="muted">Participante: {submission.userId.slice(0, 8)}…</p>
    {reviewHint[submission.missionId] && <p className="muted">{reviewHint[submission.missionId]}</p>}
    <PrivateEvidenceImage storagePath={submission.image?.storagePath} missionId={submission.missionId} onReadyChange={handleReadyChange} />
    {reviewError && !rejecting && <StatusNotice tone="error">No pudimos guardar la revisión. Intenta de nuevo.</StatusNotice>}
    <div className="cluster">
      <Button variant="primary" disabled={reviewDisabled} loading={reviewing === "approved"} onClick={() => void review("approved")}><Check aria-hidden /> Aprobar</Button>
      <Button variant="danger" disabled={reviewDisabled} loading={reviewing === "rejected"} onClick={() => setRejecting(true)}><X aria-hidden /> Rechazar</Button>
    </div>
    {rejecting && <div className="admin-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !reviewing) setRejecting(false); }}>
      <form className="admin-dialog stack" role="dialog" aria-modal="true" aria-labelledby="rejection-dialog-title" onSubmit={submitRejection}>
        <div><p className="eyebrow">Revisión de evidencia</p><h2 id="rejection-dialog-title">Indica el motivo del rechazo</h2></div>
        <p className="muted">La persona verá esta explicación para poder corregir su evidencia.</p>
        <label className="stack"><strong>Motivo</strong><Textarea autoFocus required minLength={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ejemplo: no se distingue el stand en la fotografía." /></label>
        {reviewError && <StatusNotice tone="error">No pudimos guardar la revisión. Intenta de nuevo.</StatusNotice>}
        <div className="admin-dialog__actions"><Button type="button" variant="secondary" disabled={reviewing !== null} onClick={() => setRejecting(false)}>Cancelar</Button><Button type="submit" variant="danger" loading={reviewing === "rejected"} disabled={reason.trim().length < 3}>Confirmar rechazo</Button></div>
      </form>
    </div>}
  </Card>;
}
