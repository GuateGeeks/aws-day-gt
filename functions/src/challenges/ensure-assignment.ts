import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { challengePackSignature, selectChallengePack } from "../../../shared/challenges/assignment";
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
    const requiredIds = ["C08", "C10", "C11", "C12", "C13"] as const;
    const missingIds = requiredIds.filter((id) => !current.challengeIds.includes(id));
    const fixedCatalog = await Promise.all(missingIds.map((id) => transaction.get(refs.challenge(id))));
    if (fixedCatalog.some((snapshot) => !snapshot.exists || !snapshot.data()?.active || snapshot.data()?.eventId !== EVENT_ID)) {
      throw new HttpsError("failed-precondition", "CHALLENGE_POOL_CHANGED");
    }
    const currentProgress = await Promise.all(current.challengeIds.map((id) => transaction.get(refs.challengeProgress(uid, id))));
    const currentCatalog = await Promise.all(current.challengeIds.map((id) => transaction.get(refs.challenge(id))));
    const fixedProgress = await Promise.all(requiredIds.map((id) => transaction.get(refs.challengeProgress(uid, id))));
    let replacement: Challenge | undefined;
    let replacementProgress: FirebaseFirestore.DocumentSnapshot | undefined;
    if (current.challengeIds.includes("C03")) {
      const catalog = await transaction.get(database.collection("challenges").where("eventId", "==", EVENT_ID));
      replacement = catalog.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Challenge)
        .filter((challenge) => challenge.active && challenge.category === "CONNECT" && !current.challengeIds.includes(challenge.id))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (!replacement) throw new HttpsError("failed-precondition", "CHALLENGE_POOL_INCOMPATIBLE");
      replacementProgress = await transaction.get(refs.challengeProgress(uid, replacement.id));
    }
    const now = FieldValue.serverTimestamp();
    const challengeIds = replacement
      ? current.challengeIds.map((id) => id === "C03" ? replacement!.id : id)
      : [...current.challengeIds];
    const challengesById = new Map([...currentCatalog, ...fixedCatalog].map((snapshot) => [snapshot.id, snapshot.data()]));
    for (const missingId of missingIds) {
      if (challengeIds.length < 10) { challengeIds.push(missingId); continue; }
      const missingCategory = fixedCatalog[missingIds.indexOf(missingId)]?.data()?.category;
      const optional = challengeIds.filter((id) => !requiredIds.some((fixed) => fixed === id));
      const replaceable = optional.find((id) => {
        const status = currentProgress[current.challengeIds.indexOf(id)]?.data()?.status;
        const category = challengesById.get(id)?.category;
        return status !== "completed" && category === missingCategory;
      }) ?? optional.find((id) => currentProgress[current.challengeIds.indexOf(id)]?.data()?.status !== "completed")
        ?? optional.find((id) => challengesById.get(id)?.category === missingCategory)
        ?? optional[0];
      if (!replaceable) throw new HttpsError("failed-precondition", "CHALLENGE_POOL_INCOMPATIBLE");
      challengeIds[challengeIds.indexOf(replaceable)] = missingId;
    }
    const assignmentUpdates: Record<string, unknown> = {};
    if (BONUS_CHALLENGE_IDS.some((challengeId) => !current.bonusChallengeIds?.includes(challengeId))) {
      assignmentUpdates.bonusChallengeIds = [...BONUS_CHALLENGE_IDS];
    }
    if (replacement || missingIds.length) {
      assignmentUpdates.challengeIds = challengeIds;
      assignmentUpdates.signature = [...challengeIds].sort().join(",");
    }
    if (Object.keys(assignmentUpdates).length) transaction.update(assignmentRef, { ...assignmentUpdates, updatedAt: now });
    if (replacement && !replacementProgress?.exists) {
      transaction.create(refs.challengeProgress(uid, replacement.id), {
        eventId: EVENT_ID, userId: uid, challengeId: replacement.id,
        status: "available", auraAwarded: 0, createdAt: now, updatedAt: now
      });
    }
    for (const [index, id] of requiredIds.entries()) {
      const state = fixedProgress[index];
      if (!state?.exists) transaction.create(refs.challengeProgress(uid, id), {
        eventId: EVENT_ID, userId: uid, challengeId: id, status: "available", auraAwarded: 0,
        createdAt: now, updatedAt: now
      });
      else if (id === "C11" && state?.data()?.status === "locked") transaction.update(refs.challengeProgress(uid, id), {
        status: "available", updatedAt: now
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
    return { ...current, challengeIds, signature: replacement || missingIds.length ? [...challengeIds].sort().join(",") : current.signature, bonusChallengeIds: [...BONUS_CHALLENGE_IDS] };
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
