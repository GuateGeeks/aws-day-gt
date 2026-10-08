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

export async function issueStationTokenForStaff(_actorUid: string, stationId: string, _participantUid?: string) {
  if (stationId !== "cloudforge") throw new HttpsError("invalid-argument", "INVALID_STATION");
  throw new HttpsError("failed-precondition", "CHALLENGE_RETIRED");
}

export const issueGeekId = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => issueGeekIdForUid(requireUid(request)));
export const issueStationToken = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return issueStationTokenForStaff(requireRole(request, ["admin", "moderator"]), request.data?.stationId, request.data?.participantUid);
});
