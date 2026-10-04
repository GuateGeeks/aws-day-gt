import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { Submission } from "../../../shared/types";
import { Button, Card, StatusNotice } from "../../design-system/components";
import { PrivateEvidenceImage } from "./PrivateEvidenceImage";

type ModerationCardProps = {
  submission: Submission;
  onReview: (submission: Submission, decision: "approved" | "rejected") => Promise<void>;
};

export function ModerationCard({ submission, onReview }: ModerationCardProps) {
  const [imageReady, setImageReady] = useState(false);
  const [reviewing, setReviewing] = useState<"approved" | "rejected" | null>(null);
  const [reviewError, setReviewError] = useState(false);
  const handleReadyChange = useCallback((ready: boolean) => setImageReady(ready), []);

  async function review(decision: "approved" | "rejected") {
    setReviewing(decision);
    setReviewError(false);
    try {
      await onReview(submission, decision);
    } catch {
      setReviewError(true);
    } finally {
      setReviewing(null);
    }
  }

  const reviewDisabled = !imageReady || reviewing !== null;

  return <Card className="stack">
    <div className="row"><strong className="grow">Misión {submission.missionId}</strong><span>{submission.provisionalPoints} pts</span></div>
    <p className="muted">Participante: {submission.userId.slice(0, 8)}…</p>
    <PrivateEvidenceImage storagePath={submission.image?.storagePath} missionId={submission.missionId} onReadyChange={handleReadyChange} />
    {reviewError && <StatusNotice tone="error">No pudimos guardar la revisión. Intenta de nuevo.</StatusNotice>}
    <div className="cluster">
      <Button variant="primary" disabled={reviewDisabled} loading={reviewing === "approved"} onClick={() => void review("approved")}><Check aria-hidden /> Aprobar</Button>
      <Button variant="danger" disabled={reviewDisabled} loading={reviewing === "rejected"} onClick={() => void review("rejected")}><X aria-hidden /> Rechazar</Button>
    </div>
  </Card>;
}
