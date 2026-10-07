import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { selectChallengePack } from "../../../shared/challenges/assignment";
import type { Challenge } from "../../../shared/challenges/types";
import { requireRole } from "../shared/auth";
import { database, refs } from "../shared/refs";

const sessionSchema = z.object({
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  label: z.string().min(3).max(120),
  code: z.string().trim().min(4).max(30),
  question: z.string().min(5).max(240),
  options: z.array(z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/), label: z.string().min(1).max(160) })).min(2).max(6),
  correctOptionId: z.string(),
  startAt: z.iso.datetime().optional(), endAt: z.iso.datetime().optional(), active: z.boolean().default(true)
}).refine((value) => value.options.some((option) => option.id === value.correctOptionId)
  && new Set(value.options.map((option) => option.id)).size === value.options.length
  && (!value.startAt || !value.endAt || Date.parse(value.startAt) < Date.parse(value.endAt)));

export async function configureSessionForAdmin(actorUid: string, raw: unknown) {
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_SESSION_CONFIGURATION");
  const input = parsed.data;
  const codeHash = createHash("sha256").update(input.code.trim().toUpperCase()).digest("hex");
  await database.runTransaction(async (transaction) => {
    const c10Ref = refs.challengeSecret("C10"), c11Ref = refs.challengeSecret("C11"), publicRef = refs.challenge("C11"), unlockRef = refs.challenge("C10");
    const [c10, c11, publicChallenge, unlockChallenge] = await Promise.all([transaction.get(c10Ref), transaction.get(c11Ref), transaction.get(publicRef), transaction.get(unlockRef)]);
    if (!publicChallenge.exists) throw new HttpsError("failed-precondition", "CHALLENGE_NOT_SEEDED");
    const sessionCodes = { ...(c10.data()?.sessionCodes ?? {}), [input.sessionId]: { codeHash, active: input.active, startAt: input.startAt ?? null, endAt: input.endAt ?? null } };
    const sessionQuestions = { ...(c11.data()?.sessionQuestions ?? {}), [input.sessionId]: { correctOptionId: input.correctOptionId } };
    const prior = publicChallenge.data()?.configuration?.sessions ?? [];
    const sessions = [...prior.filter((session: { id: string }) => session.id !== input.sessionId), { id: input.sessionId, label: input.label, question: input.question, options: input.options }];
    transaction.set(c10Ref, { challengeId: "C10", sessionCodes }, { merge: true });
    transaction.set(c11Ref, { challengeId: "C11", sessionQuestions }, { merge: true });
    transaction.update(publicRef, { "configuration.sessions": sessions });
    if (unlockChallenge.exists) transaction.update(unlockRef, { "configuration.sessions": sessions.map(({ id, label }: { id: string; label: string }) => ({ id, label, question: "", options: [] })) });
    transaction.create(database.collection("auditLogs").doc(), { actorUid, action: "SESSION_CHALLENGE_CONFIGURED", targetType: "session", targetId: input.sessionId, timestamp: FieldValue.serverTimestamp() });
  });
  return { configured: true, sessionId: input.sessionId };
}

export const configureChallengeSession = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return configureSessionForAdmin(requireRole(request, ["admin"]), request.data);
});

const eventCodeSchema = z.object({
  challengeId: z.enum(["C10", "C11", "C13"]),
  code: z.string().trim().min(4).max(30),
  active: z.boolean()
});

export async function configureEventCodeForAdmin(actorUid: string, raw: unknown) {
  const parsed = eventCodeSchema.safeParse(raw);
  if (!parsed.success) throw new HttpsError("invalid-argument", "INVALID_EVENT_CODE_CONFIGURATION");
  const { challengeId, code, active } = parsed.data;
  const sharedCodeHash = createHash("sha256").update(code.toUpperCase()).digest("hex");
  await database.runTransaction(async (transaction) => {
    if (!(await transaction.get(refs.challenge(challengeId))).exists) throw new HttpsError("not-found", "CHALLENGE_NOT_FOUND");
    transaction.set(refs.challengeSecret(challengeId), { challengeId, sharedCodeHash, sharedCodeActive: active }, { merge: true });
    transaction.create(database.collection("auditLogs").doc(), {
      actorUid, action: "EVENT_CODE_CONFIGURED", targetType: "challenge", targetId: challengeId,
      active, timestamp: FieldValue.serverTimestamp()
    });
  });
  return { configured: true, challengeId };
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
  if (challengeId === "C13" && !active) throw new HttpsError("failed-precondition", "CLOUDFORGE_REQUIRED");
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

const stationSchema = z.object({ stationId: z.enum(["cloudforge", "vr-explorer"]), name: z.string().min(3).max(120), active: z.boolean() });

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
