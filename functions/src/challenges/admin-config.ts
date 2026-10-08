import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { selectChallengePack } from "../../../shared/challenges/assignment";
import type { Challenge } from "../../../shared/challenges/types";
import { requireRole } from "../shared/auth";
import { database, refs } from "../shared/refs";

export async function configureSessionForAdmin(_actorUid: string, _raw: unknown) {
  throw new HttpsError("failed-precondition", "CHALLENGE_RETIRED");
}

export const configureChallengeSession = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return configureSessionForAdmin(requireRole(request, ["admin"]), request.data);
});

const eventCodeSchema = z.object({
  challengeId: z.literal("C13"),
  code: z.string().trim().min(4).max(30),
  active: z.boolean()
});

export async function configureEventCodeForAdmin(_actorUid: string, raw: unknown) {
  const parsed = eventCodeSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_EVENT_CODE_CONFIGURATION");
  throw new HttpsError("failed-precondition", "CHALLENGE_RETIRED");
}

export const configureEventCode = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return configureEventCodeForAdmin(requireRole(request, ["admin"]), request.data);
});

const settingsSchema = z.object({
  challengeId: z.string().regex(/^C(?:0[1-9]|1[0-9]|2[0-3])$/),
  active: z.boolean(),
  auraReward: z.number().int().min(1).max(500),
  description: z.string().min(5).max(500)
});

export async function updateChallengeSettingsForAdmin(actorUid: string, raw: unknown) {
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_CHALLENGE_SETTINGS");
  const { challengeId, active, auraReward, description } = parsed.data;
  if (["C03", "C05", "C10", "C11", "C13", "C14"].includes(challengeId)) throw new HttpsError("failed-precondition", "CHALLENGE_RETIRED");
  await database.runTransaction(async (transaction) => {
    const ref = refs.challenge(challengeId);
    const [challenge, catalog] = await Promise.all([transaction.get(ref), transaction.get(database.collection("challenges"))]);
    if (!challenge.exists) throw new HttpsError("not-found", "CHALLENGE_NOT_FOUND");
    if (challenge.data()?.active && !active) {
      const assigned = await transaction.get(database.collection("challengeAssignments").where("challengeIds", "array-contains", challengeId).limit(1));
      if (!assigned.empty) throw new HttpsError("failed-precondition", "CHALLENGE_ALREADY_ASSIGNED");
    }
    const prospective = catalog.docs.map((doc) => ({ id: doc.id, ...doc.data(), ...(doc.id === challengeId ? { active, auraReward, description } : {}) }) as Challenge);
    try { selectChallengePack(prospective, "admin-catalog-check"); }
    catch { throw new HttpsError("failed-precondition", "CHALLENGE_POOL_INCOMPATIBLE"); }
    transaction.update(ref, { active, auraReward, description, updatedAt: FieldValue.serverTimestamp() });
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: "CHALLENGE_SETTINGS_UPDATED", targetType: "challenge", targetId: challengeId, active, auraReward, timestamp: FieldValue.serverTimestamp() });
  });
  return { updated: true, challengeId };
}

export const updateChallengeSettings = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return updateChallengeSettingsForAdmin(requireRole(request, ["admin"]), request.data);
});

const stationSchema = z.object({ stationId: z.literal("cloudforge"), name: z.string().min(3).max(120), active: z.boolean() });

export async function updateExperienceStationForAdmin(actorUid: string, raw: unknown) {
  const parsed = stationSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_STATION_SETTINGS");
  const { stationId, name, active } = parsed.data;
  await database.runTransaction(async (transaction) => {
    const ref = refs.experienceStation(stationId);
    const station = await transaction.get(ref);
    if (!station.exists) throw new HttpsError("not-found", "STATION_NOT_FOUND");
    transaction.update(ref, { name, active, updatedAt: FieldValue.serverTimestamp() });
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: "EXPERIENCE_STATION_UPDATED", targetType: "station", targetId: stationId, active, timestamp: FieldValue.serverTimestamp() });
  });
  return { updated: true, stationId };
}

export const updateExperienceStation = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return updateExperienceStationForAdmin(requireRole(request, ["admin"]), request.data);
});

const optionsSchema = z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/), label: z.string().min(1).max(160) })).min(2).max(10)
  .refine((options) => new Set(options.map((option) => option.id)).size === options.length);
const cloudQuestionSchema = z.object({
  challengeId: z.literal("C09"),
  prompt: z.string().min(5).max(600),
  options: optionsSchema.max(6),
  correctOptionId: z.string().min(1)
}).refine((value) => value.options.some((option) => option.id === value.correctOptionId)
  && value.prompt.split("\n").filter((line) => line.trim()).length >= 2);

export async function configureCloudQuestionForAdmin(actorUid: string, raw: unknown) {
  const parsed = cloudQuestionSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_CLOUD_CONFIGURATION");
  const { challengeId, prompt, options, correctOptionId } = parsed.data;
  await database.runTransaction(async (transaction) => {
    const publicRef = refs.challenge(challengeId), secretRef = refs.challengeSecret(challengeId);
    const publicChallenge = await transaction.get(publicRef);
    if (!publicChallenge.exists) throw new HttpsError("not-found", "CHALLENGE_NOT_FOUND");
    transaction.update(publicRef, { configuration: { ...publicChallenge.data()?.configuration, options, clues: prompt.split("\n").map((line) => line.trim()).filter(Boolean) }, updatedAt: FieldValue.serverTimestamp() });
    transaction.set(secretRef, { challengeId, correctOptionId }, { merge: true });
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: "CLOUD_QUESTION_CONFIGURED", targetType: "challenge", targetId: challengeId, timestamp: FieldValue.serverTimestamp() });
  });
  return { configured: true, challengeId };
}

export const configureCloudQuestion = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return configureCloudQuestionForAdmin(requireRole(request, ["admin"]), request.data);
});

export async function configureTrackPulseForAdmin(actorUid: string, raw: unknown) {
  const parsed = z.object({ tracks: optionsSchema }).safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_TRACK_CONFIGURATION");
  await database.runTransaction(async (transaction) => {
    const ref = refs.challenge("C12");
    if (!(await transaction.get(ref)).exists) throw new HttpsError("not-found", "CHALLENGE_NOT_FOUND");
    transaction.update(ref, { "configuration.tracks": parsed.data.tracks, updatedAt: FieldValue.serverTimestamp() });
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: "TRACK_PULSE_CONFIGURED", targetType: "challenge", targetId: "C12", timestamp: FieldValue.serverTimestamp() });
  });
  return { configured: true };
}

export const configureTrackPulse = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return configureTrackPulseForAdmin(requireRole(request, ["admin"]), request.data);
});
