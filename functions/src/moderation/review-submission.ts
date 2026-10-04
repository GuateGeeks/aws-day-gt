import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { Score } from "../../../shared/types";
import { applyApprovedMission } from "../scoring/calculate";
import { requireRole } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const reviewSubmission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const actorUid = requireRole(request, ["moderator", "admin"]);
  const { userId, missionId, decision, reasonCode, note } = request.data ?? {};
  if (typeof userId !== "string" || typeof missionId !== "string" || !["approved", "rejected"].includes(decision)) throw new HttpsError("invalid-argument", "INVALID_REVIEW");
  return database.runTransaction(async (transaction) => {
    const submissionRef = refs.submission(userId, missionId);
    const assignmentRef = refs.userMission(userId, missionId);
    const [submission, assignment] = await Promise.all([transaction.get(submissionRef), transaction.get(assignmentRef)]);
    if (!submission.exists || submission.data()?.status !== "pending") throw new HttpsError("failed-precondition", "ALREADY_REVIEWED");
    const now = FieldValue.serverTimestamp();
    transaction.update(submissionRef, { status: decision, finalPoints: decision === "approved" ? assignment.data()?.points : 0, moderation: { reviewedBy: actorUid, reviewedAt: now, reasonCode: reasonCode ?? null, note: note ?? null }, updatedAt: now });
    transaction.update(assignmentRef, { status: decision });
    if (decision === "approved") {
      const scoreRef = refs.score(userId);
      const score = await transaction.get(scoreRef);
      const next = applyApprovedMission(score.data() as Score, "photo", assignment.data()?.points, new Date().toISOString());
      transaction.set(scoreRef, { ...next, updatedAt: now, finalScoreReachedAt: next.finalScoreReachedAt ? now : null }, { merge: true });
    }
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: `SUBMISSION_${decision.toUpperCase()}`, targetType: "submission", targetId: submissionRef.id, reasonCode: reasonCode ?? null, timestamp: now });
    return { status: decision };
  });
});
