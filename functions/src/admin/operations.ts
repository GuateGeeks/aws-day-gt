import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { requireRole } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const updateEventSettings = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const actorUid = requireRole(request, ["admin"]);
  const allowed = ["registrationOpen", "missionsEnabled", "leaderboardEnabled", "uploadsEnabled", "photoMissionsEnabled", "maintenanceMode", "eventMode", "maxReplacements", "legal"];
  const updates = Object.fromEntries(Object.entries(request.data ?? {}).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(updates).length) throw new HttpsError("invalid-argument", "NO_ALLOWED_SETTINGS");
  await refs.config().set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await database.collection("auditLogs").add({ actorUid, action: "SETTINGS_UPDATED", targetType: "config", targetId: refs.config().id, after: updates, timestamp: FieldValue.serverTimestamp() });
  return { updated: Object.keys(updates) };
});

export const setStaffRole = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const actorUid = requireRole(request, ["admin"]);
  const { uid, role } = request.data ?? {};
  if (typeof uid !== "string" || !["participant", "moderator", "admin"].includes(role)) throw new HttpsError("invalid-argument", "INVALID_ROLE");
  await getAuth().setCustomUserClaims(uid, { role });
  await refs.user(uid).set({ role }, { merge: true });
  await database.collection("auditLogs").add({ actorUid, action: "ROLE_UPDATED", targetType: "user", targetId: uid, after: role, timestamp: FieldValue.serverTimestamp() });
  return { uid, role };
});

export const requestDataDeletion = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "UNAUTHENTICATED");
  await database.collection("deletionRequests").doc(uid).set({ uid, status: "requested", requestedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { status: "requested" };
});
