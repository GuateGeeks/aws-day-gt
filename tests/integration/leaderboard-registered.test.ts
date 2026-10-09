import { beforeAll, describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { database, refs } from "../../functions/src/shared/refs";
import { getRegisteredLeaderboardForUid } from "../../functions/src/scoring/leaderboard";
import { completeOnboardingForUid } from "../../functions/src/missions/complete-onboarding";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("registered Aura leaderboard", () => {
  const participantUid = `registered-${crypto.randomUUID()}`;
  const zeroUid = `registered-zero-${crypto.randomUUID()}`;
  const moreCompletedUid = `registered-more-${crypto.randomUUID()}`;
  const laterUid = `registered-later-${crypto.randomUUID()}`;
  const incompleteUid = `incomplete-${crypto.randomUUID()}`;
  const flagOnlyUid = `flag-only-${crypto.randomUUID()}`;
  const eventId = `leaderboard-test-${crypto.randomUUID()}`;
  const participantAlias = `Participante${crypto.randomUUID().slice(0, 8)}`;
  const zeroAlias = `SinAura${crypto.randomUUID().slice(0, 8)}`;
  const moreCompletedAlias = `MasRetos${crypto.randomUUID().slice(0, 8)}`;
  const laterAlias = `MasTarde${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    await Promise.all(challenges.map((challenge) => refs.challenge(challenge.id).set(challenge)));
    const register = (uid: string, alias: string) => completeOnboardingForUid(uid, `${uid}@example.com`, {
      alias, interests: [],
      consent: { termsVersion: "2026-10-04", accepted: true, photoPublication: false, marketing: false }
    });
    await register(participantUid, participantAlias);
    await register(zeroUid, zeroAlias);
    await register(moreCompletedUid, moreCompletedAlias);
    await register(laterUid, laterAlias);
    const batch = database.batch();
    batch.set(database.doc(`scores/${eventId}_${participantUid}`), { eventId, userId: participantUid, alias: participantAlias, registeredForRanking: true, auraTotal: 200, auraReachedAt: "2026-10-07T10:00:00.000Z", completedChallenges: 2 });
    batch.set(database.doc(`scores/${eventId}_${zeroUid}`), { eventId, userId: zeroUid, alias: zeroAlias, registeredForRanking: true, auraTotal: 0, auraReachedAt: null, completedChallenges: 0 });
    batch.set(database.doc(`scores/${eventId}_${moreCompletedUid}`), { eventId, userId: moreCompletedUid, alias: moreCompletedAlias, registeredForRanking: true, auraTotal: 200, auraReachedAt: "2026-10-07T11:00:00.000Z", completedChallenges: 3 });
    batch.set(database.doc(`scores/${eventId}_${laterUid}`), { eventId, userId: laterUid, alias: laterAlias, registeredForRanking: true, auraTotal: 200, auraReachedAt: "2026-10-07T12:00:00.000Z", completedChallenges: 2 });
    for (let index = 0; index < 55; index += 1) {
      const uid = `orphan-${crypto.randomUUID()}`;
      batch.set(database.doc(`scores/${eventId}_${uid}`), { eventId, userId: uid, alias: `Prueba ${index}`, auraTotal: 1000 - index, auraReachedAt: null, completedChallenges: 1 });
    }
    batch.set(refs.user(incompleteUid), { uid: incompleteUid, alias: "Sin registro", onboardingComplete: false });
    batch.set(database.doc(`scores/${eventId}_${incompleteUid}`), { eventId, userId: incompleteUid, alias: "Sin registro", registeredForRanking: true, auraTotal: 300, auraReachedAt: null, completedChallenges: 1 });
    batch.set(refs.user(flagOnlyUid), { uid: flagOnlyUid, alias: "Solo bandera", onboardingComplete: true });
    batch.set(database.doc(`scores/${eventId}_${flagOnlyUid}`), { eventId, userId: flagOnlyUid, alias: "Solo bandera", registeredForRanking: true, auraTotal: 400, auraReachedAt: null, completedChallenges: 1 });
    await batch.commit();
  });

  it("includes only registered scores and orders Aura ties by completed Challenges then time", async () => {
    const result = await getRegisteredLeaderboardForUid(zeroUid, eventId);
    const participant = result.rows.find((row) => row.userId === participantUid);
    const zero = result.rows.find((row) => row.userId === zeroUid);
    expect(participant).toMatchObject({ alias: participantAlias, auraTotal: 200, completedChallenges: 2 });
    expect(zero).toMatchObject({ alias: zeroAlias, auraTotal: 0, completedChallenges: 0 });
    expect(result.rows.map((row) => row.userId)).toEqual([flagOnlyUid, incompleteUid, moreCompletedUid, participantUid, laterUid, zeroUid]);
    expect(result.rows.map((row) => row.rank)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.personalRank).toBe(zero!.rank);
    expect(result.rows.some((row) => row.alias.startsWith("Prueba "))).toBe(false);
    expect(result.rows.some((row) => row.alias === "Sin registro")).toBe(true);
    expect(result.rows.some((row) => row.alias === "Solo bandera")).toBe(true);
  });

  it("keeps a registered player visible when penalties put their Aura below zero", async () => {
    await database.doc(`scores/${eventId}_${zeroUid}`).update({ auraTotal: -150, auraDeductedTotal: 150 });
    const result = await getRegisteredLeaderboardForUid(zeroUid, eventId);
    expect(result.rows.at(-1)).toMatchObject({ userId: zeroUid, auraTotal: -150 });
    expect(result.personalRank).toBe(result.rows.length);
  });

  it("includes a registered participant beyond the first fifty scores", async () => {
    const longEventId = `leaderboard-long-${crypto.randomUUID()}`;
    const batch = database.batch();
    const uids = Array.from({ length: 51 }, (_, index) => `ranking-${index}-${crypto.randomUUID()}`);
    uids.forEach((uid, index) => {
      batch.set(refs.user(uid), {
        uid, alias: `Registrado ${index + 1}`, onboardingComplete: true,
        createdAt: "2026-10-06T00:00:00.000Z", consent: { acceptedAt: "2026-10-06T00:00:00.000Z" }
      });
      batch.set(database.doc(`scores/${longEventId}_${uid}`), {
        eventId: longEventId, userId: uid, alias: `Registrado ${index + 1}`, registeredForRanking: true,
        auraTotal: 100 - index, completedChallenges: 1, auraReachedAt: "2026-10-06T00:00:00.000Z"
      });
    });
    await batch.commit();

    const result = await getRegisteredLeaderboardForUid(uids[50]!, longEventId);
    expect(result.rows).toHaveLength(51);
    expect(result.rows[50]).toMatchObject({ userId: uids[50], rank: 51 });
    expect(result.personalRank).toBe(51);
  });
});
