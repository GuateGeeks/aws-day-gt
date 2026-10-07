import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { EVENT_ID, INITIAL_ADMIN_EMAIL } from "../../../shared/constants";
import { onboardingInputSchema } from "../../../shared/schemas";
import { BONUS_CHALLENGE_IDS } from "../../../shared/challenges/bonus";
import { loadChallengePack, writeChallengeAssignment } from "../challenges/ensure-assignment";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";

export async function completeOnboardingForUid(uid: string, email: string, rawInput: unknown, claimRole = "participant") {
  const input = onboardingInputSchema.safeParse(rawInput);
  if (!input.success) throw new HttpsError("invalid-argument", "INVALID_ONBOARDING", input.error.flatten());
  const profileRef = refs.user(uid);
  const existing = await profileRef.get();
  if (existing.data()?.onboardingComplete) {
    const assignment = await refs.challengeAssignment(uid).get();
    return { assigned: false, challengeIds: assignment.data()?.challengeIds ?? [] };
  }
  const pack = await loadChallengePack(uid);
  const aliasNormalized = input.data.alias.toLocaleLowerCase("es-GT");
  const aliasRef = database.doc(`aliases/${aliasNormalized}`);
  const scoreRef = refs.score(uid);

  return database.runTransaction(async (transaction) => {
    const [profile, alias, assignment, score] = await Promise.all([
      transaction.get(profileRef), transaction.get(aliasRef), transaction.get(refs.challengeAssignment(uid)), transaction.get(scoreRef)
    ]);
    if (profile.data()?.onboardingComplete) return { assigned: false, challengeIds: assignment.data()?.challengeIds ?? [] };
    if (alias.exists && alias.data()?.uid !== uid) throw new HttpsError("already-exists", "ALIAS_TAKEN");
    const currentChallenges = await Promise.all(pack.map((challenge) => transaction.get(refs.challenge(challenge.id))));
    const bonusChallenges = await Promise.all(BONUS_CHALLENGE_IDS.map((challengeId) => transaction.get(refs.challenge(challengeId))));
    if (currentChallenges.some((snapshot) => !snapshot.exists || !snapshot.data()?.active || snapshot.data()?.eventId !== EVENT_ID)
      || bonusChallenges.some((snapshot) => !snapshot.exists || snapshot.data()?.eventId !== EVENT_ID)) {
      throw new HttpsError("failed-precondition", "CHALLENGE_POOL_CHANGED");
    }
    const now = FieldValue.serverTimestamp();
    transaction.set(aliasRef, { uid, alias: input.data.alias });
    transaction.set(profileRef, {
      uid, email, alias: input.data.alias, aliasNormalized,
      role: email.toLowerCase() === INITIAL_ADMIN_EMAIL ? "admin" : claimRole,
      interests: input.data.interests,
      ...(input.data.challengeProfile ?? {}),
      ...(input.data.challengeProfile ? { challengeProfileCompletedAt: now } : {}),
      consent: { ...input.data.consent, acceptedAt: now },
      onboardingComplete: true, replacementsUsed: 0, createdAt: now, lastLoginAt: now
    }, { merge: true });
    if (score.exists) {
      transaction.set(scoreRef, {
        userId: uid, eventId: EVENT_ID, alias: input.data.alias,
        auraTotal: score.data()?.auraTotal ?? 0,
        completedChallenges: score.data()?.completedChallenges ?? 0,
        auraReachedAt: score.data()?.auraReachedAt ?? null,
        registeredForRanking: true,
        updatedAt: now
      }, { merge: true });
    } else {
      transaction.set(scoreRef, {
        userId: uid, eventId: EVENT_ID, alias: input.data.alias,
        totalPoints: 0, completedMissions: 0, photoMissions: 0, commentMissions: 0, wordMissions: 0,
        auraTotal: 0, completedChallenges: 0, auraReachedAt: null, registeredForRanking: true, updatedAt: now
      });
    }
    if (!assignment.exists) writeChallengeAssignment(transaction, uid, pack, now);
    return { assigned: true, challengeIds: pack.map((challenge) => challenge.id) };
  });
}

export const completeOnboarding = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return completeOnboardingForUid(requireUid(request), String(request.auth?.token.email ?? ""), request.data, String(request.auth?.token.role ?? "participant"));
});
