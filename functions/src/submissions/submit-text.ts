import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import type { Score } from "../../../shared/types";
import { validateEvidence } from "../../../shared/validation";
import { applyApprovedMission } from "../scoring/calculate";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const submitTextMission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const { missionId, operationId, text } = request.data ?? {};
  if (![missionId, operationId, text].every((value) => typeof value === "string")) throw new HttpsError("invalid-argument", "INVALID_SUBMISSION");
  return database.runTransaction(async (transaction) => {
    const operationRef = refs.operation(uid, operationId);
    const operation = await transaction.get(operationRef);
    if (operation.exists) return operation.data()?.result;
    const assignmentRef = refs.userMission(uid, missionId);
    const missionRef = refs.mission(missionId);
    const scoreRef = refs.score(uid);
    const [assignment, mission, score] = await Promise.all([transaction.get(assignmentRef), transaction.get(missionRef), transaction.get(scoreRef)]);
    if (!assignment.exists || assignment.data()?.status !== "available" || !mission.exists || !mission.data()?.active) throw new HttpsError("failed-precondition", "MISSION_UNAVAILABLE");
    // Firestore's type does not narrow data() from the preceding exists check.
    const missionData = mission.data()!;
    if (missionData.evidenceType === "photo") throw new HttpsError("invalid-argument", "INVALID_EVIDENCE");
    const normalized = validateEvidence(missionData.validation, text);
    const nowIso = new Date().toISOString();
    const nextScore = applyApprovedMission(score.data() as Score, missionData.evidenceType, assignment.data()?.points, nowIso);
    const now = FieldValue.serverTimestamp();
    transaction.create(refs.submission(uid, missionId), {
      operationId, eventId: EVENT_ID, userId: uid, missionId, evidenceType: missionData.evidenceType,
      text: normalized, status: "approved", provisionalPoints: assignment.data()?.points,
      finalPoints: assignment.data()?.points, publicationEligible: false, submittedAt: now, updatedAt: now
    });
    transaction.update(assignmentRef, { status: "approved", completedAt: now });
    transaction.set(scoreRef, { ...nextScore, updatedAt: now, finalScoreReachedAt: nextScore.finalScoreReachedAt ? now : null }, { merge: true });
    const result = { status: "approved", scoreDelta: assignment.data()?.points };
    transaction.create(operationRef, { result, createdAt: now });
    return result;
  });
});
