import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import type { AssignedChallenge } from "../../src/features/challenges/useChallenges";
import { challengeSummary, nextAvailableChallenge } from "../../src/features/challenges/challenge-view";

function assigned(id: string, status: AssignedChallenge["progress"]["status"], active = true): AssignedChallenge {
  const challenge = challenges.find((item) => item.id === id)!;
  return { challenge: { ...challenge, active }, progress: { eventId: challenge.eventId, userId: "user", challengeId: id, status, auraAwarded: status === "completed" ? challenge.auraReward : 0 } };
}

describe("Challenge presentation", () => {
  it("keeps the ten assigned challenges separate from the two selfie bonuses", () => {
    const summary = challengeSummary([assigned("C01", "completed"), assigned("C13", "available"), assigned("C16", "completed"), assigned("C17", "processing")]);
    expect(summary.mainCompleted).toBe(1);
    expect(summary.selfieCompleted).toBe(1);
    expect(summary.aura).toBe(250);
  });

  it("offers the next actionable challenge and skips locked, paused, processing and completed ones", () => {
    const items = [assigned("C01", "completed"), assigned("C02", "locked"), assigned("C03", "available", false), assigned("C04", "processing"), assigned("C16", "available")];
    expect(nextAvailableChallenge(items)?.challenge.id).toBe("C16");
    expect(nextAvailableChallenge(items, "C16")).toBeUndefined();
  });

  it("separates lost Aura from rewards still available", () => {
    const failed = assigned("C06", "failed");
    failed.progress.auraDeducted = 150;
    const summary = challengeSummary([failed, assigned("C07", "available"), assigned("C09", "processing"), assigned("C16", "completed")]);
    expect(summary.aura).toBe(-50);
    expect(summary.auraPotential).toBe(100);
    expect(summary.auraInReview).toBe(100);
    expect(nextAvailableChallenge([failed, assigned("C07", "available")])?.challenge.id).toBe("C07");
  });
});
