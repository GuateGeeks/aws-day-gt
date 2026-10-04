import { z } from "zod";

export const evidenceTypeSchema = z.enum(["photo", "comment", "word"]);

export const evidenceValidationSchema = z.object({
  evidenceType: evidenceTypeSchema,
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  requiresConsent: z.boolean().optional(),
  allowShortToken: z.boolean().optional()
});

export const missionSchema = z.object({
  id: z.string().regex(/^M\d{2}$/),
  eventId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  evidenceType: evidenceTypeSchema,
  points: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  category: z.string().min(1),
  validation: evidenceValidationSchema,
  sessionId: z.string().optional(),
  slot: z.string().optional(),
  room: z.string().optional(),
  speaker: z.string().optional(),
  requiresAttendance: z.boolean().optional(),
  tags: z.array(z.string()),
  active: z.boolean()
}).superRefine((mission, context) => {
  const expected = mission.evidenceType === "photo" ? 15 : mission.evidenceType === "comment" ? 10 : 5;
  if (mission.points !== expected) context.addIssue({ code: "custom", path: ["points"], message: "Points do not match evidence type" });
  if (mission.validation.evidenceType !== mission.evidenceType) context.addIssue({ code: "custom", path: ["validation", "evidenceType"], message: "Validation type mismatch" });
});

export const onboardingInputSchema = z.object({
  alias: z.string().trim().min(3).max(24).regex(/^[\p{L}\p{N}_.-]+$/u),
  interests: z.array(z.string()).max(6),
  consent: z.object({
    termsVersion: z.string().min(1),
    accepted: z.literal(true),
    photoPublication: z.boolean(),
    marketing: z.boolean()
  })
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
