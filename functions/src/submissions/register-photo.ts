import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const registerPhotoSubmission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const { missionId, operationId, storagePath } = request.data ?? {};
  if (![missionId, operationId, storagePath].every((value) => typeof value === "string")) throw new HttpsError("invalid-argument", "INVALID_SUBMISSION");
  const expectedPrefix = `evidence/${EVENT_ID}/${uid}/${missionId}/`;
  if (!storagePath.startsWith(expectedPrefix)) throw new HttpsError("permission-denied", "INVALID_STORAGE_PATH");
  const [metadata] = await getStorage().bucket().file(storagePath).getMetadata();
  if (!metadata.contentType?.startsWith("image/") || Number(metadata.size ?? 0) > 1_572_864) throw new HttpsError("invalid-argument", "INVALID_PHOTO");
  return database.runTransaction(async (transaction) => {
    const operationRef = refs.operation(uid, operationId);
    const operation = await transaction.get(operationRef);
    if (operation.exists) return operation.data()?.result;
    const assignmentRef = refs.userMission(uid, missionId);
    const assignment = await transaction.get(assignmentRef);
    if (!assignment.exists || assignment.data()?.status !== "available" || assignment.data()?.evidenceType !== "photo") throw new HttpsError("failed-precondition", "MISSION_UNAVAILABLE");
    const now = FieldValue.serverTimestamp();
    transaction.set(refs.submission(uid, missionId), {
      operationId, eventId: EVENT_ID, userId: uid, missionId, evidenceType: "photo",
      image: { storagePath, bytes: Number(metadata.size ?? 0) }, status: "pending",
      provisionalPoints: assignment.data()?.points, finalPoints: 0, publicationEligible: false,
      submittedAt: now, updatedAt: now
    });
    transaction.update(assignmentRef, { status: "submitted", completedAt: now });
    const result = { status: "pending", scoreDelta: 0 };
    transaction.create(operationRef, { result, createdAt: now });
    return result;
  });
});
