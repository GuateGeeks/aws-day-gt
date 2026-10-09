import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { isBonusPhotoChallengeId, isPhotoChallengeId } from "../../../shared/challenges/photo";
import { requireUid } from "../shared/auth";
import { adminApp } from "../shared/admin";
import { photoModeration } from "../challenges/photo-moderation";
import { database, refs } from "../shared/refs";
import { assertSubmissionWindowOpen } from "../shared/submission-window";

export function evidenceBucket() { return getStorage(adminApp).bucket(); }

export async function registerPhotoForUid(uid: string, input: { missionId: string; operationId: string; storagePath: string }) {
  const { missionId, operationId, storagePath } = input ?? {};
  if (![missionId, operationId, storagePath].every((value) => typeof value === "string")) throw new HttpsError("invalid-argument", "INVALID_SUBMISSION");
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(operationId)) throw new HttpsError("invalid-argument", "INVALID_SUBMISSION");
  if (!isPhotoChallengeId(missionId)) throw new HttpsError("failed-precondition", "CHALLENGE_REQUIRED");
  const priorOperation = await refs.operation(uid, operationId).get();
  if (priorOperation.exists) return priorOperation.data()?.result;
  assertSubmissionWindowOpen();
  const expectedPrefix = `evidence/${EVENT_ID}/${uid}/${missionId}/`;
  if (!storagePath.startsWith(expectedPrefix)) throw new HttpsError("permission-denied", "INVALID_STORAGE_PATH");
  const bucket = evidenceBucket();
  const [metadata] = await bucket.file(storagePath).getMetadata();
  if (!metadata.contentType?.startsWith("image/") || Number(metadata.size ?? 0) > 1_572_864) throw new HttpsError("invalid-argument", "INVALID_PHOTO");
  const [header] = await bucket.file(storagePath).download({ start: 0, end: 11 });
  const validSignature = (metadata.contentType === "image/webp" && header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP")
    || (metadata.contentType === "image/png" && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    || (metadata.contentType === "image/jpeg" && header[0] === 255 && header[1] === 216 && header[2] === 255);
  if (!validSignature) throw new HttpsError("invalid-argument", "INVALID_PHOTO_SIGNATURE");
  const moderation = await photoModeration.inspect({ storagePath, contentType: metadata.contentType, bytes: Number(metadata.size ?? 0) });
  return database.runTransaction(async (transaction) => {
    const operationRef = refs.operation(uid, operationId);
    const operation = await transaction.get(operationRef);
    if (operation.exists) return operation.data()?.result;
    assertSubmissionWindowOpen();
    const assignmentRef = refs.challengeProgress(uid, missionId);
    const [assignment, pack, challenge, profile] = await Promise.all([transaction.get(assignmentRef), transaction.get(refs.challengeAssignment(uid)), transaction.get(refs.challenge(missionId)), transaction.get(refs.user(uid))]);
    if (isBonusPhotoChallengeId(missionId) && !profile.data()?.onboardingComplete) throw new HttpsError("failed-precondition", "ONBOARDING_REQUIRED");
    const assigned = isBonusPhotoChallengeId(missionId)
      ? pack.data()?.bonusChallengeIds?.includes(missionId)
      : pack.data()?.challengeIds?.includes(missionId);
    if (!assignment.exists || !["available", "rejected"].includes(assignment.data()?.status) || assignment.data()?.eventId !== EVENT_ID || pack.data()?.eventId !== EVENT_ID || !assigned || !challenge.data()?.active || challenge.data()?.eventId !== EVENT_ID) {
      throw new HttpsError("failed-precondition", "CHALLENGE_UNAVAILABLE");
    }
    const now = FieldValue.serverTimestamp();
    transaction.set(refs.submission(uid, missionId), {
      operationId, eventId: EVENT_ID, userId: uid, missionId, kind: "challenge", evidenceType: "photo",
      image: { storagePath, bytes: Number(metadata.size ?? 0) }, status: "pending",
      moderationStatus: moderation.status, moderationSource: moderation.source,
      provisionalPoints: challenge.data()?.auraReward, finalPoints: 0, publicationEligible: false,
      submittedAt: now, updatedAt: now
    });
    transaction.update(assignmentRef, { status: "processing", updatedAt: now });
    const result = { status: "pending", scoreDelta: 0 };
    transaction.create(operationRef, { result, createdAt: now });
    return result;
  });
}

export const registerPhotoSubmission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return registerPhotoForUid(requireUid(request), request.data);
});
