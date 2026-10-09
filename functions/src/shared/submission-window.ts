import { HttpsError } from "firebase-functions/v2/https";
import { SUBMISSION_CUTOFF_AT, isSubmissionWindowOpen } from "../../../shared/submission-window";

export function assertSubmissionWindowOpen(now: number = Date.now()) {
  if (!isSubmissionWindowOpen(now)) throw new HttpsError("failed-precondition", "SUBMISSIONS_CLOSED");
}

export { SUBMISSION_CUTOFF_AT };
