import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { validateCloudResponse, validateCloudTrio, validateSocialPair, validateTrack } from "../../shared/challenges/validators";
import type { ChallengeProfile } from "../../shared/challenges/profile";

const challenge = (id: string) => challenges.find((item) => item.id === id)!;
const dev: ChallengeProfile = { primaryRole: "Development", experienceLevel: "Junior", firstAwsCommunityDay: false, awsInterest: ["Serverless"] };
const data: ChallengeProfile = { primaryRole: "Data", experienceLevel: "Senior", firstAwsCommunityDay: true, awsInterest: ["Serverless", "Data"] };
const cloud: ChallengeProfile = { primaryRole: "Cloud", experienceLevel: "Mid", firstAwsCommunityDay: false, awsInterest: ["Architecture"] };

describe("Challenge validators", () => {
  it("checks every Cloud answer against private keys", () => {
    expect(validateCloudResponse(challenge("C06"), { sequence: ["api-gateway", "lambda", "dynamodb"] }, { expectedSequence: ["api-gateway", "lambda", "dynamodb"] })).toBe(true);
    expect(validateCloudResponse(challenge("C06"), { sequence: ["lambda", "api-gateway", "dynamodb"] }, { expectedSequence: ["api-gateway", "lambda", "dynamodb"] })).toBe(false);
    expect(validateCloudResponse(challenge("C07"), { matches: { files: "s3", code: "lambda", nosql: "dynamodb", genai: "bedrock" } }, { expectedMatches: { files: "s3", code: "lambda", nosql: "dynamodb", genai: "bedrock" } })).toBe(true);
    expect(validateCloudResponse(challenge("C07"), { matches: { files: "s3" } }, { expectedMatches: { files: "s3", code: "lambda" } })).toBe(false);
    expect(validateCloudResponse(challenge("C08"), { optionId: "dynamodb" }, { correctOptionId: "dynamodb" })).toBe(true);
    expect(validateCloudResponse(challenge("C09"), { optionId: "s3" }, { correctOptionId: "lambda" })).toBe(false);
  });
  it("checks pair and trio profile relationships", () => {
    expect(validateSocialPair("C01", dev, data)).toBe(true);
    expect(validateSocialPair("C01", dev, { ...data, primaryRole: "Development" })).toBe(false);
    expect(validateSocialPair("C02", dev, data)).toBe(true);
    expect(validateSocialPair("C02", dev, cloud)).toBe(false);
    expect(validateSocialPair("C04", dev, data)).toBe(true);
    expect(validateSocialPair("C04", dev, cloud)).toBe(false);
    expect(validateSocialPair("C05", dev, data)).toBe(true);
    expect(validateSocialPair("C05", dev, { ...data, experienceLevel: "Junior" })).toBe(false);
    expect(validateCloudTrio(dev, [data, cloud])).toBe(true);
    expect(validateCloudTrio(dev, [data, { ...cloud, primaryRole: "Data" }])).toBe(false);
  });
  it("accepts only configured track options", () => {
    expect(validateTrack("ai", challenge("C12").configuration.tracks)).toBe(true);
    expect(validateTrack("other", challenge("C12").configuration.tracks)).toBe(false);
  });
});
