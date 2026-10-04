import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import type { Score } from "../../../shared/types";
import type { Mission, MissionAnswerKey } from "../../../shared/types";
import { DomainError } from "../../../shared/errors";
import { applyApprovedMission } from "../scoring/calculate";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";
import { resolveMissionSelection } from "./selection-result";

export const submitTextMission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const { missionId, operationId, selectionIds } = request.data ?? {};
  if (![missionId, operationId].every((value) => typeof value === "string") || !Array.isArray(selectionIds)) throw new HttpsError("invalid-argument", "INVALID_SUBMISSION");
  try { return await database.runTransaction(async (transaction) => {
    const operationRef = refs.operation(uid, operationId);
    const operation = await transaction.get(operationRef);
    if (operation.exists) return operation.data()?.result;
    const assignmentRef = refs.userMission(uid, missionId);
    const missionRef = refs.mission(missionId);
    const answerKeyRef = refs.missionAnswerKey(missionId);
    const scoreRef = refs.score(uid);
    const [assignment, mission, answerKey, score] = await Promise.all([transaction.get(assignmentRef), transaction.get(missionRef), transaction.get(answerKeyRef), transaction.get(scoreRef)]);
    if (!assignment.exists || assignment.data()?.status !== "available" || !mission.exists || !mission.data()?.active) throw new HttpsError("failed-precondition", "MISSION_UNAVAILABLE");
    // Firestore's type does not narrow data() from the preceding exists check.
    const missionData = mission.data() as Mission;
    if (missionData.evidenceType === "photo") throw new HttpsError("invalid-argument", "INVALID_EVIDENCE");
    let outcome;
    try { outcome = resolveMissionSelection(missionData, selectionIds, answerKey.exists ? answerKey.data() as MissionAnswerKey : undefined, assignment.data()?.attemptsUsed ?? 0); }
    catch (error) { if (error instanceof Error && error.message === "MISSING_ANSWER_KEY") throw new HttpsError("failed-precondition", "MISSING_ANSWER_KEY"); throw error; }
    const nowIso = new Date().toISOString();
    const now = FieldValue.serverTimestamp();
    const result = { status: outcome.status, attemptsUsed: outcome.attemptsUsed, attemptsRemaining: outcome.attemptsRemaining, scoreDelta: outcome.status === "approved" ? assignment.data()?.points : 0 };
    if (outcome.status !== "approved") {
      transaction.update(assignmentRef, { attemptsUsed: outcome.attemptsUsed, ...(outcome.status === "failed" ? { status: "failed", completedAt: now } : {}) });
      transaction.create(operationRef, { result, createdAt: now });
      return result;
    }
    const nextScore = applyApprovedMission(score.data() as Score, missionData.evidenceType, assignment.data()?.points, nowIso);
    transaction.create(refs.submission(uid, missionId), {
      operationId, eventId: EVENT_ID, userId: uid, missionId, evidenceType: missionData.evidenceType,
      selection: { ids: outcome.selectionIds, labels: outcome.labels }, status: "approved", provisionalPoints: assignment.data()?.points,
      finalPoints: assignment.data()?.points, publicationEligible: false, submittedAt: now, updatedAt: now
    });
    transaction.update(assignmentRef, { status: "approved", attemptsUsed: outcome.attemptsUsed, completedAt: now });
    transaction.set(scoreRef, { ...nextScore, updatedAt: now, finalScoreReachedAt: nextScore.finalScoreReachedAt ? now : null }, { merge: true });
    transaction.create(operationRef, { result, createdAt: now });
    return result;
  }); } catch (error) {
    if (error instanceof DomainError) throw new HttpsError("invalid-argument", error.code);
    throw error;
  }
});
