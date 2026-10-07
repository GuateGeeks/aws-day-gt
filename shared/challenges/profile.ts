import { z } from "zod";

export const primaryRoles = ["Development", "Cloud", "Data", "AI", "Cybersecurity", "DevOps", "Product", "Student", "Other"] as const;
export const experienceLevels = ["Student", "Junior", "Mid", "Senior", "Other"] as const;
export const awsInterests = ["Serverless", "AI / Bedrock", "Data", "Containers", "DevOps", "Security", "Architecture", "Other"] as const;

export const challengeProfileSchema = z.object({
  primaryRole: z.enum(primaryRoles),
  experienceLevel: z.enum(experienceLevels),
  firstAwsCommunityDay: z.boolean(),
  awsInterest: z.array(z.enum(awsInterests)).max(4).default([])
}).superRefine((profile, context) => {
  if (new Set(profile.awsInterest).size !== profile.awsInterest.length) {
    context.addIssue({ code: "custom", path: ["awsInterest"], message: "Duplicate interests" });
  }
});

export type ChallengeProfile = z.infer<typeof challengeProfileSchema>;
