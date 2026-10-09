import { createHash } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { FieldPath, FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { adminApp } from "../shared/admin";
import { requireOwnerAdmin } from "../shared/auth";
import { database, refs } from "../shared/refs";

type DeletionDecision = "approved" | "rejected";
type DeletionReview = { uid?: unknown; decision?: unknown; note?: unknown };

function subjectDigest(uid: string): string {
  return createHash("sha256").update(`${EVENT_ID}:${uid}`).digest("hex");
}

async function ownedDocumentRefs(uid: string, aliasNormalized?: string): Promise<DocumentReference[]> {
  const prefix = `${uid}_`;
  const queries = [
    database.collection("challengeProgress").where("userId", "==", uid).get(),
    database.collection("scores").where("userId", "==", uid).get(),
    database.collection("submissions").where("userId", "==", uid).get(),
    database.collection("userMissions").where("userId", "==", uid).get(),
    database.collection("connections").where("userId", "==", uid).get(),
    database.collection("connections").where("peerUid", "==", uid).get(),
    database.collection("geekIdTokens").where("uid", "==", uid).get(),
    database.collection("aliases").where("uid", "==", uid).get(),
    database.collection("idempotency").where(FieldPath.documentId(), ">=", prefix).where(FieldPath.documentId(), "<", `${prefix}\uf8ff`).get()
  ];
  const snapshots = await Promise.all(queries);
  const direct = [refs.user(uid), refs.challengeAssignment(uid), ...(aliasNormalized ? [database.doc(`aliases/${aliasNormalized}`)] : [])];
  const unique = new Map<string, DocumentReference>();
  [...direct, ...snapshots.flatMap((snapshot) => snapshot.docs.map((entry) => entry.ref))].forEach((ref) => unique.set(ref.path, ref));
  return [...unique.values()];
}

export async function reviewDataDeletionForOwner(actorUid: string, rawInput: DeletionReview) {
  const uid = typeof rawInput?.uid === "string" ? rawInput.uid : "";
  const decision = rawInput?.decision as DeletionDecision;
  const note = typeof rawInput?.note === "string" ? rawInput.note.trim() : "";
  if (!uid || !["approved", "rejected"].includes(decision)) throw new HttpsError("invalid-argument", "INVALID_DELETION_REVIEW");
  if (decision === "rejected" && note.length < 3) throw new HttpsError("invalid-argument", "REJECTION_REASON_REQUIRED");
  const requestRef = database.doc(`deletionRequests/${uid}`);
  const request = await requestRef.get();
  if (!request.exists || !["requested", "failed"].includes(request.data()?.status)) throw new HttpsError("failed-precondition", "REQUEST_NOT_PENDING");

  if (decision === "rejected") {
    await requestRef.set({ status: "rejected", decisionNote: note, decidedBy: actorUid, decidedAt: FieldValue.serverTimestamp() }, { merge: true });
    await database.collection("auditLogs").add({ actorUid, action: "DATA_DELETION_REJECTED", subjectDigest: subjectDigest(uid), timestamp: FieldValue.serverTimestamp() });
    return { status: "rejected" };
  }

  await requestRef.set({ status: "processing", decidedBy: actorUid, decidedAt: FieldValue.serverTimestamp(), failureCode: FieldValue.delete() }, { merge: true });
  try {
    const profile = await refs.user(uid).get();
    const aliasNormalized = typeof profile.data()?.aliasNormalized === "string" ? profile.data()?.aliasNormalized : undefined;
    const [documents] = await Promise.all([
      ownedDocumentRefs(uid, aliasNormalized),
      getStorage(adminApp).bucket().deleteFiles({ prefix: `evidence/${EVENT_ID}/${uid}/`, force: true })
    ]);
    const writer = database.bulkWriter();
    documents.forEach((ref) => writer.delete(ref));
    await writer.close();
    try {
      await getAuth(adminApp).deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    }
    const completion = database.batch();
    completion.delete(requestRef);
    completion.set(database.collection("auditLogs").doc(), {
      actorUid,
      action: "USER_DATA_DELETED",
      subjectDigest: subjectDigest(uid),
      timestamp: FieldValue.serverTimestamp()
    });
    await completion.commit();
    return { status: "completed" };
  } catch (error) {
    await requestRef.set({ status: "failed", failureCode: "DELETE_RETRY_REQUIRED", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new HttpsError("internal", "DELETE_RETRY_REQUIRED", { cause: error instanceof Error ? error.name : "unknown" });
  }
}

export const reviewDataDeletion = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return reviewDataDeletionForOwner(requireOwnerAdmin(request), request.data ?? {});
});
