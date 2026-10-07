import { describe, expect, it } from "vitest";
import { challengeProfileSchema } from "../../shared/challenges/profile";

describe("Challenge profile", () => {
  it("accepts the small profile needed for social validation", () => {
    expect(challengeProfileSchema.parse({
      primaryRole: "Product", experienceLevel: "Mid", firstAwsCommunityDay: true,
      awsInterest: ["Serverless", "Data"]
    })).toMatchObject({ primaryRole: "Product", firstAwsCommunityDay: true });
  });

  it("rejects unsupported roles and duplicate interests", () => {
    expect(challengeProfileSchema.safeParse({ primaryRole: "Unknown", experienceLevel: "Mid", firstAwsCommunityDay: false }).success).toBe(false);
    expect(challengeProfileSchema.safeParse({ primaryRole: "Cloud", experienceLevel: "Junior", firstAwsCommunityDay: false, awsInterest: ["Data", "Data"] }).success).toBe(false);
  });
});
