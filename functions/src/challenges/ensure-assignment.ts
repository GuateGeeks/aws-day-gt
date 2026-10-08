import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { challengePackSignature, migrateChallengePack, selectChallengePack } from "../../../shared/challenges/assignment";
import { BONUS_CHALLENGE_IDS } from "../../../shared/challenges/bonus";
import type { Challenge, ChallengeAssignment } from "../../../shared/challenges/types";
import { EVENT_ID } from "../../../shared/constants";
import { requireUid } from "../shared/auth";
import { database, refs } from "../shared/refs";
import { hasCompletedRegistration } from "../shared/registration";

export async function loadChallengePack(uid: string): Promise<Challenge[]> {
  const [catalog, recent] = await Promise.all([
    database.collection("challenges").where("eventId", "==", EVENT_ID).get(),
    database.collection("challengeAssignments").orderBy("createdAt", "desc").limit(30).get()
  ]);
  const signatures = new Set(recent.docs.filter((doc) => doc.data().eventId === EVENT_ID)
    .map((doc) => doc.data().signature).filter((signature): signature is string => typeof signature === "string"));
  return selectChallengePack(catalog.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Challenge), uid, signatures);
}

export function writeChallengeAssignment(transaction: Transaction, uid: string, pack: Challenge[], now = FieldValue.serverTimestamp()): ChallengeAssignment {
  const challengeIds = pack.map((challenge) => challenge.id);
  const assignment: ChallengeAssignment = {
    eventId: EVENT_ID, userId: uid, challengeIds, bonusChallengeIds: [...BONUS_CHALLENGE_IDS],
    signature: challengePackSignature(pack), version: 2, createdAt: now
  };
  transaction.create(refs.challengeAssignment(uid), assignment);
  for (const challenge of pack) {
    transaction.create(refs.challengeProgress(uid, challenge.id), {
      eventId: EVENT_ID, userId: uid, challengeId: challenge.id,
      status: "available", auraAwarded: 0,
      createdAt: now, updatedAt: now
    });
  }
  for (const challengeId of BONUS_CHALLENGE_IDS) {
    transaction.create(refs.challengeProgress(uid, challengeId), {
      eventId: EVENT_ID, userId: uid, challengeId, status: "available", auraAwarded: 0,
      createdAt: now, updatedAt: now
    });
  }
  return assignment;
}

export async function ensureBonusChallengesForUid(uid: string): Promise<ChallengeAssignment> {
  return database.runTransaction(async (transaction) => {
    const assignmentRef = refs.challengeAssignment(uid);
    const [assignment, profile, score, ...progress] = await Promise.all([
      transaction.get(assignmentRef), transaction.get(refs.user(uid)), transaction.get(refs.score(uid)),
      ...BONUS_CHALLENGE_IDS.map((challengeId) => transaction.get(refs.challengeProgress(uid, challengeId)))
    ]);
    if (!profile.data()?.onboardingComplete) throw new HttpsError("failed-precondition", "ONBOARDING_REQUIRED");
    if (!assignment.exists || assignment.data()?.eventId !== EVENT_ID) throw new HttpsError("failed-precondition", "CHALLENGE_NOT_ASSIGNED");
    const bonusChallenges = await Promise.all(BONUS_CHALLENGE_IDS.map((challengeId) => transaction.get(refs.challenge(challengeId))));
    if (bonusChallenges.some((snapshot) => !snapshot.exists || snapshot.data()?.eventId !== EVENT_ID)) {
      throw new HttpsError("failed-precondition", "CHALLENGE_POOL_CHANGED");
    }
    const current = assignment.data() as ChallengeAssignment;
    const requiredIds = ["C08", "C12", "C15"] as const;
    const retiredIds = new Set(["C03", "C05", "C10", "C11", "C13", "C14"]);
    const needsMigration = current.challengeIds.some((id) => retiredIds.has(id)) || requiredIds.some((id) => !current.challengeIds.includes(id));
    let challengeIds = [...current.challengeIds];
    let migratedProgress: FirebaseFirestore.DocumentSnapshot[] = [];
    if (needsMigration) {
      const [catalog, ...currentProgress] = await Promise.all([
        transaction.get(database.collection("challenges").where("eventId", "==", EVENT_ID)),
        ...current.challengeIds.map((id) => transaction.get(refs.challengeProgress(uid, id)))
      ]);
      const completedIds = new Set(current.challengeIds.filter((_, index) => currentProgress[index]?.data()?.status === "completed"));
      try {
        challengeIds = migrateChallengePack(catalog.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Challenge), current.challengeIds, completedIds, uid).map((item) => item.id);
      } catch {
        throw new HttpsError("failed-precondition", "CHALLENGE_POOL_INCOMPATIBLE");
      }
      migratedProgress = await Promise.all(challengeIds.map((id) => transaction.get(refs.challengeProgress(uid, id))));
    }
    const now = FieldValue.serverTimestamp();
    const assignmentUpdates: Record<string, unknown> = {};
    if (BONUS_CHALLENGE_IDS.some((challengeId) => !current.bonusChallengeIds?.includes(challengeId))) {
      assignmentUpdates.bonusChallengeIds = [...BONUS_CHALLENGE_IDS];
    }
    if (needsMigration) {
      assignmentUpdates.challengeIds = challengeIds;
      assignmentUpdates.signature = [...challengeIds].sort().join(",");
    }
    if (Object.keys(assignmentUpdates).length) transaction.update(assignmentRef, { ...assignmentUpdates, updatedAt: now });
    for (const [index, id] of challengeIds.entries()) {
      if (needsMigration && !migratedProgress[index]?.exists) transaction.create(refs.challengeProgress(uid, id), {
        eventId: EVENT_ID, userId: uid, challengeId: id, status: "available", auraAwarded: 0,
        createdAt: now, updatedAt: now
      });
    }
    for (const [index, challengeId] of BONUS_CHALLENGE_IDS.entries()) {
      if (!progress[index]?.exists) {
        transaction.create(refs.challengeProgress(uid, challengeId), {
          eventId: EVENT_ID, userId: uid, challengeId, status: "available", auraAwarded: 0,
          createdAt: now, updatedAt: now
        });
      }
    }
    const registeredForRanking = hasCompletedRegistration(profile.data());
    const rankingFields = {
      userId: uid, eventId: EVENT_ID, alias: profile.data()?.alias ?? score.data()?.alias ?? "",
      auraTotal: score.data()?.auraTotal ?? 0,
      completedChallenges: score.data()?.completedChallenges ?? 0,
      auraReachedAt: score.data()?.auraReachedAt ?? null,
      registeredForRanking, updatedAt: now
    };
    if (score.exists) {
      if (score.data()?.registeredForRanking !== registeredForRanking
        || score.data()?.eventId !== EVENT_ID || score.data()?.userId !== uid
        || score.data()?.auraTotal === undefined || score.data()?.completedChallenges === undefined
        || score.data()?.auraReachedAt === undefined) {
        transaction.set(refs.score(uid), rankingFields, { merge: true });
      }
    } else {
      transaction.create(refs.score(uid), { ...rankingFields, totalPoints: 0, completedMissions: 0, photoMissions: 0, commentMissions: 0, wordMissions: 0 });
    }
    return { ...current, challengeIds, signature: needsMigration ? [...challengeIds].sort().join(",") : current.signature, bonusChallengeIds: [...BONUS_CHALLENGE_IDS] };
  });
}

