import { beforeAll, describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { database, refs } from "../../functions/src/shared/refs";
import { completeChallengeForUid } from "../../functions/src/challenges/complete";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("Aura awards", () => {
  beforeAll(async () => {
    const challenge = challenges.find((item) => item.id === "C12")!;
    await refs.challenge("C12").set(challenge);
    await refs.challengeAssignment("aura-user").set({ eventId: challenge.eventId, userId: "aura-user", challengeIds: ["C12"], version: 2 });
    await refs.challengeProgress("aura-user", "C12").set({ eventId: challenge.eventId, userId: "aura-user", challengeId: "C12", status: "available" });
    await refs.score("aura-user").set({ eventId: challenge.eventId, userId: "aura-user", alias: "Aura", totalPoints: 25, auraTotal: 0, completedChallenges: 0 });
  });

  it("awards once across repeated requests and leaves legacy points intact", async () => {
    const first = await completeChallengeForUid("aura-user", { challengeId: "C12", operationId: "first", response: { trackId: "ai" } });
    const second = await completeChallengeForUid("aura-user", { challengeId: "C12", operationId: "second", response: { trackId: "data" } });
    expect(first).toMatchObject({ status: "completed", auraAwarded: 50 });
    expect(second).toMatchObject({ status: "completed", auraAwarded: 50 });
    expect((await refs.score("aura-user").get()).data()).toMatchObject({ totalPoints: 25, auraTotal: 50, completedChallenges: 1 });
    expect((await database.collection("challengeProgress").where("userId", "==", "aura-user").get()).size).toBe(1);
  });
});
