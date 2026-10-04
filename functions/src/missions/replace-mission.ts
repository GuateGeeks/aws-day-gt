import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID, MAX_REPLACEMENTS } from "../../../shared/constants";
import { missions } from "../../../scripts/data/missions";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const replaceMission = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const missionId = typeof request.data?.missionId === "string" ? request.data.missionId : "";
  if (!missionId) throw new HttpsError("invalid-argument", "MISSION_REQUIRED");
  return database.runTransaction(async (transaction) => {
    const profile = await transaction.get(refs.user(uid));
    const current = await transaction.get(refs.userMission(uid, missionId));
    if (!current.exists || current.data()?.status !== "available") throw new HttpsError("failed-precondition", "MISSION_UNAVAILABLE");
    if ((profile.data()?.replacementsUsed ?? 0) >= MAX_REPLACEMENTS) throw new HttpsError("resource-exhausted", "REPLACEMENTS_EXHAUSTED");
    const assignedQuery = await database.collection("userMissions").where("userId", "==", uid).get();
    const assignedIds = new Set(assignedQuery.docs.map((doc) => doc.data().missionId));
    const assignedSlots = new Set(assignedQuery.docs.map((doc) => doc.data().slot).filter(Boolean));
    const replacement = missions.find((mission) => mission.active && !assignedIds.has(mission.id) &&
      mission.evidenceType === current.data()?.evidenceType && mission.points === current.data()?.points &&
      !(mission.requiresAttendance && mission.slot && assignedSlots.has(mission.slot)));
    if (!replacement) throw new HttpsError("not-found", "NO_COMPATIBLE_REPLACEMENT");
    const now = FieldValue.serverTimestamp();
    transaction.update(current.ref, { status: "replaced", completedAt: now });
    transaction.set(refs.userMission(uid, replacement.id), {
      eventId: EVENT_ID, userId: uid, missionId: replacement.id, status: "available",
      evidenceType: replacement.evidenceType, points: replacement.points, slot: replacement.slot ?? null,
      assignedAt: now, replacementOf: missionId
    });
    transaction.update(refs.user(uid), { replacementsUsed: FieldValue.increment(1) });
    transaction.create(database.collection("auditLogs").doc(), { actorUid: uid, action: "MISSION_REPLACED", targetType: "userMission", targetId: missionId, after: replacement.id, timestamp: now });
    return { missionId: replacement.id };
  });
});
