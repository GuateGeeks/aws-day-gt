import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { challengeSecrets } from "../../scripts/data/challenge-secrets";
import { AWS_SERVICE_CHALLENGE_IDS } from "../../shared/challenges/bonus";
import { orderChallengesForUser } from "../../src/features/challenges/challenge-view";

describe("extra AWS service challenges", () => {
  it("offers six distinct three-choice scenarios with private explanations", () => {
    expect(AWS_SERVICE_CHALLENGE_IDS).toHaveLength(6);
    for (const id of AWS_SERVICE_CHALLENGE_IDS) {
      const challenge = challenges.find((item) => item.id === id);
      const secret = challengeSecrets.find((item) => item.challengeId === id);
      expect(challenge).toMatchObject({ category: "CLOUD", auraReward: 150, validationType: "interactive_question" });
      expect(challenge?.configuration.options).toHaveLength(3);
      expect(challenge?.configuration.options?.some((option) => option.id === secret?.correctOptionId)).toBe(true);
      expect(secret?.correctExplanation).toBeTruthy();
      for (const option of challenge!.configuration.options!) {
        if (option.id !== secret?.correctOptionId) expect(secret?.wrongReasons?.[option.id]).toBeTruthy();
      }
      expect(challenge?.configuration).not.toHaveProperty("correctOptionId");
      expect(challenge?.configuration).not.toHaveProperty("wrongReasons");
    }
  });

  it("keeps each player's order stable while spreading categories", () => {
    const items = challenges.filter((item) => item.active).map((challenge) => ({ challenge, progress: { status: "available" as const } }));
    const first = orderChallengesForUser(items, "participant-one");
    const second = orderChallengesForUser(items, "participant-two");
    expect(orderChallengesForUser(items, "participant-one").map((item) => item.challenge.id)).toEqual(first.map((item) => item.challenge.id));
    expect(second.map((item) => item.challenge.id)).not.toEqual(first.map((item) => item.challenge.id));
    expect(first.map((item) => item.challenge.id).sort()).toEqual(items.map((item) => item.challenge.id).sort());
    expect(first.slice(0, 6).some((item) => item.challenge.category !== "CLOUD")).toBe(true);
    expect(first.slice(0, 6).some((item) => item.challenge.category === "CLOUD")).toBe(true);
    expect(first.slice(0, 8).filter((item, index, subset) => index > 0 && item.challenge.category === subset[index - 1]!.challenge.category).length).toBeLessThan(3);
  });
});
