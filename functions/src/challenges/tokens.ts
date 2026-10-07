import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID } from "../../../shared/constants";
import { requireRole, requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function issueGeekIdForUid(uid: string) {
  const profile = await refs.user(uid).get();
  if (!profile.exists || !profile.data()?.onboardingComplete) throw new HttpsError("failed-precondition", "ONBOARDING_REQUIRED");
  const token = randomBytes(32).toString("base64url");
  const expiresAtMillis = Date.now() + 5 * 60_000;
  await database.doc(`geekIdTokens/${hash(token)}`).create({ eventId: EVENT_ID, uid, expiresAtMillis, createdAt: FieldValue.serverTimestamp() });
  return { token, expiresAtMillis };
}

export async function issueStationTokenForStaff(actorUid: string, stationId: string, participantUid?: string) {
  if (!["cloudforge", "vr-explorer"].includes(stationId)) throw new HttpsError("invalid-argument", "INVALID_STATION");
  if (participantUid !== undefined && (typeof participantUid !== "string" || participantUid.length > 128)) throw new HttpsError("invalid-argument", "INVALID_PARTICIPANT");
  const station = await refs.experienceStation(stationId).get();
  if (!station.exists || !station.data()?.active || station.data()?.eventId !== EVENT_ID || station.data()?.completionMethod !== "staff_verified_token") {
    throw new HttpsError("failed-precondition", "STATION_UNAVAILABLE");
  }
  const challenge = await refs.challenge(station.data()?.challengeId).get();
  if (!challenge.exists || !challenge.data()?.active) throw new HttpsError("failed-precondition", "CHALLENGE_INACTIVE");
  const token = randomBytes(32).toString("base64url");
  const expiresAtMillis = Date.now() + 10 * 60_000;
  await database.doc(`experienceTokens/${hash(token)}`).create({
    eventId: EVENT_ID, stationId, challengeId: station.data()?.challengeId, participantUid: participantUid ?? null, issuedBy: actorUid,
    expiresAtMillis, createdAt: FieldValue.serverTimestamp()
  });
  await database.collection("auditLogs").add({ actorUid, action: "STATION_TOKEN_ISSUED", targetType: "station", targetId: stationId, participantUid: participantUid ?? null, timestamp: FieldValue.serverTimestamp() });
  return { token, expiresAtMillis };
}

export const issueGeekId = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => issueGeekIdForUid(requireUid(request)));
export const issueStationToken = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return issueStationTokenForStaff(requireRole(request, ["admin", "moderator"]), request.data?.stationId, request.data?.participantUid);
});
