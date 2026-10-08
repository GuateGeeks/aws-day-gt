// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_ID } from "../../shared/constants";
import { challenges } from "../../shared/challenges/catalog";
import { ensureAssignmentForUid } from "../../functions/src/challenges/ensure-assignment";
import { database, refs } from "../../functions/src/shared/refs";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("challenge package migration", () => {
  beforeAll(async () => {
    await Promise.all(challenges.map((challenge) => refs.challenge(challenge.id).set(challenge)));
  });

  it("assigns nine base challenges and eight bonuses to a new participant", async () => {
    const uid = `new-pack-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, alias: "Tester", onboardingComplete: true, createdAt: new Date(), consent: { acceptedAt: new Date() } });
    const first = await ensureAssignmentForUid(uid);
    const migratedAt = (await refs.challengeAssignment(uid).get()).data()?.updatedAt?.toMillis();
    const second = await ensureAssignmentForUid(uid);
    const afterSecondLoad = (await refs.challengeAssignment(uid).get()).data()?.updatedAt?.toMillis();
    expect(second.challengeIds).toEqual(first.challengeIds);
    expect(afterSecondLoad).toBe(migratedAt);
    expect(first.challengeIds).toHaveLength(9);
    expect(first.challengeIds).toEqual(expect.arrayContaining(["C08", "C12", "C15"]));
    expect(first.challengeIds.some((id) => ["C03", "C05", "C10", "C11", "C13", "C14"].includes(id))).toBe(false);
    expect(first.bonusChallengeIds).toEqual(["C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23"]);
    expect((await database.collection("challengeProgress").where("userId", "==", uid).get()).size).toBe(17);
  });

  it("retires old codes while preserving earned credits and completed active challenges", async () => {
    const uid = `migrated-pack-${crypto.randomUUID()}`;
    const oldIds = ["C01", "C02", "C03", "C05", "C06", "C08", "C09", "C10", "C11", "C13"];
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true, createdAt: new Date(), consent: { acceptedAt: new Date() } });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: oldIds, signature: oldIds.join(","), version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 420, completedChallenges: 3, totalPoints: 25 });
    await refs.challengeProgress(uid, "C03").set({ eventId: EVENT_ID, userId: uid, challengeId: "C03", status: "completed", auraAwarded: 200 });
    await refs.challengeProgress(uid, "C05").set({ eventId: EVENT_ID, userId: uid, challengeId: "C05", status: "completed", auraAwarded: 125 });
    await refs.challengeProgress(uid, "C13").set({ eventId: EVENT_ID, userId: uid, challengeId: "C13", status: "completed", auraAwarded: 250 });
    await refs.challengeProgress(uid, "C10").set({ eventId: EVENT_ID, userId: uid, challengeId: "C10", status: "completed", auraAwarded: 100 });
    const first = await ensureAssignmentForUid(uid);
    const second = await ensureAssignmentForUid(uid);
    expect(second.challengeIds).toEqual(first.challengeIds);
    expect(first.challengeIds).toHaveLength(9);
    expect(first.challengeIds).toEqual(expect.arrayContaining(["C08", "C12", "C15"]));
    expect(first.challengeIds.some((id) => ["C03", "C05", "C10", "C11", "C13", "C14"].includes(id))).toBe(false);
    expect((await refs.challengeProgress(uid, "C05").get()).data()).toMatchObject({ status: "completed", auraAwarded: 125 });
    expect((await refs.challengeProgress(uid, "C13").get()).data()).toMatchObject({ status: "completed", auraAwarded: 250 });
    expect((await refs.challengeProgress(uid, "C10").get()).data()).toMatchObject({ status: "completed", auraAwarded: 100 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 420, completedChallenges: 3, totalPoints: 25 });
    expect((await refs.challengeProgress(uid, "C15").get()).data()).toMatchObject({ status: "available", auraAwarded: 0 });
  });

  it("migrates concurrent requests once and keeps already started progress", async () => {
    const uid = `concurrent-migration-${crypto.randomUUID()}`;
    const oldIds = ["C01", "C02", "C03", "C04", "C05", "C06", "C08", "C10", "C11", "C13"];
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: oldIds, version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: -150, auraDeductedTotal: 150, completedChallenges: 0 });
    await refs.challengeProgress(uid, "C06").set({ eventId: EVENT_ID, userId: uid, challengeId: "C06", status: "failed", auraDeducted: 150, solution: "Histórico" });
    const [first, second] = await Promise.all([ensureAssignmentForUid(uid), ensureAssignmentForUid(uid)]);
    expect(second.challengeIds).toEqual(first.challengeIds);
    expect(first.challengeIds).toContain("C15");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: -150, auraDeductedTotal: 150 });
    expect((await refs.challengeProgress(uid, "C06").get()).data()).toMatchObject({ status: "failed", auraDeducted: 150, solution: "Histórico" });
  }, 15_000);

  it("does not provision challenges before onboarding is complete", async () => {
    const uid = `no-onboarding-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: false });
    await expect(ensureAssignmentForUid(uid)).rejects.toThrow("ONBOARDING_REQUIRED");
    expect((await refs.challengeAssignment(uid).get()).exists).toBe(false);
  });
});
