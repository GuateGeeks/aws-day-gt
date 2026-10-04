import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { selectMissionPack } from "../../../shared/assignment";
import { EVENT_ID, INITIAL_ADMIN_EMAIL } from "../../../shared/constants";
import { onboardingInputSchema } from "../../../shared/schemas";
import { missions } from "../../../scripts/data/missions";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export const completeOnboarding = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  const uid = requireUid(request);
  const input = onboardingInputSchema.safeParse(request.data);
  if (!input.success) throw new HttpsError("invalid-argument", "INVALID_ONBOARDING", input.error.flatten());
  const profileRef = refs.user(uid);
  const aliasNormalized = input.data.alias.toLocaleLowerCase("es-GT");
  const aliasRef = database.doc(`aliases/${aliasNormalized}`);
  const scoreRef = refs.score(uid);

  const result = await database.runTransaction(async (transaction) => {
    const existing = await transaction.get(profileRef);
    if (existing.data()?.onboardingComplete) return { assigned: false };
    const alias = await transaction.get(aliasRef);
    if (alias.exists && alias.data()?.uid !== uid) throw new HttpsError("already-exists", "ALIAS_TAKEN");
    const pack = selectMissionPack({ missions, interests: input.data.interests, seed: uid });
    const now = FieldValue.serverTimestamp();
    transaction.set(aliasRef, { uid, alias: input.data.alias });
    transaction.set(profileRef, {
      uid,
      email: request.auth?.token.email ?? "",
      alias: input.data.alias,
      aliasNormalized,
      role: String(request.auth?.token.email ?? "").toLowerCase() === INITIAL_ADMIN_EMAIL ? "admin" : request.auth?.token.role ?? "participant",
      interests: input.data.interests,
      consent: { ...input.data.consent, acceptedAt: now },
      onboardingComplete: true,
      replacementsUsed: 0,
      createdAt: now,
      lastLoginAt: now
    }, { merge: true });
    transaction.set(scoreRef, {
      userId: uid, eventId: EVENT_ID, alias: input.data.alias, totalPoints: 0, completedMissions: 0,
      photoMissions: 0, commentMissions: 0, wordMissions: 0, updatedAt: now
    });
    for (const mission of pack) {
      transaction.set(refs.userMission(uid, mission.id), {
        eventId: EVENT_ID, userId: uid, missionId: mission.id, status: "available",
        evidenceType: mission.evidenceType, points: mission.points, slot: mission.slot ?? null, assignedAt: now
      });
    }
    return { assigned: true, missionIds: pack.map((mission) => mission.id) };
  });
  return result;
});
