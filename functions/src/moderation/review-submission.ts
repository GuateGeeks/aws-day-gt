import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { isPhotoChallengeId } from "../../../shared/challenges/photo";
import { requireOwnerAdmin } from "../shared/auth";
import { database, refs } from "../shared/refs";

export async function reviewSubmissionForStaff(actorUid: string, input: { userId: string; missionId: string; decision: "approved" | "rejected"; reasonCode?: string; note?: string }) {
  const { userId, missionId, decision, reasonCode, note } = input;
  if (typeof userId !== "string" || typeof missionId !== "string" || !["approved", "rejected"].includes(decision)) throw new HttpsError("invalid-argument", "INVALID_REVIEW");
  if (!isPhotoChallengeId(missionId)) throw new HttpsError("failed-precondition", "CHALLENGE_REQUIRED");
  return database.runTransaction(async (transaction) => {
    const submissionRef = refs.submission(userId, missionId);
    const assignmentRef = refs.challengeProgress(userId, missionId);
    const scoreRef = refs.score(userId);
    const [submission, assignment, score] = await Promise.all([transaction.get(submissionRef), transaction.get(assignmentRef), transaction.get(scoreRef)]);
    if (!submission.exists || submission.data()?.status !== "pending") throw new HttpsError("failed-precondition", "ALREADY_REVIEWED");
    if (!assignment.exists || !score.exists) throw new HttpsError("failed-precondition", "ASSIGNMENT_MISSING");
    if (submission.data()?.kind !== "challenge") throw new HttpsError("failed-precondition", "CHALLENGE_REQUIRED");
    if (submission.data()?.eventId !== score.data()?.eventId || assignment.data()?.eventId !== score.data()?.eventId) throw new HttpsError("failed-precondition", "EVENT_MISMATCH");
    const auraReward = Number(submission.data()?.provisionalPoints);
    if (!Number.isInteger(auraReward) || auraReward < 1 || auraReward > 500) throw new HttpsError("failed-precondition", "INVALID_AURA_REWARD");
    const now = FieldValue.serverTimestamp();
    transaction.update(submissionRef, { status: decision, moderationStatus: decision, finalPoints: decision === "approved" ? auraReward : 0, moderation: { reviewedBy: actorUid, reviewedAt: now, reasonCode: reasonCode ?? null, note: note ?? null }, updatedAt: now });
    transaction.update(assignmentRef, { status: decision === "approved" ? "completed" : "rejected", auraAwarded: decision === "approved" ? auraReward : 0, completedAt: decision === "approved" ? now : null, updatedAt: now });
    if (decision === "approved") {
      transaction.set(scoreRef, { auraTotal: (Number(score.data()?.auraTotal) || 0) + auraReward, completedChallenges: (Number(score.data()?.completedChallenges) || 0) + 1, auraReachedAt: now, updatedAt: now }, { merge: true });
    }
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: `SUBMISSION_${decision.toUpperCase()}`, targetType: "submission", targetId: submissionRef.id, reasonCode: reasonCode ?? null, timestamp: now });
    return { status: decision };
  });
}

export const reviewSubmission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return reviewSubmissionForStaff(requireOwnerAdmin(request), request.data);
});
