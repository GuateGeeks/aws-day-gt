// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_ID } from "../../shared/constants";
import { challenges } from "../../shared/challenges/catalog";
import { challengePackSignature } from "../../shared/challenges/assignment";
import { ensureAssignmentForUid } from "../../functions/src/challenges/ensure-assignment";
import { database, refs } from "../../functions/src/shared/refs";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("bonus selfie provisioning", () => {
  beforeAll(async () => {
    await Promise.all(challenges.map((challenge) => refs.challenge(challenge.id).set(challenge)));
  });

  it("persists one ten-Challenge pack and does not reset historical points", async () => {
    const uid = `assignment-score-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, alias: "Tester", onboardingComplete: true, createdAt: new Date(), consent: { acceptedAt: new Date() } });
    await refs.score(uid).set({ userId: uid, eventId: EVENT_ID, alias: "Tester", totalPoints: 25, completedMissions: 2 });
    const first = await ensureAssignmentForUid(uid);
    const second = await ensureAssignmentForUid(uid);
    expect(first.challengeIds).toHaveLength(10);
    expect(first.challengeIds).toContain("C13");
    expect(second.challengeIds).toEqual(first.challengeIds);
    expect((await refs.score(uid).get()).data()).toMatchObject({ totalPoints: 25, auraTotal: 0, completedChallenges: 0, registeredForRanking: true });
  });

  it("adds C08 to an existing pack without changing earned Aura", async () => {
    const uid = `assignment-c08-${crypto.randomUUID()}`;
    const challengeIds = ["C01", "C02", "C04", "C05", "C06", "C07", "C09", "C10", "C11", "C13"];
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds, signature: challengeIds.join(","), version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 100, completedChallenges: 1 });
    await refs.challengeProgress(uid, "C06").set({ eventId: EVENT_ID, userId: uid, challengeId: "C06", status: "available", auraAwarded: 0 });
    await refs.challengeProgress(uid, "C07").set({ eventId: EVENT_ID, userId: uid, challengeId: "C07", status: "completed", auraAwarded: 100 });
    const first = await ensureAssignmentForUid(uid);
    const second = await ensureAssignmentForUid(uid);
    expect(first.challengeIds).toHaveLength(10);
    expect(first.challengeIds).toContain("C08");
    expect(first.challengeIds).not.toContain("C06");
    expect(second.challengeIds).toEqual(first.challengeIds);
    expect((await refs.challengeProgress(uid, "C06").get()).data()?.status).toBe("available");
    expect((await refs.challengeProgress(uid, "C08").get()).data()).toMatchObject({ status: "available", auraAwarded: 0 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 100, completedChallenges: 1 });
  });

  it("unlocks an existing C11 and adds the new fixed Challenges without resetting Aura", async () => {
    const uid = `assignment-talk-${crypto.randomUUID()}`;
    const challengeIds = ["C01", "C02", "C04", "C05", "C06", "C07", "C09", "C10", "C11", "C13"];
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds, version: 2 });
    await refs.challengeProgress(uid, "C11").set({ eventId: EVENT_ID, userId: uid, challengeId: "C11", status: "locked", auraAwarded: 0 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 230, completedChallenges: 2 });
    const assignment = await ensureAssignmentForUid(uid);
    expect(assignment.challengeIds).toHaveLength(10);
    for (const id of ["C08", "C10", "C11", "C12", "C13"]) expect(assignment.challengeIds).toContain(id);
    expect((await refs.challengeProgress(uid, "C11").get()).data()?.status).toBe("available");
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 230, completedChallenges: 2 });
  });

  it("keeps completed Cloud progress and earned Aura when every replaceable Cloud challenge is complete", async () => {
    const uid = `assignment-c08-complete-${crypto.randomUUID()}`;
    const challengeIds = ["C01", "C02", "C04", "C05", "C06", "C07", "C09", "C10", "C11", "C13"];
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds, signature: challengeIds.join(","), version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 450, completedChallenges: 3 });
    for (const id of ["C06", "C07", "C09"]) {
      await refs.challengeProgress(uid, id).set({ eventId: EVENT_ID, userId: uid, challengeId: id, status: "completed", auraAwarded: 150 });
    }
    const assignment = await ensureAssignmentForUid(uid);
    expect(assignment.challengeIds).toHaveLength(10);
    expect(assignment.challengeIds).toContain("C08");
    for (const id of ["C08", "C10", "C11", "C12", "C13"]) expect(assignment.challengeIds).toContain(id);
    expect((await refs.challengeProgress(uid, "C06").get()).data()).toMatchObject({ status: "completed", auraAwarded: 150 });
    expect((await refs.challengeProgress(uid, "C08").get()).data()).toMatchObject({ status: "available", auraAwarded: 0 });
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: 450, completedChallenges: 3 });
  });

  it("creates just one assignment and one pair of bonuses when requests arrive together", async () => {
    const uid = `assignment-concurrent-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, alias: "Concurrent", onboardingComplete: true });
    const [first, second] = await Promise.all([ensureAssignmentForUid(uid), ensureAssignmentForUid(uid)]);
    expect(first.challengeIds).toEqual(second.challengeIds);
    expect(first.challengeIds).toHaveLength(10);
    expect((await database.collection("challengeProgress").where("userId", "==", uid).get()).size).toBe(18);
  });

  it("adds the two bonuses to an existing registered account without changing its ten Challenges", async () => {
    const uid = `bonus-existing-${crypto.randomUUID()}`;
    const challengeIds = challenges.slice(3, 13).map((challenge) => challenge.id);
    await refs.user(uid).set({ uid, onboardingComplete: true, alias: uid, createdAt: new Date(), consent: { acceptedAt: new Date() } });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds, signature: challengeIds.join(","), version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 0, auraReachedAt: null, completedChallenges: 0 });
    const first = await ensureAssignmentForUid(uid);
    const second = await ensureAssignmentForUid(uid);
    expect(first.challengeIds).toHaveLength(10);
    expect(second.challengeIds).toEqual(first.challengeIds);
    for (const id of ["C08", "C10", "C11", "C12", "C13"]) expect(first.challengeIds).toContain(id);
    expect(second.bonusChallengeIds).toEqual(["C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23"]);
    expect((await refs.score(uid).get()).data()?.registeredForRanking).toBe(true);
    for (const id of ["C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23"]) {
      expect((await refs.challengeProgress(uid, id).get()).data()).toMatchObject({ challengeId: id, status: "available", auraAwarded: 0 });
    }
  });

  it("does not mark flag-only fixture scores as registered during bonus provisioning", async () => {
    const uid = `bonus-flag-only-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, onboardingComplete: true, alias: uid });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C13"], version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: 500, auraReachedAt: null, completedChallenges: 1 });
    await ensureAssignmentForUid(uid);
    expect((await refs.score(uid).get()).data()?.registeredForRanking).not.toBe(true);
  });

  it("does not create bonus progress for a person without completed registration", async () => {
    const uid = `bonus-unregistered-${crypto.randomUUID()}`;
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: ["C13"], version: 2 });
    await expect(ensureAssignmentForUid(uid)).rejects.toThrow("ONBOARDING_REQUIRED");
    expect((await refs.challengeProgress(uid, "C16").get()).exists).toBe(false);
  });

  it("keeps the ten-Challenge pack available when a selfie bonus is paused", async () => {
    const uid = `bonus-paused-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, onboardingComplete: true, alias: uid });
    await refs.challenge("C17").update({ active: false });
    try {
      const assignment = await ensureAssignmentForUid(uid);
      expect(assignment.challengeIds).toHaveLength(10);
      expect(assignment.bonusChallengeIds).toEqual(["C16", "C17", "C18", "C19", "C20", "C21", "C22", "C23"]);
    } finally {
      await refs.challenge("C17").update({ active: true });
    }
  });
});

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("Cloud Trio assignment retirement", () => {
  const legacyIds = ["C01", "C02", "C03", "C06", "C07", "C08", "C09", "C10", "C11", "C13"];

  beforeAll(async () => {
    await Promise.all(challenges.map((challenge) => refs.challenge(challenge.id).set(challenge)));
  });

  async function legacyParticipant(status: "available" | "completed") {
    const uid = `retire-${status}-${crypto.randomUUID()}`;
    await refs.user(uid).set({ uid, alias: uid, onboardingComplete: true });
    await refs.challengeAssignment(uid).set({ eventId: EVENT_ID, userId: uid, challengeIds: legacyIds, signature: legacyIds.join(","), version: 2 });
    await refs.score(uid).set({ eventId: EVENT_ID, userId: uid, alias: uid, auraTotal: status === "completed" ? 500 : 300, completedChallenges: status === "completed" ? 3 : 2, auraReachedAt: new Date("2026-01-01T00:00:00Z") });
    await refs.challengeProgress(uid, "C03").set({ eventId: EVENT_ID, userId: uid, challengeId: "C03", status, auraAwarded: status === "completed" ? 200 : 0, evidence: { scannedUserIds: ["historical-peer"] } });
    return uid;
  }

  it.each(["available", "completed"] as const)("replaces %s C03 in its slot while preserving score and historical progress", async (status) => {
    const uid = await legacyParticipant(status);
    const oldScore = (await refs.score(uid).get()).data();
    const oldProgress = (await refs.challengeProgress(uid, "C03").get()).data();
    const assignment = await ensureAssignmentForUid(uid);
    expect(assignment.challengeIds).toHaveLength(10);
    expect(assignment.challengeIds[2]).toBe("C04");
    expect(assignment.challengeIds).not.toContain("C03");
    for (const id of ["C08", "C10", "C11", "C12", "C13"]) expect(assignment.challengeIds).toContain(id);
    expect(assignment.signature).toBe(challengePackSignature(challenges.filter((challenge) => assignment.challengeIds.includes(challenge.id))));
    expect((await refs.challengeAssignment(uid).get()).data()).toMatchObject({ challengeIds: assignment.challengeIds, signature: assignment.signature });
    expect((await refs.challengeProgress(uid, "C04").get()).data()).toMatchObject({ challengeId: "C04", status: "available", auraAwarded: 0 });
    expect((await refs.challengeProgress(uid, "C03").get()).data()).toEqual(oldProgress);
    expect((await refs.score(uid).get()).data()).toMatchObject({ auraTotal: oldScore?.auraTotal, completedChallenges: oldScore?.completedChallenges, auraReachedAt: oldScore?.auraReachedAt });
  });

  it("keeps one replacement and existing replacement progress across repeated and concurrent calls", async () => {
    const uid = await legacyParticipant("available");
    await refs.challengeProgress(uid, "C04").set({ eventId: EVENT_ID, userId: uid, challengeId: "C04", status: "in_progress", auraAwarded: 0, evidence: { marker: "keep" } });
    const [first, second] = await Promise.all([ensureAssignmentForUid(uid), ensureAssignmentForUid(uid)]);
    const third = await ensureAssignmentForUid(uid);
    expect(first.challengeIds).toEqual(second.challengeIds);
    expect(third.challengeIds).toEqual(first.challengeIds);
    expect(first.challengeIds).toHaveLength(10);
    expect((await refs.challengeProgress(uid, "C04").get()).data()).toMatchObject({ status: "in_progress", evidence: { marker: "keep" } });
    expect((await database.collection("challengeProgress").where("userId", "==", uid).get()).size).toBe(15);
  }, 15_000);

  it("creates replacement progress once when two ensure calls race without existing progress", async () => {
    const uid = await legacyParticipant("available");
    const [first, second] = await Promise.all([ensureAssignmentForUid(uid), ensureAssignmentForUid(uid)]);
    expect(first.challengeIds).toEqual(second.challengeIds);
    expect(first.challengeIds[2]).toBe("C04");
    const progress = await refs.challengeProgress(uid, "C04").get();
    expect(progress.data()).toMatchObject({ challengeId: "C04", status: "available", auraAwarded: 0 });
    expect((await database.collection("challengeProgress").where("userId", "==", uid).get()).size).toBe(15);
  }, 15_000);

  it("fails without mutating the assignment when all active CONNECT alternatives are assigned", async () => {
    const uid = await legacyParticipant("completed");
    const fullConnectIds = ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C13"];
    await refs.challengeAssignment(uid).update({ challengeIds: fullConnectIds, signature: fullConnectIds.join(",") });
    const before = (await refs.challengeAssignment(uid).get()).data();
    await expect(ensureAssignmentForUid(uid)).rejects.toThrow("CHALLENGE_POOL_INCOMPATIBLE");
    expect((await refs.challengeAssignment(uid).get()).data()).toEqual(before);
    expect((await refs.challengeProgress(uid, "C16").get()).exists).toBe(false);
  });
});