export async function ensureAssignmentForUid(uid: string): Promise<ChallengeAssignment> {
  const assignmentRef = refs.challengeAssignment(uid);
  const existing = await assignmentRef.get();
  if (existing.exists) return ensureBonusChallengesForUid(uid);
  const pack = await loadChallengePack(uid);
  await database.runTransaction(async (transaction) => {
    const [assignment, profile, score] = await Promise.all([
      transaction.get(assignmentRef), transaction.get(refs.user(uid)), transaction.get(refs.score(uid))
    ]);
    if (assignment.exists) return assignment.data() as ChallengeAssignment;
    if (!profile.exists || !profile.data()?.onboardingComplete) throw new HttpsError("failed-precondition", "ONBOARDING_REQUIRED");
    const currentChallenges = await Promise.all(pack.map((challenge) => transaction.get(refs.challenge(challenge.id))));
    const bonusChallenges = await Promise.all(BONUS_CHALLENGE_IDS.map((challengeId) => transaction.get(refs.challenge(challengeId))));
    if (currentChallenges.some((snapshot) => !snapshot.exists || !snapshot.data()?.active || snapshot.data()?.eventId !== EVENT_ID)
      || bonusChallenges.some((snapshot) => !snapshot.exists || snapshot.data()?.eventId !== EVENT_ID)) {
      throw new HttpsError("failed-precondition", "CHALLENGE_POOL_CHANGED");
    }
    const now = FieldValue.serverTimestamp();
    const result = writeChallengeAssignment(transaction, uid, pack, now);
    if (score.exists) {
      transaction.set(refs.score(uid), {
        auraTotal: score.data()?.auraTotal ?? 0,
        completedChallenges: score.data()?.completedChallenges ?? 0,
        auraReachedAt: score.data()?.auraReachedAt ?? null,
        registeredForRanking: hasCompletedRegistration(profile.data()),
        updatedAt: now
      }, { merge: true });
    } else {
      transaction.create(refs.score(uid), {
        userId: uid, eventId: EVENT_ID, alias: profile.data()?.alias ?? "",
        totalPoints: 0, completedMissions: 0, photoMissions: 0, commentMissions: 0, wordMissions: 0,
        auraTotal: 0, completedChallenges: 0, auraReachedAt: null,
        registeredForRanking: hasCompletedRegistration(profile.data()), updatedAt: now
      });
    }
    return result;
  });
  return ensureBonusChallengesForUid(uid);
}

export const ensureChallengeAssignment = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  return ensureAssignmentForUid(requireUid(request));
});
