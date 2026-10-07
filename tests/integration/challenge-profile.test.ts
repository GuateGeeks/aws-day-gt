import { beforeAll, describe, expect, it } from "vitest";
import { refs } from "../../functions/src/shared/refs";
import { setChallengeProfileForUid } from "../../functions/src/challenges/set-profile";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("Challenge profile persistence", () => {
  beforeAll(async () => {
    await refs.user("profile-user").set({ uid: "profile-user", onboardingComplete: true, role: "participant" });
  });

  it("saves comparison fields once and rejects a later role change", async () => {
    await setChallengeProfileForUid("profile-user", {
      primaryRole: "Cloud", experienceLevel: "Mid", firstAwsCommunityDay: false, awsInterest: ["Serverless"]
    });
    await expect(setChallengeProfileForUid("profile-user", {
      primaryRole: "Product", experienceLevel: "Mid", firstAwsCommunityDay: false, awsInterest: ["Serverless"]
    })).rejects.toThrow();
    expect((await refs.user("profile-user").get()).data()?.primaryRole).toBe("Cloud");
  });
});
