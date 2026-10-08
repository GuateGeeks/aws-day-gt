import { beforeAll, describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { database, refs } from "../../functions/src/shared/refs";
import { completeOnboardingForUid } from "../../functions/src/missions/complete-onboarding";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("new participant onboarding", () => {
  beforeAll(async () => {
    await Promise.all(challenges.map((challenge) => database.doc(`challenges/${challenge.id}`).set(challenge)));
  });

  it("assigns nine credit Challenges without creating historical missions", async () => {
    const uid = `onboard-${crypto.randomUUID()}`;
    const alias = `onboard${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const result = await completeOnboardingForUid(uid, "onboard@example.com", {
      alias, interests: [],
      challengeProfile: { primaryRole: "Development", experienceLevel: "Junior", firstAwsCommunityDay: true, awsInterest: ["Serverless"] },
      consent: { termsVersion: "2026-10-04", accepted: true, photoPublication: false, marketing: false }
    });
    expect(result.challengeIds).toHaveLength(9);
    expect(result.challengeIds).toContain("C15");
    expect(result.challengeIds).not.toContain("C05");
    expect(result.challengeIds).not.toContain("C13");
    expect(result.challengeIds).not.toContain("C16");
    expect(result.challengeIds).not.toContain("C17");
    expect((await refs.challengeAssignment(uid).get()).data()?.bonusChallengeIds).toEqual(["C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23"]);
    expect((await refs.challengeProgress(uid, "C16").get()).data()?.status).toBe("available");
    expect((await refs.challengeProgress(uid, "C17").get()).data()?.status).toBe("available");
    expect((await refs.user(uid).get()).data()?.primaryRole).toBe("Development");
    expect((await database.collection("userMissions").where("userId", "==", uid).get()).size).toBe(0);
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 0, totalPoints: 0, registeredForRanking: true });
  });

  it("keeps an existing historical score if an older account finishes onboarding", async () => {
    const uid = `partial-${crypto.randomUUID()}`;
    const alias = `partial${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    await refs.score(uid).set({ eventId: "aws-community-day-gt-2026", userId: uid, alias: "old", totalPoints: 75, completedMissions: 5 });
    await completeOnboardingForUid(uid, "partial@example.com", {
      alias, interests: [],
      consent: { termsVersion: "2026-10-04", accepted: true, photoPublication: false, marketing: false }
    });
    expect((await refs.score(uid).get()).data()).toMatchObject({ totalPoints: 75, completedMissions: 5, auraTotal: 0, registeredForRanking: true });
  });
});
